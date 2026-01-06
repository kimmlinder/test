import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserSettings {
  display_name?: string;
  personal_role?: string;
  personal_company?: string;
  personal_tone?: string;
  personal_greeting_style?: string;
  personal_emoji_usage?: string;
  personal_text_length?: string;
  ai_conversation_tone?: string;
  ai_language?: string;
  ai_response_length?: string;
  business_brand_name?: string;
  business_industry?: string;
  business_target_audience?: string;
  business_bio?: string;
  business_mission?: string;
  business_usp?: string;
}

function buildPersonalizedPrompt(settings?: UserSettings): string {
  const name = settings?.display_name || 'there';
  const role = settings?.personal_role || '';
  const company = settings?.personal_company || settings?.business_brand_name || '';
  const industry = settings?.business_industry || '';
  const audience = settings?.business_target_audience || '';
  const bio = settings?.business_bio || '';
  const mission = settings?.business_mission || '';
  const usp = settings?.business_usp || '';
  
  // Tone settings
  const tone = settings?.ai_conversation_tone || settings?.personal_tone || 'friendly';
  const greetingStyle = settings?.personal_greeting_style || 'friendly';
  const emojiUsage = settings?.personal_emoji_usage || 'rarely';
  const responseLength = settings?.ai_response_length || settings?.personal_text_length || 'medium';
  const language = settings?.ai_language || 'en';

  // Build context about the user
  let userContext = '';
  if (name !== 'there') {
    userContext += `\nThe user's name is ${name}.`;
  }
  if (role) {
    userContext += ` They work as a ${role}`;
    if (company) userContext += ` at ${company}`;
    userContext += '.';
  }
  if (industry) {
    userContext += ` They are in the ${industry} industry.`;
  }
  if (audience) {
    userContext += ` Their target audience is: ${audience}.`;
  }
  if (bio) {
    userContext += ` About them: ${bio}`;
  }
  if (mission) {
    userContext += ` Their mission: ${mission}`;
  }
  if (usp) {
    userContext += ` Their unique value: ${usp}`;
  }

  // Build tone instructions
  let toneInstructions = '';
  switch (tone) {
    case 'professional':
      toneInstructions = 'Maintain a professional and polished tone. Be clear and business-like.';
      break;
    case 'casual':
      toneInstructions = 'Be casual and relaxed. Chat like a friendly colleague.';
      break;
    case 'enthusiastic':
      toneInstructions = 'Be energetic and enthusiastic! Show excitement about their projects.';
      break;
    default:
      toneInstructions = 'Be warm, friendly, and approachable. Balance professionalism with personality.';
  }

  // Emoji usage
  let emojiInstructions = '';
  switch (emojiUsage) {
    case 'frequently':
      emojiInstructions = 'Use emojis frequently to add personality and warmth. 🎬✨';
      break;
    case 'sometimes':
      emojiInstructions = 'Use emojis occasionally where they add value.';
      break;
    default:
      emojiInstructions = 'Use emojis sparingly, only when they really enhance the message.';
  }

  // Response length
  let lengthInstructions = '';
  switch (responseLength) {
    case 'short':
      lengthInstructions = 'Keep responses concise and to the point. Be brief.';
      break;
    case 'long':
      lengthInstructions = 'Provide detailed, comprehensive responses with examples and explanations.';
      break;
    default:
      lengthInstructions = 'Use balanced response lengths - detailed when needed, concise when possible.';
  }

  // Greeting style
  let greetingInstructions = '';
  switch (greetingStyle) {
    case 'formal':
      greetingInstructions = 'Use formal greetings and address the user respectfully.';
      break;
    case 'casual':
      greetingInstructions = 'Use casual, relaxed greetings like "Hey!" or "Hi there!"';
      break;
    default:
      greetingInstructions = 'Use friendly but professional greetings.';
  }

  return `You are a personalized AI assistant for creative media projects. Your role is to help users brainstorm and describe their media project ideas clearly.
${userContext}

PERSONALIZATION INSTRUCTIONS:
- ${toneInstructions}
- ${emojiInstructions}
- ${lengthInstructions}
- ${greetingInstructions}
- Preferred language: ${language === 'en' ? 'English' : language}. Always respond in the same language the user writes in.

Your responsibilities:
1. Ask clarifying questions to understand what type of media they want (video, photo, graphic design, animation, etc.)
2. Help them define the style, mood, and aesthetic they're looking for
3. Understand their target audience and purpose${audience ? ` (remember their target audience is: ${audience})` : ''}
4. Get details about any specific requirements (dimensions, duration, colors, branding)
5. Summarize their project brief in a clear, professional format
6. When the user provides reference images, analyze them and incorporate their style, colors, and composition into your suggestions
${company || industry ? `7. Keep their business context in mind when making suggestions` : ''}

When the user feels ready, generate a detailed project brief that includes:
- Project Type
- Description
- Style & Mood
- Target Audience
- Technical Requirements
- Reference ideas or inspiration
- Timeline preferences

IMPORTANT: If the user asks for a mockup, visual, preview, concept art, or wants to see what something might look like, respond with EXACTLY this format on a new line:
[GENERATE_MOCKUP: detailed description of what to visualize]

Be ${tone}, creative, and encouraging. Help users articulate their vision even if they're not sure what they want yet.${name !== 'there' ? ` Address them by name occasionally to make it personal.` : ''}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, generateImage, imagePrompt, userSettings } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // If generateImage is requested, use the image generation model
    if (generateImage && imagePrompt) {
      console.log("Generating mockup image with prompt:", imagePrompt);
      
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
              content: `Create a professional mockup or visual concept for: ${imagePrompt}. Make it look like a polished design concept or storyboard frame. High quality, professional media production style.`
            }
          ],
          modalities: ["image", "text"]
        }),
      });

      if (!imageResponse.ok) {
        if (imageResponse.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (imageResponse.status === 402) {
          return new Response(JSON.stringify({ error: "Payment required. Please add credits to continue." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const errorText = await imageResponse.text();
        console.error("Image generation error:", imageResponse.status, errorText);
        return new Response(JSON.stringify({ error: "Failed to generate image" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const imageData = await imageResponse.json();
      console.log("Image generation response received");
      
      // Extract image from response
      const generatedImage = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      const textContent = imageData.choices?.[0]?.message?.content || "Here's your mockup!";
      
      return new Response(JSON.stringify({ 
        type: "image",
        image: generatedImage,
        text: textContent
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build personalized system prompt based on user settings
    const systemPrompt = buildPersonalizedPrompt(userSettings);

    // Process messages to handle multimodal content
    const processedMessages = messages.map((msg: any) => {
      // If the message already has the multimodal format, use it as-is
      if (Array.isArray(msg.content)) {
        return msg;
      }
      // Otherwise, return simple text message
      return { role: msg.role, content: msg.content };
    });

    console.log("Processing chat with personalized settings:", userSettings?.display_name || 'anonymous');

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
          ...processedMessages,
        ],
        stream: true,
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
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error in ai-media-assistant:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
