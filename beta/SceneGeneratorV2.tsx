import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Zap,
  Loader2,
  Sparkles,
  Clock,
  Camera,
  Film,
  Wand2,
  Eye,
  Copy,
  Download,
  RefreshCw,
  Play,
  Image as ImageIcon,
  MessageSquare,
  Lightbulb,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Scene {
  sceneNumber: number;
  title: string;
  duration: string;
  description: string;
  shotType: string;
  location: string;
  visualPrompt: string;
  mood: string;
  cameraMovement: string;
}

interface ScenePlanV2 {
  projectTitle: string;
  totalDuration: string;
  scenes: Scene[];
  overview: string;
  styleGuide: string;
}

const SCENE_PLAN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-scene-plan`;

export function SceneGeneratorV2() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('create');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  
  // Form states
  const [projectName, setProjectName] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoDuration, setVideoDuration] = useState('60');
  const [videoStyle, setVideoStyle] = useState('');
  const [moodBoard, setMoodBoard] = useState<string[]>([]);
  
  // Result states
  const [scenePlan, setScenePlan] = useState<ScenePlanV2 | null>(null);
  const [expandedScenes, setExpandedScenes] = useState<number[]>([0]);
  const [streamingText, setStreamingText] = useState('');
  
  const moods = ['Cinematic', 'Energetic', 'Emotional', 'Corporate', 'Playful', 'Dark', 'Inspirational', 'Documentary'];
  
  const toggleMood = (mood: string) => {
    setMoodBoard(prev => 
      prev.includes(mood) 
        ? prev.filter(m => m !== mood)
        : [...prev, mood]
    );
  };

  const generateScenePlan = async () => {
    if (!videoDescription.trim()) {
      toast.error('Please describe your video concept');
      return;
    }

    setIsGenerating(true);
    setIsStreaming(true);
    setStreamingText('');

    try {
      const response = await fetch(SCENE_PLAN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          projectName: projectName || 'Untitled Project',
          videoDescription: `${videoDescription}. Style: ${moodBoard.join(', ')}. ${videoStyle}`,
          videoDuration: parseInt(videoDuration),
          videoStyle: moodBoard.join(', '),
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to generate scene plan');
      }

      const data = await response.json();
      
      // Transform to V2 format with additional fields
      const scenePlanV2: ScenePlanV2 = {
        projectTitle: data.scenePlan.projectTitle,
        totalDuration: data.scenePlan.totalDuration,
        overview: data.scenePlan.overview,
        styleGuide: moodBoard.join(', '),
        scenes: data.scenePlan.scenes.map((scene: any) => ({
          ...scene,
          visualPrompt: `${scene.description} - ${scene.shotType} shot`,
          mood: moodBoard[0] || 'Cinematic',
          cameraMovement: scene.shotType.includes('tracking') ? 'Tracking' : 
                          scene.shotType.includes('static') ? 'Static' : 'Dynamic',
        })),
      };
      
      setScenePlan(scenePlanV2);
      setActiveTab('preview');
      toast.success('Scene plan generated with V2 enhancements!');
    } catch (error) {
      console.error('Scene plan generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate scene plan');
    } finally {
      setIsGenerating(false);
      setIsStreaming(false);
    }
  };

  const toggleScene = (index: number) => {
    setExpandedScenes(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const copyScenePlan = () => {
    if (!scenePlan) return;
    
    let text = `# ${scenePlan.projectTitle}\n`;
    text += `Total Duration: ${scenePlan.totalDuration}\n`;
    text += `Style Guide: ${scenePlan.styleGuide}\n\n`;
    text += `## Overview\n${scenePlan.overview}\n\n`;
    text += `## Scenes\n\n`;
    
    scenePlan.scenes.forEach(scene => {
      text += `### Scene ${scene.sceneNumber}: ${scene.title}\n`;
      text += `- Duration: ${scene.duration}\n`;
      text += `- Shot Type: ${scene.shotType}\n`;
      text += `- Camera: ${scene.cameraMovement}\n`;
      text += `- Mood: ${scene.mood}\n`;
      text += `- Location: ${scene.location}\n`;
      text += `- Description: ${scene.description}\n`;
      text += `- Visual Prompt: ${scene.visualPrompt}\n\n`;
    });

    navigator.clipboard.writeText(text);
    toast.success('Scene plan copied to clipboard');
  };

  const resetForm = () => {
    setScenePlan(null);
    setProjectName('');
    setVideoDescription('');
    setVideoDuration('60');
    setVideoStyle('');
    setMoodBoard([]);
    setActiveTab('create');
  };

  return (
    <Card className="border-border/50 bg-gradient-to-br from-violet-500/5 to-purple-500/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                AI Scene Generator V2
                <Badge variant="secondary" className="bg-violet-500/20 text-violet-400 text-[10px]">
                  BETA
                </Badge>
              </CardTitle>
              <CardDescription>
                Enhanced scene generation with mood boards, visual prompts, and real-time preview
              </CardDescription>
            </div>
          </div>
          {scenePlan && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyScenePlan}>
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={resetForm}>
                <RefreshCw className="w-4 h-4 mr-1" />
                New
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="create" className="gap-2">
              <Wand2 className="w-4 h-4" />
              Create
            </TabsTrigger>
            <TabsTrigger value="mood" className="gap-2">
              <Lightbulb className="w-4 h-4" />
              Mood Board
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2" disabled={!scenePlan}>
              <Eye className="w-4 h-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4">
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input
                placeholder="My Video Project"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="bg-muted/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Video Concept *</Label>
              <Textarea
                placeholder="Describe your video idea in detail... What's the story, message, or concept?"
                value={videoDescription}
                onChange={(e) => setVideoDescription(e.target.value)}
                className="min-h-[120px] bg-muted/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (seconds)</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
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
                <Label>Additional Style Notes</Label>
                <Input
                  placeholder="Any specific style requirements..."
                  value={videoStyle}
                  onChange={(e) => setVideoStyle(e.target.value)}
                  className="bg-muted/50"
                />
              </div>
            </div>

            {moodBoard.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-muted/30">
                <span className="text-xs text-muted-foreground mr-2">Selected moods:</span>
                {moodBoard.map(mood => (
                  <Badge key={mood} variant="secondary" className="bg-violet-500/20 text-violet-400">
                    {mood}
                  </Badge>
                ))}
              </div>
            )}

            <Button
              onClick={generateScenePlan}
              disabled={isGenerating || !videoDescription.trim()}
              className="w-full gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isStreaming ? 'Generating...' : 'Processing...'}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Scene Plan V2
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="mood" className="space-y-4">
            <div className="space-y-2">
              <Label>Select Mood & Style</Label>
              <p className="text-sm text-muted-foreground">
                Choose the moods that best represent your video's feel
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {moods.map(mood => (
                <button
                  key={mood}
                  onClick={() => toggleMood(mood)}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all text-center",
                    moodBoard.includes(mood)
                      ? "border-violet-500 bg-violet-500/10 text-violet-400"
                      : "border-border/50 hover:border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="font-medium">{mood}</span>
                </button>
              ))}
            </div>

            <div className="pt-4">
              <Button 
                onClick={() => setActiveTab('create')} 
                className="w-full"
                variant="outline"
              >
                Back to Create
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            {scenePlan && (
              <div className="space-y-4">
                {/* Overview */}
                <div className="p-4 rounded-lg bg-gradient-to-r from-violet-500/10 to-purple-500/10">
                  <h3 className="font-semibold text-lg">{scenePlan.projectTitle}</h3>
                  <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {scenePlan.totalDuration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Film className="w-4 h-4" />
                      {scenePlan.scenes.length} scenes
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{scenePlan.overview}</p>
                </div>

                {/* Scenes */}
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {scenePlan.scenes.map((scene, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border border-border/50 rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() => toggleScene(index)}
                          className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                              {scene.sceneNumber}
                            </div>
                            <div className="text-left">
                              <div className="font-medium">{scene.title}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <span>{scene.duration}</span>
                                <span>•</span>
                                <span>{scene.shotType}</span>
                              </div>
                            </div>
                          </div>
                          {expandedScenes.includes(index) ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                        
                        <AnimatePresence>
                          {expandedScenes.includes(index) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-border/50"
                            >
                              <div className="p-4 space-y-3 bg-muted/20">
                                <p className="text-sm">{scene.description}</p>
                                
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Camera:</span>
                                    <span className="ml-2">{scene.cameraMovement}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Mood:</span>
                                    <span className="ml-2">{scene.mood}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Location:</span>
                                    <span className="ml-2">{scene.location}</span>
                                  </div>
                                </div>
                                
                                <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                                  <div className="flex items-center gap-2 text-xs text-violet-400 mb-1">
                                    <ImageIcon className="w-3 h-3" />
                                    Visual Prompt
                                  </div>
                                  <p className="text-sm text-violet-200">{scene.visualPrompt}</p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
