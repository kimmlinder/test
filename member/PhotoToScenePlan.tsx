import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Camera,
  Crown,
  Loader2,
  Sparkles,
  Upload,
  X,
  Image as ImageIcon,
  ChevronDown,
  Copy,
  FileDown,
  ExternalLink,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GeneratedPrompt {
  id: number;
  title: string;
  description: string;
  selected: boolean;
}

interface GeneratedImage {
  promptId: number;
  title: string;
  imageUrl: string;
  duration: number;
}

interface PhotoScenePlan {
  projectTitle: string;
  scenes: {
    sceneNumber: number;
    title: string;
    duration: string;
    imageUrl: string;
  }[];
}

interface PhotoToScenePlanProps {
  projectName: string;
  onScenePlanGenerated?: (scenePlan: PhotoScenePlan) => void;
}

const AI_ASSISTANT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/photo-to-prompts`;

export function PhotoToScenePlan({ projectName, onScenePlanGenerated }: PhotoToScenePlanProps) {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [isOpen, setIsOpen] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  
  // Step 1: Photo upload
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [promptCount, setPromptCount] = useState([12]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Step 2: Generated prompts
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [generatedPrompts, setGeneratedPrompts] = useState<GeneratedPrompt[]>([]);
  
  // Step 3: Generated images & scene plan
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [scenePlan, setScenePlan] = useState<PhotoScenePlan | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setReferenceImage(e.target?.result as string);
        // Reset downstream state
        setGeneratedPrompts([]);
        setGeneratedImages([]);
        setScenePlan(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setReferenceImage(ev.target?.result as string);
        setGeneratedPrompts([]);
        setGeneratedImages([]);
        setScenePlan(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setReferenceImage(null);
    setGeneratedPrompts([]);
    setGeneratedImages([]);
    setScenePlan(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGeneratePrompts = async () => {
    if (!isPremium) {
      setShowUpgradeDialog(true);
      return;
    }

    if (!referenceImage) {
      toast.error('Please upload a reference photo first');
      return;
    }

    setIsGeneratingPrompts(true);
    setGeneratedPrompts([]);

    try {
      const response = await fetch(AI_ASSISTANT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action: 'generate_prompts',
          imageBase64: referenceImage,
          promptCount: promptCount[0],
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to generate prompts');
      }

      const data = await response.json();
      
      const prompts: GeneratedPrompt[] = data.prompts.map((p: any, idx: number) => ({
        id: idx + 1,
        title: p.title,
        description: p.description,
        selected: true, // Default all selected
      }));

      setGeneratedPrompts(prompts);
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
    if (!isPremium) {
      setShowUpgradeDialog(true);
      return;
    }

    const selectedPrompts = generatedPrompts.filter(p => p.selected);
    if (selectedPrompts.length === 0) {
      toast.error('Please select at least one prompt');
      return;
    }

    setIsGeneratingImages(true);
    setGeneratedImages([]);

    try {
      const response = await fetch(AI_ASSISTANT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action: 'generate_images',
          prompts: selectedPrompts.map(p => ({
            id: p.id,
            title: p.title,
            description: p.description,
          })),
          referenceImage,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to generate images');
      }

      const data = await response.json();
      
      const images: GeneratedImage[] = data.images.map((img: any) => ({
        promptId: img.promptId,
        title: img.title,
        imageUrl: img.imageUrl,
        duration: img.duration || 3,
      }));

      setGeneratedImages(images);

      // Auto-generate scene plan
      const plan: PhotoScenePlan = {
        projectTitle: projectName || 'Photo Scene Plan',
        scenes: images.map((img, idx) => ({
          sceneNumber: idx + 1,
          title: img.title,
          duration: `${img.duration}s`,
          imageUrl: img.imageUrl,
        })),
      };

      setScenePlan(plan);
      onScenePlanGenerated?.(plan);
      toast.success('Images and scene plan generated!');
    } catch (error) {
      console.error('Image generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate images');
    } finally {
      setIsGeneratingImages(false);
    }
  };

  const copyScenePlan = () => {
    if (!scenePlan) return;
    
    let text = `# ${scenePlan.projectTitle}\n\n`;
    scenePlan.scenes.forEach(scene => {
      text += `Scene ${scene.sceneNumber}: ${scene.title} (${scene.duration})\n`;
    });

    navigator.clipboard.writeText(text);
    toast.success('Scene plan copied to clipboard');
  };

  const saveScenePlan = async () => {
    if (!scenePlan || !user) {
      toast.error('Please generate a scene plan first');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('scene_plans' as any)
        .insert({
          user_id: user.id,
          project_name: scenePlan.projectTitle,
          video_description: 'Photo-based scene plan',
          video_duration: scenePlan.scenes.reduce((acc, s) => acc + parseInt(s.duration), 0),
          scene_plan: scenePlan,
        } as any);

      if (error) throw error;

      setIsSaved(true);
      toast.success('Scene plan saved!');
    } catch (error) {
      console.error('Error saving scene plan:', error);
      toast.error('Failed to save scene plan');
    } finally {
      setIsSaving(false);
    }
  };

  const exportPDF = () => {
    toast.info('PDF export coming soon!');
  };

  const bookAgency = () => {
    window.open('mailto:hello@pixency.com?subject=Scene Plan Booking - €2.5k', '_blank');
  };

  const resetAll = () => {
    setReferenceImage(null);
    setGeneratedPrompts([]);
    setGeneratedImages([]);
    setScenePlan(null);
    setIsSaved(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">Photo → Scene Plan</h3>
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      <Crown className="w-3 h-3" />
                      Premium
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Upload a photo, get angle prompts, generate scene images</p>
                </div>
              </div>
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="border-t border-border/50 p-6 space-y-6">
              {/* Step 1: Upload Photo */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">1</span>
                  Upload Reference Photo
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {!referenceImage ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="w-full h-[200px] border-2 border-dashed border-border/50 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                  >
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Drop your image here</p>
                      <p className="text-xs text-muted-foreground">or click to browse (max 5MB)</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-[200px] rounded-xl overflow-hidden border border-border/50">
                    <img 
                      src={referenceImage} 
                      alt="Reference" 
                      className="w-full h-full object-contain bg-black/20"
                    />
                    <button
                      onClick={clearImage}
                      className="absolute top-2 right-2 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Prompt Count Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Number of angle prompts:</span>
                    <span className="font-medium text-primary">{promptCount[0]}</span>
                  </div>
                  <Slider
                    value={promptCount}
                    onValueChange={setPromptCount}
                    min={4}
                    max={12}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    "Give me {promptCount[0]} different, detailed prompts, varying camera angle and shot types"
                  </p>
                </div>

                <Button
                  onClick={handleGeneratePrompts}
                  disabled={!referenceImage || isGeneratingPrompts}
                  className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                >
                  {isGeneratingPrompts ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating Prompts...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Prompts
                    </>
                  )}
                </Button>
              </div>

              {/* Step 2: Generated Prompts */}
              <AnimatePresence>
                {generatedPrompts.length > 0 && !scenePlan && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">2</span>
                      Select Prompts ({selectedCount} selected)
                    </div>

                    <div className="bg-muted/30 rounded-xl p-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        Here are {generatedPrompts.length} different, detailed prompts for the image, varying the camera angles and shot types:
                      </p>
                      
                      <ScrollArea className="h-[250px] pr-4">
                        <div className="space-y-3">
                          {generatedPrompts.map((prompt) => (
                            <div
                              key={prompt.id}
                              className={cn(
                                "flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                                prompt.selected 
                                  ? "border-primary/50 bg-primary/5" 
                                  : "border-border/50 bg-background/50 hover:bg-muted/50"
                              )}
                              onClick={() => togglePromptSelection(prompt.id)}
                            >
                              <Checkbox 
                                checked={prompt.selected}
                                className="mt-0.5"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">{prompt.id}. {prompt.title}</p>
                                <p className="text-xs text-muted-foreground mt-1">{prompt.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>

                    <Button
                      onClick={handleGenerateImages}
                      disabled={selectedCount === 0 || isGeneratingImages}
                      className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                    >
                      {isGeneratingImages ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating Images ({selectedCount})...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-4 h-4" />
                          Generate Images From Selected ({selectedCount})
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Step 3: Scene Plan Results */}
              <AnimatePresence>
                {scenePlan && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">3</span>
                      Scene Plan Generated
                    </div>

                    <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl p-4 border border-amber-500/20">
                      <h4 className="font-medium mb-4">{scenePlan.projectTitle}</h4>
                      
                      <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-4">
                          {scenePlan.scenes.map((scene) => (
                            <div
                              key={scene.sceneNumber}
                              className="flex gap-4 p-3 rounded-lg bg-background/50 border border-border/50"
                            >
                              <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                                {scene.imageUrl ? (
                                  <img 
                                    src={scene.imageUrl} 
                                    alt={scene.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-muted-foreground">Scene {scene.sceneNumber}</span>
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{scene.duration}</span>
                                </div>
                                <p className="font-medium text-sm mt-1">{scene.title}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyScenePlan}
                        className="gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copy Plan
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportPDF}
                        className="gap-2"
                      >
                        <FileDown className="w-4 h-4" />
                        PDF
                      </Button>
                      <Button
                        variant={isSaved ? "ghost" : "outline"}
                        size="sm"
                        onClick={saveScenePlan}
                        disabled={isSaving || isSaved}
                        className={cn("gap-2", isSaved && "text-green-600")}
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isSaved ? (
                          <Check className="w-4 h-4" />
                        ) : null}
                        {isSaved ? 'Saved' : 'Save'}
                      </Button>
                      <Button
                        size="sm"
                        onClick={bookAgency}
                        className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white ml-auto"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Book Agency €2.5k
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetAll}
                      className="w-full text-muted-foreground"
                    >
                      Start Over
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Premium Feature
            </DialogTitle>
            <DialogDescription>
              Photo → Scene Plan is a premium feature. Upgrade to access:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Upload reference photos
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Generate 4-12 angle prompts
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                AI image generation from prompts
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Automatic scene plan creation
              </li>
            </ul>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-amber-500">€29/mo</p>
              <p className="text-xs text-muted-foreground">Cancel anytime</p>
            </div>
            <Button 
              onClick={() => {
                setShowUpgradeDialog(false);
                window.location.href = '/member/settings?tab=subscription';
              }}
              className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              <Crown className="w-4 h-4" />
              Upgrade to Premium
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
