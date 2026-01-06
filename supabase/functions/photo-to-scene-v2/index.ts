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
    const { action, imageBase64, images, promptCount, prompts, referenceImages, style, mood } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (action === "generate_prompts") {
      // V2: Enhanced prompt generation with style and mood analysis
      // Support multiple reference images
      const allImages = images && images.length > 0 ? images : (imageBase64 ? [imageBase64] : []);
      const imageCount = allImages.length;
      
      const systemPrompt = `You are an expert cinematographer and visual storyteller. Analyze the provided ${imageCount > 1 ? `${imageCount} reference images` : 'image'} and generate ${promptCount || 12} unique, creative prompts that capture different angles, compositions, and moods of the scene.

For each prompt, provide:
1. A short, descriptive title (3-5 words)
2. A detailed scene description optimized for AI image generation (50-80 words)
3. Camera angle and shot type recommendation
4. Lighting suggestion
5. Mood/atmosphere rating (1-5 scale for: dramatic, serene, dynamic, intimate, epic)

${style ? `Preferred style: ${style}` : ''}
${mood ? `Desired mood: ${mood}` : ''}
${imageCount > 1 ? `Consider elements from all ${imageCount} reference images to create a cohesive visual narrative.` : ''}

Be creative and vary the perspectives significantly - include extreme angles, macro details, wide establishing shots, and intimate close-ups. Focus on storytelling potential.

Respond with a JSON array of objects with keys: title, description, cameraAngle, shotType, lighting, moodRatings.`;

      // Build content array with all images
      const contentArray: any[] = [
        { type: "text", text: `Analyze ${imageCount > 1 ? 'these images' : 'this image'} and generate the creative prompts as specified.` }
      ];
      
      // Add all images to the content
      for (const img of allImages) {
        contentArray.push({ type: "image_url", image_url: { url: img } });
      }

      // Use Nano banana model for faster, smarter prompt generation
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image-preview",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: contentArray
            }
          ],
          modalities: ["image", "text"]
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI Gateway error:", response.status, errorText);
        
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Usage limit reached. Please upgrade your plan." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        throw new Error("Failed to generate prompts");
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      
      // Parse the JSON response
      let prompts = [];
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          prompts = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error("Failed to parse prompts:", parseError);
        // Fallback: create simple prompts from the content
        prompts = Array.from({ length: promptCount || 12 }, (_, i) => ({
          title: `Scene ${i + 1}`,
          description: `Creative angle ${i + 1} of the scene`,
          cameraAngle: "Eye level",
          shotType: "Medium shot",
          lighting: "Natural",
          moodRatings: { dramatic: 3, serene: 3, dynamic: 3, intimate: 3, epic: 3 }
        }));
      }

      return new Response(JSON.stringify({ prompts }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "generate_images") {
      // V2: Parallel image generation with style consistency
      // Support multiple reference images
      const allRefImages = referenceImages && referenceImages.length > 0 ? referenceImages : [];
      const generatedImages = [];

      for (const prompt of prompts) {
        try {
          const imagePrompt = `${prompt.description}. Camera: ${prompt.cameraAngle}, ${prompt.shotType}. Lighting: ${prompt.lighting}. Style: cinematic, professional, high-quality.`;
          
          // Build content array with reference images
          const contentArray: any[] = [{ type: "text", text: imagePrompt }];
          
          // Add reference images (limit to first 3 for performance)
          for (const refImg of allRefImages.slice(0, 3)) {
            contentArray.push({ type: "image_url", image_url: { url: refImg } });
          }
          
          const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                  content: contentArray
                }
              ],
              modalities: ["image", "text"]
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
            
            if (imageUrl) {
              generatedImages.push({
                promptId: prompt.id,
                title: prompt.title,
                imageUrl,
                duration: prompt.moodRatings?.dynamic > 3 ? 2 : 3,
                cameraAngle: prompt.cameraAngle,
                shotType: prompt.shotType,
              });
            }
          }
        } catch (imgError) {
          console.error("Image generation error for prompt:", prompt.id, imgError);
        }
      }

      return new Response(JSON.stringify({ images: generatedImages }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "analyze_scene") {
      // V2 exclusive: Deep scene analysis (supports multiple images)
      const allImages = images && images.length > 0 ? images : (imageBase64 ? [imageBase64] : []);
      const imageCount = allImages.length;
      
      // Build content array with all images
      const contentArray: any[] = [
        { type: "text", text: `Analyze ${imageCount > 1 ? 'these images' : 'this image'} comprehensively.` }
      ];
      
      for (const img of allImages) {
        contentArray.push({ type: "image_url", image_url: { url: img } });
      }
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `Analyze the ${imageCount > 1 ? 'images' : 'image'} and provide:
1. Main subjects and their positions
2. Color palette (hex codes)
3. Lighting analysis
4. Suggested camera movements for video
5. Mood and atmosphere
6. Storytelling potential
7. Recommended music/sound style
${imageCount > 1 ? '8. Common themes and elements across all images' : ''}

Return as JSON with keys: subjects, colorPalette, lighting, cameraMovements, mood, storyPotential, audioStyle${imageCount > 1 ? ', commonThemes' : ''}.`
            },
            {
              role: "user",
              content: contentArray
            }
          ],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze scene");
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      
      let analysis = {};
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        }
      } catch {
        analysis = { raw: content };
      }

      return new Response(JSON.stringify({ analysis }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("photo-to-scene-v2 error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
