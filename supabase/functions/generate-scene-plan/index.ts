import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Scene {
  sceneNumber: number;
  title: string;
  duration: string;
  description: string;
  shotType: string;
  location: string;
  actors: string[];
  props: string[];
  audio: string;
  notes: string;
}

interface ScenePlan {
  projectTitle: string;
  totalDuration: string;
  scenes: Scene[];
  overview: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectName, videoDescription, videoDuration, videoStyle, existingConversation } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating scene plan for:", projectName, "Duration:", videoDuration, "Style:", videoStyle);

    const systemPrompt = `You are a professional video production assistant specializing in creating detailed scene plans and shot lists.

Your task is to create a comprehensive scene-by-scene breakdown for a video project. Each scene should be detailed enough for a production team to understand and execute.

IMPORTANT: You must respond with ONLY valid JSON, no markdown, no code blocks, no explanations. Just the raw JSON object.

The JSON structure must be exactly:
{
  "projectTitle": "string - the project name",
  "totalDuration": "string - formatted total duration like '1:30' or '2:45'",
  "overview": "string - brief 1-2 sentence overview of the video",
  "scenes": [
    {
      "sceneNumber": number,
      "title": "string - short descriptive title for the scene",
      "duration": "string - duration like '5s' or '10s'",
      "description": "string - detailed description of what happens in this scene",
      "shotType": "string - e.g., 'Wide shot', 'Close-up', 'Medium shot', 'Aerial', 'Tracking shot'",
      "location": "string - where this scene takes place",
      "actors": ["array of actor/character names or descriptions"],
      "props": ["array of props needed"],
      "audio": "string - audio/music description for this scene",
      "notes": "string - any production notes or special instructions"
    }
  ]
}

Guidelines:
- Create enough scenes to fill the target duration naturally
- Each scene should have a clear purpose in the overall narrative
- Vary shot types for visual interest
- Consider practical production requirements
- Include specific audio/music cues where appropriate
- Add helpful notes for complex shots or transitions`;

    let userPrompt = `Create a detailed scene plan for the following video project:

Project Name: ${projectName || 'Untitled Video'}
Target Duration: ${videoDuration} seconds
${videoStyle ? `Style: ${videoStyle}` : ''}

Video Concept:
${videoDescription}`;

    if (existingConversation) {
      userPrompt += `\n\nAdditional context from previous discussion:\n${existingConversation}`;
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
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
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
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate scene plan");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("Raw AI response:", content.substring(0, 500));

    // Parse the JSON response
    let scenePlan: ScenePlan;
    try {
      // Try to extract JSON if it's wrapped in markdown code blocks
      let jsonContent = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
      }
      
      scenePlan = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error("Failed to parse scene plan JSON:", parseError);
      console.error("Content was:", content);
      throw new Error("Failed to parse AI response as JSON");
    }

    // Validate the response structure
    if (!scenePlan.scenes || !Array.isArray(scenePlan.scenes)) {
      throw new Error("Invalid scene plan structure");
    }

    console.log("Successfully generated scene plan with", scenePlan.scenes.length, "scenes");

    return new Response(JSON.stringify({ scenePlan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-scene-plan:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
