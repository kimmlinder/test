import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Film, 
  Loader2, 
  Sparkles, 
  Clock, 
  Camera, 
  Music,
  Users,
  MapPin,
  Clapperboard,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  RefreshCw,
  Plus,
  Trash2,
  GripVertical,
  Play,
  Pause,
  Save,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export interface Scene {
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

export interface ScenePlan {
  projectTitle: string;
  totalDuration: string;
  scenes: Scene[];
  overview: string;
}

interface ScenePlanGeneratorProps {
  projectName: string;
  onScenePlanGenerated?: (scenePlan: ScenePlan) => void;
  existingConversation?: string;
}

const SCENE_PLAN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-scene-plan`;

export function ScenePlanGenerator({ 
  projectName, 
  onScenePlanGenerated,
  existingConversation 
}: ScenePlanGeneratorProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [videoDescription, setVideoDescription] = useState('');
  const [videoDuration, setVideoDuration] = useState('60');
  const [videoStyle, setVideoStyle] = useState('');
  const [scenePlan, setScenePlan] = useState<ScenePlan | null>(null);
  const [expandedScenes, setExpandedScenes] = useState<number[]>([]);

  const generateScenePlan = async () => {
    if (!videoDescription.trim()) {
      toast.error('Please describe your video concept');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch(SCENE_PLAN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          projectName,
          videoDescription,
          videoDuration: parseInt(videoDuration),
          videoStyle,
          existingConversation,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to generate scene plan');
      }

      const data = await response.json();
      setScenePlan(data.scenePlan);
      setExpandedScenes([0]); // Expand first scene by default
      onScenePlanGenerated?.(data.scenePlan);
      toast.success('Scene plan generated!');
    } catch (error) {
      console.error('Scene plan generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate scene plan');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleScene = (index: number) => {
    setExpandedScenes(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const expandAll = () => {
    if (scenePlan) {
      setExpandedScenes(scenePlan.scenes.map((_, i) => i));
    }
  };

  const collapseAll = () => {
    setExpandedScenes([]);
  };

  const copyScenePlan = () => {
    if (!scenePlan) return;
    
    let text = `# ${scenePlan.projectTitle}\n`;
    text += `Total Duration: ${scenePlan.totalDuration}\n\n`;
    text += `## Overview\n${scenePlan.overview}\n\n`;
    text += `## Scenes\n\n`;
    
    scenePlan.scenes.forEach(scene => {
      text += `### Scene ${scene.sceneNumber}: ${scene.title}\n`;
      text += `- Duration: ${scene.duration}\n`;
      text += `- Shot Type: ${scene.shotType}\n`;
      text += `- Location: ${scene.location}\n`;
      text += `- Description: ${scene.description}\n`;
      if (scene.actors.length > 0) text += `- Actors: ${scene.actors.join(', ')}\n`;
      if (scene.props.length > 0) text += `- Props: ${scene.props.join(', ')}\n`;
      if (scene.audio) text += `- Audio: ${scene.audio}\n`;
      if (scene.notes) text += `- Notes: ${scene.notes}\n`;
      text += '\n';
    });

    navigator.clipboard.writeText(text);
    toast.success('Scene plan copied to clipboard');
  };

  const resetScenePlan = () => {
    setScenePlan(null);
    setVideoDescription('');
    setVideoDuration('60');
    setVideoStyle('');
    setExpandedScenes([]);
    setIsSaved(false);
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
          project_name: projectName || scenePlan.projectTitle,
          video_description: videoDescription,
          video_duration: parseInt(videoDuration),
          video_style: videoStyle || null,
          scene_plan: scenePlan,
        } as any);

      if (error) throw error;

      setIsSaved(true);
      toast.success('Scene plan saved successfully!');
    } catch (error) {
      console.error('Error saving scene plan:', error);
      toast.error('Failed to save scene plan');
    } finally {
      setIsSaving(false);
    }
  };

  const getShotTypeIcon = (shotType: string) => {
    const type = shotType.toLowerCase();
    if (type.includes('wide') || type.includes('establishing')) return '🎬';
    if (type.includes('close')) return '👤';
    if (type.includes('medium')) return '📷';
    if (type.includes('aerial') || type.includes('drone')) return '🚁';
    if (type.includes('tracking') || type.includes('dolly')) return '🎥';
    return '📹';
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Clapperboard className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-medium">Scene Plan Generator</h3>
                <p className="text-xs text-muted-foreground">Create a detailed scene-by-scene breakdown</p>
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
          <div className="border-t border-border/50">
            <AnimatePresence mode="wait">
              {!scenePlan ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-6 space-y-5"
                >
                  {/* Video Description */}
                  <div className="space-y-2">
                    <Label htmlFor="videoDescription">Video Concept *</Label>
                    <Textarea
                      id="videoDescription"
                      placeholder="Describe your video idea... What's the story, message, or concept you want to convey?"
                      value={videoDescription}
                      onChange={(e) => setVideoDescription(e.target.value)}
                      className="min-h-[100px] bg-muted/50"
                    />
                  </div>

                  {/* Duration & Style Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="videoDuration">Target Duration (seconds)</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="videoDuration"
                          type="number"
                          min="15"
                          max="600"
                          value={videoDuration}
                          onChange={(e) => setVideoDuration(e.target.value)}
                          className="pl-10 bg-muted/50"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="videoStyle">Style (optional)</Label>
                      <Input
                        id="videoStyle"
                        placeholder="e.g., Cinematic, Documentary, Fast-paced"
                        value={videoStyle}
                        onChange={(e) => setVideoStyle(e.target.value)}
                        className="bg-muted/50"
                      />
                    </div>
                  </div>

                  {/* Quick Style Chips */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Quick styles</Label>
                    <div className="flex flex-wrap gap-2">
                      {['Cinematic', 'Documentary', 'Fast-paced', 'Emotional', 'Corporate', 'Social Media'].map((style) => (
                        <Button
                          key={style}
                          variant={videoStyle === style ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setVideoStyle(style)}
                          className="h-7 text-xs rounded-full"
                        >
                          {style}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Generate Button */}
                  <Button
                    onClick={generateScenePlan}
                    disabled={isGenerating || !videoDescription.trim()}
                    className="w-full gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating Scene Plan...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Scene Plan
                      </>
                    )}
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="divide-y divide-border/50"
                >
                  {/* Scene Plan Header */}
                  <div className="p-4 bg-gradient-to-r from-violet-500/10 to-purple-500/10">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-display text-lg font-medium">{scenePlan.projectTitle}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {scenePlan.totalDuration}
                          </span>
                          <span className="flex items-center gap-1">
                            <Film className="w-4 h-4" />
                            {scenePlan.scenes.length} scenes
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={isSaved ? "ghost" : "default"}
                          size="sm"
                          onClick={saveScenePlan}
                          disabled={isSaving || isSaved}
                          className={cn(
                            "h-8 gap-1",
                            isSaved && "text-green-600"
                          )}
                        >
                          {isSaving ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : isSaved ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Save className="w-3 h-3" />
                          )}
                          {isSaved ? 'Saved' : 'Save'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={copyScenePlan}
                          className="h-8 gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          Copy
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={resetScenePlan}
                          className="h-8 gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          New
                        </Button>
                      </div>
                    </div>
                    {scenePlan.overview && (
                      <p className="text-sm text-muted-foreground mt-3">{scenePlan.overview}</p>
                    )}
                  </div>

                  {/* Scene Controls */}
                  <div className="px-4 py-2 flex items-center justify-between bg-muted/30">
                    <span className="text-xs text-muted-foreground">Scenes</span>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={expandAll} className="h-6 text-xs">
                        Expand All
                      </Button>
                      <Button variant="ghost" size="sm" onClick={collapseAll} className="h-6 text-xs">
                        Collapse All
                      </Button>
                    </div>
                  </div>

                  {/* Scenes List */}
                  <ScrollArea className="h-[350px]">
                    <div className="divide-y divide-border/30">
                      {scenePlan.scenes.map((scene, index) => (
                        <Collapsible
                          key={index}
                          open={expandedScenes.includes(index)}
                          onOpenChange={() => toggleScene(index)}
                        >
                          <CollapsibleTrigger asChild>
                            <button className="w-full p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors text-left">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                                {scene.sceneNumber}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium truncate">{scene.title}</span>
                                  <span className="text-lg">{getShotTypeIcon(scene.shotType)}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {scene.duration}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Camera className="w-3 h-3" />
                                    {scene.shotType}
                                  </span>
                                </div>
                              </div>
                              <motion.div
                                animate={{ rotate: expandedScenes.includes(index) ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              </motion.div>
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="px-4 pb-4 pl-16 space-y-3"
                            >
                              <p className="text-sm text-muted-foreground">{scene.description}</p>
                              
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex items-start gap-2">
                                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                                  <div>
                                    <span className="text-xs text-muted-foreground block">Location</span>
                                    <span>{scene.location}</span>
                                  </div>
                                </div>
                                
                                {scene.actors.length > 0 && (
                                  <div className="flex items-start gap-2">
                                    <Users className="w-4 h-4 text-muted-foreground mt-0.5" />
                                    <div>
                                      <span className="text-xs text-muted-foreground block">Actors</span>
                                      <span>{scene.actors.join(', ')}</span>
                                    </div>
                                  </div>
                                )}
                                
                                {scene.audio && (
                                  <div className="flex items-start gap-2">
                                    <Music className="w-4 h-4 text-muted-foreground mt-0.5" />
                                    <div>
                                      <span className="text-xs text-muted-foreground block">Audio</span>
                                      <span>{scene.audio}</span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {scene.props.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {scene.props.map((prop, i) => (
                                    <span 
                                      key={i}
                                      className="px-2 py-0.5 bg-muted rounded-full text-xs"
                                    >
                                      {prop}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {scene.notes && (
                                <div className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-3">
                                  {scene.notes}
                                </div>
                              )}
                            </motion.div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </ScrollArea>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
