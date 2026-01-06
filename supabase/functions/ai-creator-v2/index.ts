import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode, prompt, projectType, style, referenceImage } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Mode-specific system prompts for faster, more focused responses
    const systemPrompts: Record<string, string> = {
      quick: `You are an expert creative director. Provide a CONCISE, actionable creative brief in under 100 words. Focus on: key visual style, color palette (3 colors max), primary message, and one unique element. Be direct and practical.`,
      
      detailed: `You are an expert creative director and production specialist. Provide a comprehensive creative brief including:
- Visual concept and style direction
- Color palette with hex codes
- Key messaging and tone
- Shot/design composition suggestions
- Technical requirements
- Timeline considerations
Keep it organized with clear headers.`,

      brainstorm: `You are a creative brainstorming partner. Generate 5 unique, innovative concepts for the project. Each concept should be 2-3 sentences max and include:
- A catchy concept name
- Core visual idea
- What makes it unique
Format as a numbered list.`,

      refine: `You are a creative refinement specialist. Take the existing concept and enhance it by:
- Adding more specific visual details
- Suggesting 3 alternative approaches
- Identifying potential challenges and solutions
- Recommending next steps
Be concise but thorough.`,

      image: `Based on the creative brief provided, generate a detailed image prompt for creating a mockup. The prompt should be specific about:
- Composition and framing
- Lighting and mood
- Colors and textures
- Style (photorealistic, illustrated, etc.)
Return ONLY the image generation prompt, nothing else.`
    };

    const selectedMode = mode || 'detailed';
    const systemPrompt = systemPrompts[selectedMode] || systemPrompts.detailed;

    // Build user message based on inputs
    let userMessage = prompt;
    if (projectType) {
      userMessage = `Project Type: ${projectType}\n\n${prompt}`;
    }
    if (style) {
      userMessage += `\n\nDesired Style: ${style}`;
    }

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Handle reference image if provided
    if (referenceImage && selectedMode !== 'image') {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: userMessage + '\n\nUse this reference image for style and mood inspiration.' },
          { type: 'image_url', image_url: { url: referenceImage } }
        ]
      });
    } else {
      messages.push({ role: 'user', content: userMessage });
    }

    // Use flash-lite for quick mode, flash for others (faster than pro)
    const model = selectedMode === 'quick' ? 'google/gemini-2.5-flash-lite' : 'google/gemini-2.5-flash';

    console.log(`AI Creator V2 - Mode: ${selectedMode}, Model: ${model}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: 'Usage limit reached. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', status, errorText);
      throw new Error('Failed to generate response');
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    console.error('AI Creator V2 error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});