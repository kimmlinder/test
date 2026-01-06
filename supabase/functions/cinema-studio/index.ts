import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CameraPreset {
  id: string;
  name: string;
  lens: string;
  focalLength: string;
  description: string;
}

const CAMERA_PRESETS: CameraPreset[] = [
  { id: 'arri-alexa-35', name: 'Arri Alexa 35', lens: 'ARRI Signature Prime', focalLength: '24mm', description: 'Cinematic film look with organic grain' },
  { id: 'red-v-raptor', name: 'RED V-Raptor', lens: 'Zeiss Supreme Prime', focalLength: '35mm', description: 'Sharp digital cinema with high dynamic range' },
  { id: 'sony-venice-2', name: 'Sony Venice 2', lens: 'Sony CineAlta Prime', focalLength: '50mm', description: 'Dual ISO, excellent low-light performance' },
  { id: 'blackmagic-ursa', name: 'Blackmagic URSA', lens: 'Sigma Cine Prime', focalLength: '85mm', description: 'Film-like colors, affordable cinema' },
  { id: 'canon-c500', name: 'Canon C500 Mark II', lens: 'Canon CN-E Prime', focalLength: '100mm', description: 'Dual Pixel AF, versatile documentary style' },
  { id: 'panavision-dxl2', name: 'Panavision DXL2', lens: 'Primo 70', focalLength: '40mm', description: 'Large format, classic Hollywood look' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, prompt, cameraPreset, aspectRatio, imageBase64, cameraMovement, duration, startingFrame } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const camera = CAMERA_PRESETS.find(c => c.id === cameraPreset) || CAMERA_PRESETS[0];
    
    if (action === 'generate-image') {
      // Generate cinematic 21:9 image using Nano Banana
      const imagePrompt = `
        Professional cinematic still frame shot on ${camera.name} with ${camera.lens} ${camera.focalLength} lens.
        ${camera.description}.
        Ultra-wide 21:9 cinematic aspect ratio with letterbox framing.
        Scene: ${prompt}
        Style: High-end film production quality, cinematic color grading, dramatic lighting, shallow depth of field, film grain texture, anamorphic lens flares.
        Camera characteristics: Natural bokeh, organic film texture, professional cinema look.
      `;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [{ role: 'user', content: imagePrompt }],
          modalities: ['image', 'text'],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: 'Payment required. Please add credits.' }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const errorText = await response.text();
        console.error('Image generation error:', errorText);
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      const description = data.choices?.[0]?.message?.content || '';

      return new Response(JSON.stringify({ 
        success: true, 
        imageUrl,
        description,
        camera: camera.name,
        lens: `${camera.lens} ${camera.focalLength}`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'generate-video') {
      console.log('Starting video generation...');
      
      // Build cinematic video prompt
      const movementDescriptions: Record<string, string> = {
        'static': 'locked off shot with subtle atmospheric movement',
        'pan-left': 'smooth cinematic pan left revealing the scene',
        'pan-right': 'smooth cinematic pan right revealing the scene',
        'dolly-in': 'slow dramatic dolly push toward the subject',
        'dolly-out': 'slow dolly pull out revealing the environment',
        'orbit': 'orbital camera movement around the subject',
        'crane-up': 'crane shot rising upward majestically',
        'tracking': 'smooth tracking shot following the action',
      };

      const movement = movementDescriptions[cameraMovement] || movementDescriptions['static'];
      
      const videoPrompt = `Cinematic ${duration || 5} second video shot on ${camera.name} with ${camera.lens} ${camera.focalLength} lens. ${camera.description}. ${movement}. Scene: ${prompt}. Style: Professional film production, cinematic color grading, dramatic lighting, shallow depth of field, film grain texture. Ultra high quality cinema footage.`;

      console.log('Video prompt:', videoPrompt);

      // Use Lovable's video generation API
      const videoResponse = await fetch('https://ai.gateway.lovable.dev/v1/video/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: videoPrompt,
          aspect_ratio: '21:9',
          duration: Math.min(duration || 5, 10),
          starting_frame: startingFrame || undefined,
        }),
      });

      if (!videoResponse.ok) {
        const errorText = await videoResponse.text();
        console.error('Video generation API error:', errorText);
        
        if (videoResponse.status === 429) {
          return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        throw new Error('Failed to generate video');
      }

      const videoData = await videoResponse.json();
      console.log('Video generation response:', JSON.stringify(videoData));

      const videoUrl = videoData.video_url || videoData.url || videoData.data?.url;

      if (!videoUrl) {
        console.error('No video URL in response:', videoData);
        throw new Error('No video URL received from generation');
      }

      return new Response(JSON.stringify({ 
        success: true, 
        videoUrl,
        camera: camera.name,
        movement: cameraMovement,
        duration: duration || 5,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'generate-video-prompt') {
      // Generate a cinematic video prompt based on image and settings
      const movementDescriptions: Record<string, string> = {
        'static': 'locked off shot, no camera movement',
        'pan-left': 'smooth pan left revealing the scene',
        'pan-right': 'smooth pan right revealing the scene',
        'tilt-up': 'slow tilt up from ground to sky',
        'tilt-down': 'slow tilt down from sky to ground',
        'dolly-in': 'slow dolly push in toward the subject',
        'dolly-out': 'slow dolly pull out from the subject',
        'zoom-in': 'gradual zoom in on focal point',
        'zoom-out': 'gradual zoom out revealing environment',
        'orbit': 'orbital camera movement around the subject',
        'crane-up': 'crane shot rising upward',
        'crane-down': 'crane shot descending downward',
        'tracking': 'tracking shot following movement',
        'handheld': 'subtle handheld movement for realism',
      };

      const movement = movementDescriptions[cameraMovement] || movementDescriptions['static'];

      const systemPrompt = `You are a professional cinematographer and video director. Create a detailed video generation prompt based on the user's description and camera settings. Focus on:
- Cinematic camera movements and composition
- Lighting and atmosphere
- Action and motion within the scene
- Professional film techniques
Keep the prompt concise but descriptive (under 150 words).`;

      const userPrompt = `Create a cinematic video prompt for this scene:
Scene: ${prompt}
Camera: ${camera.name} with ${camera.lens} ${camera.focalLength}
Camera Movement: ${movement}
Duration: ${duration || 5} seconds
Aspect Ratio: ${aspectRatio || '21:9'}

Generate a professional video generation prompt that captures the cinematic essence.`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Video prompt generation error:', errorText);
        throw new Error('Failed to generate video prompt');
      }

      const data = await response.json();
      const videoPrompt = data.choices?.[0]?.message?.content || '';

      return new Response(JSON.stringify({ 
        success: true, 
        videoPrompt,
        camera: camera.name,
        movement: cameraMovement,
        duration: duration || 5,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'analyze-reference') {
      // Analyze reference image for scene recreation
      if (!imageBase64) {
        throw new Error('Reference image required');
      }

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this image as a cinematographer would. Describe:
1. Composition and framing
2. Lighting setup and mood
3. Color palette and grading
4. Camera angle and lens characteristics
5. Subject and environment details
6. Suggested camera movements for video
Keep analysis concise and professional.`,
                },
                {
                  type: 'image_url',
                  image_url: { url: imageBase64 },
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const data = await response.json();
      const analysis = data.choices?.[0]?.message?.content || '';

      return new Response(JSON.stringify({ 
        success: true, 
        analysis,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get-camera-presets') {
      return new Response(JSON.stringify({ 
        success: true, 
        presets: CAMERA_PRESETS,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');
  } catch (error) {
    console.error('Cinema Studio error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
