import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, imageBase64, promptCount, prompts, referenceImage } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Action 1: Generate prompts from reference photo
    if (action === 'generate_prompts') {
      console.log("Generating angle prompts from reference photo, count:", promptCount);

      const systemPrompt = `You are an expert cinematographer and photographer. Analyze the provided reference image and generate ${promptCount} different, detailed prompts that vary camera angles and shot types.

For each prompt, provide:
1. A short title describing the shot type (e.g., "Eye-Level Medium Shot", "Low-Angle Wide Shot")
2. A detailed description of how this shot would look, including camera angle, distance, composition, and mood

The prompts should cover a variety of:
- Camera angles: eye-level, low-angle, high-angle, dutch angle, bird's eye, worm's eye
- Shot types: extreme close-up, close-up, medium close-up, medium shot, medium wide, wide shot, extreme wide
- Compositions: rule of thirds, centered, leading lines, framing, symmetry

Respond in this exact JSON format:
{
  "prompts": [
    {
      "title": "Eye-Level Medium Shot",
      "description": "A medium shot at eye-level captures the subject from waist up, creating an intimate connection with the viewer..."
    }
  ]
}`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { 
              role: "user", 
              content: [
                { type: "text", text: `Analyze this reference image and generate ${promptCount} different, detailed prompts varying camera angles and shot types.` },
                { type: "image_url", image_url: { url: imageBase64 } }
              ]
            }
          ],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Payment required. Please add credits to continue." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const errorText = await response.text();
        console.error("Prompt generation error:", response.status, errorText);
        throw new Error("Failed to generate prompts");
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      
      // Parse JSON from response
      let parsedPrompts;
      try {
        // Try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedPrompts = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        // Fallback: create prompts from text
        parsedPrompts = {
          prompts: Array.from({ length: promptCount }, (_, i) => ({
            title: `Shot Type ${i + 1}`,
            description: `Camera angle variation ${i + 1} of the reference image.`
          }))
        };
      }

      return new Response(JSON.stringify({ prompts: parsedPrompts.prompts }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action 2: Generate images from selected prompts
    if (action === 'generate_images') {
      console.log("Generating images from prompts, count:", prompts?.length);

      if (!prompts || prompts.length === 0) {
        throw new Error("No prompts provided");
      }

      const generatedImages = [];
      
      // Generate images sequentially to avoid rate limits
      for (const prompt of prompts) {
        console.log("Generating image for:", prompt.title);
        
        const imagePrompt = `${prompt.description}. Professional photography style, high quality, cinematic lighting. Based on the reference image style.`;
        
        try {
          const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-image-preview",
              messages: [
                { 
                  role: "user", 
                  content: [
                    { type: "text", text: imagePrompt },
                    ...(referenceImage ? [{ type: "image_url", image_url: { url: referenceImage } }] : [])
                  ]
                }
              ],
              modalities: ["image", "text"]
            }),
          });

          if (!imageResponse.ok) {
            if (imageResponse.status === 429) {
              console.log("Rate limited, waiting before retry...");
              await new Promise(resolve => setTimeout(resolve, 2000));
              continue;
            }
            console.error("Image generation failed for prompt:", prompt.title);
            continue;
          }

          const imageData = await imageResponse.json();
          const generatedImage = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          
          if (generatedImage) {
            generatedImages.push({
              promptId: prompt.id,
              title: prompt.title,
              imageUrl: generatedImage,
              duration: 3 + Math.floor(Math.random() * 3), // Random 3-5 seconds
            });
          }

          // Small delay between requests to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (imgError) {
          console.error("Error generating image for prompt:", prompt.title, imgError);
        }
      }

      if (generatedImages.length === 0) {
        throw new Error("Failed to generate any images");
      }

      return new Response(JSON.stringify({ images: generatedImages }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action specified");

  } catch (error) {
    console.error("Error in photo-to-prompts:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
