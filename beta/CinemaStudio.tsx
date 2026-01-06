import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Film, Camera, Play, Pause, Image, Video, Wand2, Download, 
  Sparkles, ChevronLeft, ChevronRight, X, Info, Upload, Trash2,
  Clapperboard, Focus, Move, ZoomIn, RotateCcw, Save, Heart, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSavedCreations } from '@/hooks/useSavedCreations';

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

const CAMERA_MOVEMENTS = [
  { id: 'static', name: 'Static', icon: Focus },
  { id: 'pan-left', name: 'Pan Left', icon: ChevronLeft },
  { id: 'pan-right', name: 'Pan Right', icon: ChevronRight },
  { id: 'dolly-in', name: 'Dolly In', icon: ZoomIn },
  { id: 'dolly-out', name: 'Dolly Out', icon: Move },
  { id: 'orbit', name: 'Orbit', icon: RotateCcw },
  { id: 'tracking', name: 'Tracking', icon: Move },
  { id: 'crane-up', name: 'Crane Up', icon: Move },
];

const HOW_IT_WORKS_SLIDES = [
  {
    title: 'CINEMA STUDIO',
    description: 'Professional-grade cinematic content powered by real camera and lens simulation. Generate stunning 21:9 images, then bring them to life as video.',
    icon: Clapperboard,
  },
  {
    title: 'CAMERA SETUP',
    description: 'Choose your camera, lens, and focal length. Each combination creates a distinct cinematic look — from vintage film grain to modern digital clarity.',
    icon: Camera,
  },
  {
    title: 'BRING IT TO LIFE',
    description: 'Turn any image into video. Set your duration, enable slow motion for dramatic effect, and add audio to complete the scene.',
    icon: Play,
  },
  {
    title: 'CAMERA MOVEMENTS',
    description: 'Add camera movements to videos — pan, tilt, dolly, zoom, and more. Combine movements to create dynamic, professional sequences.',
    icon: Move,
  },
  {
    title: 'START & END FRAME',
    description: "Upload two frames and describe the action between them. Perfect for precise control over your video's beginning and end.",
    icon: Film,
  },
  {
    title: 'GENERATE MULTIPLE ANGLES',
    description: 'Use Shots to generate the same scene from different camera angles in one go. Build a complete shot list without starting over.',
    icon: Focus,
  },
];

type Mode = 'image' | 'video';

export function CinemaStudio() {
  const [mode, setMode] = useState<Mode>('image');
  const [prompt, setPrompt] = useState('');
  const [selectedCamera, setSelectedCamera] = useState(CAMERA_PRESETS[0].id);
  const [selectedMovement, setSelectedMovement] = useState('static');
  const [duration, setDuration] = useState([5]);
  const [shotCount, setShotCount] = useState([1]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [howItWorksSlide, setHowItWorksSlide] = useState(0);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [videoPrompt, setVideoPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { saveCreation } = useSavedCreations('cinema-studio');

  const camera = CAMERA_PRESETS.find(c => c.id === selectedCamera) || CAMERA_PRESETS[0];

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setReferenceImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast.error('Please describe your scene');
      return;
    }

    setIsGenerating(true);
    const newImages: string[] = [];

    try {
      for (let i = 0; i < shotCount[0]; i++) {
        const { data, error } = await supabase.functions.invoke('cinema-studio', {
          body: {
            action: 'generate-image',
            prompt,
            cameraPreset: selectedCamera,
            aspectRatio: '21:9',
          },
        });

        if (error) throw error;
        if (data.error) throw new Error(data.error);

        if (data.imageUrl) {
          newImages.push(data.imageUrl);
        }
      }

      setGeneratedImages(prev => [...newImages, ...prev]);
      setSelectedImageIndex(0);
      toast.success(`Generated ${newImages.length} cinematic frame${newImages.length > 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateVideoFromImage = async (imageUrl?: string) => {
    const sourceImage = imageUrl || generatedImages[selectedImageIndex];
    if (!sourceImage && !prompt.trim()) {
      toast.error('Please generate an image first or describe your scene');
      return;
    }

    setIsGeneratingVideo(true);
    setGeneratedVideo(null);

    try {
      const { data, error } = await supabase.functions.invoke('cinema-studio', {
        body: {
          action: 'generate-video',
          prompt: prompt || 'Cinematic video with subtle movement',
          cameraPreset: selectedCamera,
          cameraMovement: selectedMovement,
          duration: duration[0],
          aspectRatio: '21:9',
          startingFrame: sourceImage,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      if (data.videoUrl) {
        setGeneratedVideo(data.videoUrl);
        toast.success('Cinematic video generated!');
      } else {
        throw new Error('No video URL received');
      }
    } catch (error) {
      console.error('Video generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate video');
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const generateVideoPrompt = async () => {
    if (!prompt.trim() && !referenceImage) {
      toast.error('Please describe your scene or upload a reference image');
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('cinema-studio', {
        body: {
          action: 'generate-video-prompt',
          prompt: prompt || 'Based on the reference image',
          cameraPreset: selectedCamera,
          cameraMovement: selectedMovement,
          duration: duration[0],
          aspectRatio: '21:9',
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setVideoPrompt(data.videoPrompt);
      toast.success('Video prompt generated - Click "Generate Video" to create the video');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate prompt');
    } finally {
      setIsGenerating(false);
    }
  };

  const analyzeReference = async () => {
    if (!referenceImage) {
      toast.error('Please upload a reference image');
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('cinema-studio', {
        body: {
          action: 'analyze-reference',
          imageBase64: referenceImage,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setPrompt(data.analysis);
      toast.success('Reference analyzed');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to analyze image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (generatedImages.length === 0 && !videoPrompt && !generatedVideo) {
      toast.error('Nothing to save');
      return;
    }

    const result = await saveCreation({
      creation_type: 'cinema-studio',
      title: prompt.slice(0, 50) || 'Cinema Studio Creation',
      content: videoPrompt || prompt,
      image_url: generatedImages[0] || null,
      metadata: {
        camera: camera.name,
        lens: `${camera.lens} ${camera.focalLength}`,
        movement: selectedMovement,
        duration: duration[0],
        allImages: generatedImages,
        videoUrl: generatedVideo,
      },
    });

    if (result.success) {
      toast.success('Saved to your creations');
    } else {
      toast.error('Failed to save');
    }
  };

  const downloadVideo = () => {
    if (!generatedVideo) return;
    const link = document.createElement('a');
    link.href = generatedVideo;
    link.download = `cinema-studio-video-${Date.now()}.mp4`;
    link.click();
  };

  const downloadImage = (imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `cinema-studio-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Clapperboard className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Cinema Studio</h1>
                <p className="text-xs text-muted-foreground">Professional cinematic content</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                FREE BETA
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => setShowHowItWorks(true)}>
                <Info className="h-4 w-4 mr-2" />
                How it works?
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Controls */}
          <div className="space-y-6">
            {/* Mode Toggle */}
            <div className="bg-muted/30 rounded-xl p-1 flex">
              <button
                onClick={() => setMode('image')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
                  mode === 'image' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Image className="h-4 w-4" />
                <span className="text-sm font-medium">Image</span>
              </button>
              <button
                onClick={() => setMode('video')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
                  mode === 'video' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Video className="h-4 w-4" />
                <span className="text-sm font-medium">Video</span>
              </button>
            </div>

            {/* Reference Image Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Reference Image (Optional)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {referenceImage ? (
                <div className="relative aspect-video rounded-lg overflow-hidden">
                  <img src={referenceImage} alt="Reference" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="sm" variant="secondary" onClick={analyzeReference} disabled={isGenerating}>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Analyze
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setReferenceImage(null)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-video border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Upload reference image</span>
                </button>
              )}
            </div>

            {/* Scene Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Scene Description</label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the scene you imagine..."
                className="min-h-[100px] resize-none"
              />
            </div>

            {/* Camera Preset */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Camera & Lens
              </label>
              <Select value={selectedCamera} onValueChange={setSelectedCamera}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CAMERA_PRESETS.map((cam) => (
                    <SelectItem key={cam.id} value={cam.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{cam.name}</span>
                        <span className="text-xs text-muted-foreground">{cam.lens} {cam.focalLength}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{camera.description}</p>
            </div>

            {/* Shot Count (Image mode) */}
            {mode === 'image' && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center justify-between">
                  <span>Number of Shots</span>
                  <span className="text-muted-foreground">{shotCount[0]}/4</span>
                </label>
                <Slider
                  value={shotCount}
                  onValueChange={setShotCount}
                  min={1}
                  max={4}
                  step={1}
                />
              </div>
            )}

            {/* Video Controls */}
            {mode === 'video' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Move className="h-4 w-4" />
                    Camera Movement
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {CAMERA_MOVEMENTS.map((movement) => (
                      <button
                        key={movement.id}
                        onClick={() => setSelectedMovement(movement.id)}
                        className={`p-2 rounded-lg border text-center transition-all ${
                          selectedMovement === movement.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <movement.icon className="h-4 w-4 mx-auto mb-1" />
                        <span className="text-xs">{movement.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center justify-between">
                    <span>Duration</span>
                    <span className="text-muted-foreground">{duration[0]}s</span>
                  </label>
                  <Slider
                    value={duration}
                    onValueChange={setDuration}
                    min={3}
                    max={10}
                    step={1}
                  />
                </div>
              </>
            )}

            {/* Generate Button */}
            <Button
              onClick={mode === 'image' ? generateImage : generateVideoPrompt}
              disabled={isGenerating || (!prompt.trim() && !referenceImage)}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate {mode === 'image' ? `${shotCount[0]} Shot${shotCount[0] > 1 ? 's' : ''}` : 'Video Prompt'}
                </>
              )}
            </Button>
          </div>

          {/* Center Panel - Preview */}
          <div className="lg:col-span-2 space-y-4">
            {/* Preview Area */}
            <div className="aspect-[21/9] bg-black rounded-2xl overflow-hidden relative">
              {generatedImages.length > 0 ? (
                <>
                  <img
                    src={generatedImages[selectedImageIndex]}
                    alt="Generated cinematic frame"
                    className="w-full h-full object-cover"
                  />
                  {/* Letterbox effect */}
                  <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/80 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/80 to-transparent" />
                  
                  {/* Navigation */}
                  {generatedImages.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImageIndex(prev => Math.max(0, prev - 1))}
                        disabled={selectedImageIndex === 0}
                        className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 flex items-center justify-center text-white disabled:opacity-30"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setSelectedImageIndex(prev => Math.min(generatedImages.length - 1, prev + 1))}
                        disabled={selectedImageIndex === generatedImages.length - 1}
                        className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 flex items-center justify-center text-white disabled:opacity-30"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}

                  {/* Actions */}
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => downloadImage(generatedImages[selectedImageIndex])}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="secondary" onClick={handleSave}>
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                  <Film className="h-16 w-16 mb-4 opacity-30" />
                  <p className="text-lg font-medium">Your cinematic frame will appear here</p>
                  <p className="text-sm">21:9 ultra-wide format</p>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {generatedImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {generatedImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`flex-shrink-0 w-24 aspect-[21/9] rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === idx ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Frame ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Video Result */}
            {mode === 'video' && generatedVideo && (
              <div className="space-y-4">
                <div className="aspect-[21/9] bg-black rounded-2xl overflow-hidden relative">
                  <video
                    src={generatedVideo}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-cover"
                  />
                  {/* Letterbox effect */}
                  <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Badge variant="outline">{camera.name}</Badge>
                    <Badge variant="outline">{selectedMovement}</Badge>
                    <Badge variant="outline">{duration[0]}s</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={downloadVideo}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button size="sm" variant="secondary" onClick={handleSave}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Video Prompt Result */}
            {mode === 'video' && videoPrompt && !generatedVideo && (
              <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Video Prompt Ready
                  </h3>
                  <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(videoPrompt)}>
                    Copy
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{videoPrompt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{camera.name}</Badge>
                    <Badge variant="outline">{selectedMovement}</Badge>
                    <Badge variant="outline">{duration[0]}s</Badge>
                  </div>
                  <Button 
                    onClick={() => generateVideoFromImage()} 
                    disabled={isGeneratingVideo}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                  >
                    {isGeneratingVideo ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating Video...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Generate Video
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Generate Video from Image */}
            {mode === 'video' && generatedImages.length > 0 && !videoPrompt && !generatedVideo && (
              <div className="bg-muted/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Generate Video from Frame</h3>
                    <p className="text-sm text-muted-foreground">Turn your cinematic frame into a video</p>
                  </div>
                  <Button 
                    onClick={() => generateVideoFromImage(generatedImages[selectedImageIndex])} 
                    disabled={isGeneratingVideo}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                  >
                    {isGeneratingVideo ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Animate Frame
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Video Generation Loading */}
            {isGeneratingVideo && (
              <div className="bg-muted/30 rounded-xl p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 animate-pulse" />
                    <Loader2 className="h-8 w-8 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
                  </div>
                  <div>
                    <p className="font-medium">Generating cinematic video...</p>
                    <p className="text-sm text-muted-foreground">This may take a minute</p>
                  </div>
                </div>
              </div>
            )}

            {/* Camera Info */}
            <div className="bg-muted/30 rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
                  <Camera className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-medium">{camera.name}</p>
                  <p className="text-sm text-muted-foreground">{camera.lens}, {camera.focalLength}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Modal */}
      <Dialog open={showHowItWorks} onOpenChange={setShowHowItWorks}>
        <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">How it works</DialogTitle>
            <p className="text-center text-muted-foreground">
              Create cinematic images and videos with real camera and lens simulation
            </p>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Slide Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={howItWorksSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="aspect-video bg-zinc-800 rounded-xl flex items-center justify-center">
                  {React.createElement(HOW_IT_WORKS_SLIDES[howItWorksSlide].icon, {
                    className: 'h-24 w-24 text-amber-500',
                  })}
                </div>
                <h3 className="text-xl font-bold text-center">
                  {HOW_IT_WORKS_SLIDES[howItWorksSlide].title}
                </h3>
                <p className="text-center text-muted-foreground">
                  {HOW_IT_WORKS_SLIDES[howItWorksSlide].description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Slide Navigation */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setHowItWorksSlide(prev => Math.max(0, prev - 1))}
                disabled={howItWorksSlide === 0}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex gap-1">
                {HOW_IT_WORKS_SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setHowItWorksSlide(idx)}
                    className={`w-16 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                      howItWorksSlide === idx ? 'border-white' : 'border-transparent opacity-50 hover:opacity-100'
                    }`}
                  >
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                      {React.createElement(HOW_IT_WORKS_SLIDES[idx].icon, {
                        className: 'h-4 w-4 text-muted-foreground',
                      })}
                    </div>
                  </button>
                ))}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setHowItWorksSlide(prev => Math.min(HOW_IT_WORKS_SLIDES.length - 1, prev + 1))}
                disabled={howItWorksSlide === HOW_IT_WORKS_SLIDES.length - 1}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
