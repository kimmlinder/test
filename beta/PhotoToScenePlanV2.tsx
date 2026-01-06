import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Camera,
  Loader2,
  Sparkles,
  Upload,
  X,
  Image as ImageIcon,
  Copy,
  FileDown,
  Check,
  Zap,
  Eye,
  Palette,
  Film,
  Save,
  Star,
  Trash2,
  RefreshCw,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UploadedImage {
  id: string;
  base64: string;
  preview: string;
}

interface GeneratedPrompt {
  id: number;
  title: string;
  description: string;
  cameraAngle: string;
  shotType: string;
  lighting: string;
  moodRatings: {
    dramatic: number;
    serene: number;
    dynamic: number;
    intimate: number;
    epic: number;
  };
  selected: boolean;
}

interface GeneratedImage {
  promptId: number;
  title: string;
  imageUrl: string;
  duration: number;
  cameraAngle: string;
  shotType: string;
}

interface SceneAnalysis {
  subjects?: string[];
  colorPalette?: string[];
  lighting?: string;
  cameraMovements?: string[];
  mood?: string;
  storyPotential?: string;
  audioStyle?: string;
}

interface PhotoScenePlan {
  projectTitle: string;
  scenes: {
    sceneNumber: number;
    title: string;
    duration: string;
    imageUrl: string;
    cameraAngle?: string;
    shotType?: string;
  }[];
  analysis?: SceneAnalysis;
}

interface PhotoToScenePlanV2Props {
  projectName?: string;
  onScenePlanGenerated?: (scenePlan: PhotoScenePlan) => void;
}

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/photo-to-scene-v2`;

const STYLE_PRESETS = [
  { id: 'cinematic', label: 'Cinematic', icon: Film },
  { id: 'documentary', label: 'Documentary', icon: Camera },
  { id: 'artistic', label: 'Artistic', icon: Palette },
  { id: 'commercial', label: 'Commercial', icon: Zap },
];

const MOOD_PRESETS = [
  'Dramatic', 'Serene', 'Dynamic', 'Intimate', 'Epic', 'Mysterious', 'Joyful'
];

export function PhotoToScenePlanV2({ projectName, onScenePlanGenerated }: PhotoToScenePlanV2Props) {
  const { user } = useAuth();
  
  // Step tracking
  const [currentStep, setCurrentStep] = useState(1);
  
  // Photo upload - now supports multiple images
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [promptCount, setPromptCount] = useState([8]);
  const [selectedStyle, setSelectedStyle] = useState('cinematic');
  const [selectedMood, setSelectedMood] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Scene analysis
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sceneAnalysis, setSceneAnalysis] = useState<SceneAnalysis | null>(null);
  
  // Generated prompts
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [generatedPrompts, setGeneratedPrompts] = useState<GeneratedPrompt[]>([]);
  
  // Generated images & scene plan
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [scenePlan, setScenePlan] = useState<PhotoScenePlan | null>(null);
  
  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const addImages = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    fileArray.forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select image files only');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setUploadedImages(prev => [...prev, {
          id: crypto.randomUUID(),
          base64,
          preview: base64
        }]);
      };
      reader.readAsDataURL(file);
    });
    
    resetDownstream();
  };

  const removeImage = (id: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id));
    if (uploadedImages.length <= 1) {
      resetDownstream();
    }
  };

  const clearAllImages = () => {
    setUploadedImages([]);
    resetDownstream();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addImages(files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      addImages(files);
    }
  };

  const resetDownstream = () => {
    setSceneAnalysis(null);
    setGeneratedPrompts([]);
    setGeneratedImages([]);
    setScenePlan(null);
    setIsSaved(false);
    setCurrentStep(1);
  };

  const analyzeScene = async () => {
    if (uploadedImages.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch(AI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action: 'analyze_scene',
          imageBase64: uploadedImages[0].base64,
          images: uploadedImages.map(img => img.base64),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze scene');
      }

      const data = await response.json();
      setSceneAnalysis(data.analysis);
      toast.success('Scene analyzed successfully!');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze scene');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGeneratePrompts = async () => {
    if (uploadedImages.length === 0) {
      toast.error('Please upload at least one reference photo');
      return;
    }

    setIsGeneratingPrompts(true);
    setGeneratedPrompts([]);

    try {
      const response = await fetch(AI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action: 'generate_prompts',
          imageBase64: uploadedImages[0].base64,
          images: uploadedImages.map(img => img.base64),
          promptCount: promptCount[0],
          style: selectedStyle,
          mood: selectedMood,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to generate prompts');
      }

      const data = await response.json();
      
      const prompts: GeneratedPrompt[] = data.prompts.map((p: any, idx: number) => ({
        id: idx + 1,
        title: p.title || `Scene ${idx + 1}`,
        description: p.description || '',
        cameraAngle: p.cameraAngle || 'Eye level',
        shotType: p.shotType || 'Medium shot',
        lighting: p.lighting || 'Natural',
        moodRatings: p.moodRatings || { dramatic: 3, serene: 3, dynamic: 3, intimate: 3, epic: 3 },
        selected: true,
      }));

      setGeneratedPrompts(prompts);
      setCurrentStep(2);
      toast.success(`Generated ${prompts.length} prompts!`);
    } catch (error) {
      console.error('Prompt generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate prompts');
    } finally {
      setIsGeneratingPrompts(false);
    }
  };

  const togglePromptSelection = (id: number) => {
    setGeneratedPrompts(prev => 
      prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p)
    );
  };

  const selectedCount = generatedPrompts.filter(p => p.selected).length;

  const handleGenerateImages = async () => {
    const selectedPrompts = generatedPrompts.filter(p => p.selected);
    if (selectedPrompts.length === 0) {
      toast.error('Please select at least one prompt');
      return;
    }

    setIsGeneratingImages(true);
    setGeneratedImages([]);

    try {
      const response = await fetch(AI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action: 'generate_images',
          prompts: selectedPrompts,
          referenceImages: uploadedImages.map(img => img.base64),
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to generate images');
      }

      const data = await response.json();
      setGeneratedImages(data.images);

      // Auto-generate scene plan
      const plan: PhotoScenePlan = {
        projectTitle: projectName || 'Photo Scene Plan V2',
        scenes: data.images.map((img: GeneratedImage, idx: number) => ({
          sceneNumber: idx + 1,
          title: img.title,
          duration: `${img.duration}s`,
          imageUrl: img.imageUrl,
          cameraAngle: img.cameraAngle,
          shotType: img.shotType,
        })),
        analysis: sceneAnalysis || undefined,
      };

      setScenePlan(plan);
      setCurrentStep(3);
      onScenePlanGenerated?.(plan);
      toast.success('Scene plan generated!');
    } catch (error) {
      console.error('Image generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate images');
    } finally {
      setIsGeneratingImages(false);
    }
  };

  const saveCreation = async () => {
    if (!scenePlan || !user) {
      toast.error('Please generate a scene plan first');
      return;
    }

    setIsSaving(true);
    try {
      // Save to ai_creations table
      const { error } = await supabase
        .from('ai_creations' as any)
        .insert({
          user_id: user.id,
          creation_type: 'photo_scene_plan',
          title: scenePlan.projectTitle,
          content: JSON.stringify(scenePlan),
          metadata: {
            sceneCount: scenePlan.scenes.length,
            style: selectedStyle,
            mood: selectedMood,
            analysis: sceneAnalysis,
          },
        } as any);

      if (error) throw error;

      setIsSaved(true);
      toast.success('Scene plan saved!');
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save scene plan');
    } finally {
      setIsSaving(false);
    }
  };

  const copyScenePlan = () => {
    if (!scenePlan) return;
    
    let text = `# ${scenePlan.projectTitle}\n\n`;
    text += `Style: ${selectedStyle} | Mood: ${selectedMood || 'Not specified'}\n\n`;
    scenePlan.scenes.forEach(scene => {
      text += `## Scene ${scene.sceneNumber}: ${scene.title}\n`;
      text += `Duration: ${scene.duration}\n`;
      if (scene.cameraAngle) text += `Camera: ${scene.cameraAngle}\n`;
      if (scene.shotType) text += `Shot: ${scene.shotType}\n`;
      text += '\n';
    });

    navigator.clipboard.writeText(text);
    toast.success('Scene plan copied!');
  };

  const resetAll = () => {
    clearAllImages();
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">Photo → Scene Plan</h3>
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  <Zap className="w-3 h-3 mr-1" />
                  V2 Beta
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Enhanced with scene analysis & smart prompts</p>
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                  currentStep >= step 
                    ? "bg-purple-500 text-white" 
                    : "bg-muted text-muted-foreground"
                )}
              >
                {currentStep > step ? <Check className="w-4 h-4" /> : step}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Step 1: Upload & Configure */}
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Photo Upload - Multi-Image Support */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Reference Photos</Label>
                  {uploadedImages.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllImages}
                      className="h-7 text-xs text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Clear all
                    </Button>
                  )}
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Upload Zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className={cn(
                    "border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors",
                    uploadedImages.length === 0 ? "h-[180px]" : "h-[100px]",
                    "border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/5"
                  )}
                >
                  <div className={cn(
                    "rounded-full bg-purple-500/10 flex items-center justify-center",
                    uploadedImages.length === 0 ? "w-14 h-14" : "w-10 h-10"
                  )}>
                    {uploadedImages.length === 0 ? (
                      <Upload className="w-7 h-7 text-purple-500" />
                    ) : (
                      <Plus className="w-5 h-5 text-purple-500" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      {uploadedImages.length === 0 ? "Drop your images here" : "Add more images"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {uploadedImages.length === 0 
                        ? "Upload multiple reference photos for better results" 
                        : `${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''} uploaded`}
                    </p>
                  </div>
                </div>

                {/* Uploaded Images Grid */}
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                    {uploadedImages.map((img) => (
                      <div key={img.id} className="relative group aspect-square">
                        <img
                          src={img.preview}
                          alt="Reference"
                          className="w-full h-full object-cover rounded-lg border border-border/50"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(img.id);
                          }}
                          className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Analyze Button */}
                {uploadedImages.length > 0 && !sceneAnalysis && (
                  <Button 
                    onClick={analyzeScene}
                    disabled={isAnalyzing}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing {uploadedImages.length} image{uploadedImages.length > 1 ? 's' : ''}...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        Analyze Scene ({uploadedImages.length} image{uploadedImages.length > 1 ? 's' : ''})
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Scene Analysis Results */}
              {sceneAnalysis && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-3"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-purple-400">
                    <Eye className="w-4 h-4" />
                    Scene Analysis
                  </div>
                  
                  {sceneAnalysis.colorPalette && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Colors:</span>
                      <div className="flex gap-1">
                        {sceneAnalysis.colorPalette.slice(0, 5).map((color, i) => (
                          <div
                            key={i}
                            className="w-5 h-5 rounded-full border border-white/20"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {sceneAnalysis.mood && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Mood:</span> {sceneAnalysis.mood}
                    </p>
                  )}
                  
                  {sceneAnalysis.lighting && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Lighting:</span> {sceneAnalysis.lighting}
                    </p>
                  )}
                </motion.div>
              )}

              {/* Style & Mood Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Style Preset</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {STYLE_PRESETS.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg border text-xs transition-colors",
                          selectedStyle === style.id
                            ? "border-purple-500 bg-purple-500/10 text-purple-400"
                            : "border-border/50 hover:bg-muted/50"
                        )}
                      >
                        <style.icon className="w-3 h-3" />
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">Mood</Label>
                  <div className="flex flex-wrap gap-1">
                    {MOOD_PRESETS.map((mood) => (
                      <button
                        key={mood}
                        onClick={() => setSelectedMood(selectedMood === mood ? '' : mood)}
                        className={cn(
                          "px-2 py-1 rounded-full text-xs transition-colors",
                          selectedMood === mood
                            ? "bg-purple-500 text-white"
                            : "bg-muted hover:bg-muted/80"
                        )}
                      >
                        {mood}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Prompt Count */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <Label>Number of prompts</Label>
                  <span className="font-medium text-purple-400">{promptCount[0]}</span>
                </div>
                <Slider
                  value={promptCount}
                  onValueChange={setPromptCount}
                  min={4}
                  max={16}
                  step={2}
                  className="w-full"
                />
              </div>

              <Button
                onClick={handleGeneratePrompts}
                disabled={uploadedImages.length === 0 || isGeneratingPrompts}
                className="w-full gap-2 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
              >
                {isGeneratingPrompts ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Smart Prompts...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate {promptCount[0]} Smart Prompts
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {/* Step 2: Select Prompts */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Select Prompts ({selectedCount} of {generatedPrompts.length})
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep(1)}
                  className="gap-1 text-xs"
                >
                  <RefreshCw className="w-3 h-3" />
                  Regenerate
                </Button>
              </div>
              
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {generatedPrompts.map((prompt) => (
                    <div
                      key={prompt.id}
                      onClick={() => togglePromptSelection(prompt.id)}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                        prompt.selected 
                          ? "border-purple-500/50 bg-purple-500/5" 
                          : "border-border/50 hover:bg-muted/30"
                      )}
                    >
                      <Checkbox checked={prompt.selected} className="mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{prompt.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{prompt.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          <Badge variant="outline" className="text-[10px] py-0">{prompt.cameraAngle}</Badge>
                          <Badge variant="outline" className="text-[10px] py-0">{prompt.shotType}</Badge>
                          <Badge variant="outline" className="text-[10px] py-0">{prompt.lighting}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <Button
                onClick={handleGenerateImages}
                disabled={selectedCount === 0 || isGeneratingImages}
                className="w-full gap-2 bg-gradient-to-r from-purple-500 to-blue-600"
              >
                {isGeneratingImages ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating {selectedCount} Images...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4" />
                    Generate {selectedCount} Scene Images
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {/* Step 3: Scene Plan */}
          {currentStep === 3 && scenePlan && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">{scenePlan.projectTitle}</Label>
                  <p className="text-xs text-muted-foreground">{scenePlan.scenes.length} scenes generated</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyScenePlan}
                    className="gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={saveCreation}
                    disabled={isSaving || isSaved}
                    className="gap-1"
                  >
                    {isSaved ? (
                      <>
                        <Check className="w-3 h-3" />
                        Saved
                      </>
                    ) : isSaving ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-3 h-3" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[350px]">
                <div className="grid grid-cols-2 gap-3">
                  {scenePlan.scenes.map((scene) => (
                    <div
                      key={scene.sceneNumber}
                      className="rounded-xl border border-border/50 overflow-hidden bg-card/50"
                    >
                      <div className="aspect-video relative">
                        <img 
                          src={scene.imageUrl} 
                          alt={scene.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                          Scene {scene.sceneNumber}
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                          {scene.duration}
                        </div>
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium truncate">{scene.title}</p>
                        {scene.cameraAngle && (
                          <p className="text-[10px] text-muted-foreground truncate">
                            {scene.cameraAngle} • {scene.shotType}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <Button
                onClick={resetAll}
                variant="outline"
                className="w-full gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Create New Scene Plan
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
