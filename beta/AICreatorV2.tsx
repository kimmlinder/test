import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Zap,
  Loader2,
  Sparkles,
  Video,
  Image as ImageIcon,
  Palette,
  FileText,
  Wand2,
  RefreshCw,
  Copy,
  Lightbulb,
  Rocket,
  Clock,
  Check,
  Paperclip,
  X,
  Brain,
  Save,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { MarkdownRenderer } from '@/components/member/MarkdownRenderer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const AI_CREATOR_V2_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-creator-v2`;

interface GenerationMode {
  id: string;
  label: string;
  description: string;
  icon: typeof Zap;
  color: string;
}

const generationModes: GenerationMode[] = [
  { id: 'quick', label: 'Quick Brief', description: '< 30 seconds', icon: Zap, color: 'text-yellow-400' },
  { id: 'detailed', label: 'Full Brief', description: 'Comprehensive', icon: FileText, color: 'text-blue-400' },
  { id: 'brainstorm', label: 'Brainstorm', description: '5 concepts', icon: Lightbulb, color: 'text-purple-400' },
  { id: 'refine', label: 'Refine', description: 'Enhance existing', icon: Sparkles, color: 'text-pink-400' },
];

const projectTypes = [
  { id: 'video', label: 'Video', icon: Video },
  { id: 'photo', label: 'Photo', icon: ImageIcon },
  { id: 'graphic', label: 'Graphic Design', icon: Palette },
  { id: 'content', label: 'Content', icon: FileText },
];

const stylePresets = [
  'Cinematic', 'Minimalist', 'Bold & Vibrant', 'Professional', 
  'Playful', 'Elegant', 'Retro', 'Modern'
];

const AI_MOCKUP_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-media-assistant`;

export function AICreatorV2() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('create');
  const [selectedMode, setSelectedMode] = useState<string>('quick');
  const [selectedProjectType, setSelectedProjectType] = useState<string>('');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  
  // Mockup generation state
  const [isGeneratingMockup, setIsGeneratingMockup] = useState(false);
  const [generatedMockup, setGeneratedMockup] = useState<string | null>(null);
  
  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number>(0);

  const toggleStyle = (style: string) => {
    setSelectedStyles(prev => 
      prev.includes(style) 
        ? prev.filter(s => s !== style)
        : prev.length < 3 ? [...prev, style] : prev
    );
  };

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
      };
      reader.readAsDataURL(file);
    }
  };

  const clearReferenceImage = () => {
    setReferenceImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const generate = async () => {
    if (!prompt.trim()) {
      toast.error('Please describe your project');
      return;
    }

    setIsGenerating(true);
    setGeneratedContent('');
    startTimeRef.current = Date.now();

    try {
      const response = await fetch(AI_CREATOR_V2_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          mode: selectedMode,
          prompt,
          projectType: selectedProjectType,
          style: selectedStyles.join(', '),
          referenceImage,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 429) {
          toast.error('Too many requests. Please wait a moment.');
          return;
        }
        if (response.status === 402) {
          toast.error('Usage limit reached. Please add credits.');
          return;
        }
        throw new Error(error.error || 'Failed to generate');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let content = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              content += delta;
              setGeneratedContent(content);
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      setGenerationTime(Date.now() - startTimeRef.current);
      setActiveTab('result');
      toast.success(`Generated in ${((Date.now() - startTimeRef.current) / 1000).toFixed(1)}s`);

    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMockup = async () => {
    if (!generatedContent) {
      toast.error('Generate content first');
      return;
    }

    setIsGeneratingMockup(true);
    try {
      const mockupPrompt = `Based on this creative brief, create a professional mockup visualization: ${generatedContent.slice(0, 500)}`;
      
      const response = await fetch(AI_MOCKUP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          generateImage: true,
          imagePrompt: mockupPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate mockup');
      }

      const data = await response.json();
      if (data.image) {
        setGeneratedMockup(data.image);
        toast.success('Mockup generated!');
      }
    } catch (error) {
      console.error('Mockup generation error:', error);
      toast.error('Failed to generate mockup');
    } finally {
      setIsGeneratingMockup(false);
    }
  };

  const saveCreation = async () => {
    if (!user || !generatedContent) {
      toast.error('Please generate content first');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('ai_creations' as any)
        .insert({
          user_id: user.id,
          creation_type: 'creative_brief',
          title: `${selectedMode} Brief - ${selectedProjectType || 'General'}`,
          content: generatedContent,
          image_url: generatedMockup,
          metadata: {
            mode: selectedMode,
            projectType: selectedProjectType,
            styles: selectedStyles,
            generationTime: generationTime,
          },
        } as any);

      if (error) throw error;
      setIsSaved(true);
      toast.success('Creation saved!');
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save creation');
    } finally {
      setIsSaving(false);
    }
  };

  const copyContent = () => {
    navigator.clipboard.writeText(generatedContent);
    toast.success('Copied to clipboard');
  };

  const reset = () => {
    setGeneratedContent('');
    setGeneratedMockup(null);
    setPrompt('');
    setSelectedStyles([]);
    setSelectedProjectType('');
    setReferenceImage(null);
    setGenerationTime(null);
    setIsSaved(false);
    setActiveTab('create');
  };

  return (
    <Card className="border-border/50 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                AI Creator V2
                <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 text-[10px]">
                  BETA
                </Badge>
              </CardTitle>
              <CardDescription>
                Smarter & faster creative briefs with mode selection
              </CardDescription>
            </div>
          </div>
          {generatedContent && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={saveCreation} disabled={isSaving || isSaved}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                {isSaved ? 'Saved' : 'Save'}
              </Button>
              <Button variant="outline" size="sm" onClick={copyContent}>
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={reset}>
                <RefreshCw className="w-4 h-4 mr-1" />
                New
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="create" className="gap-2">
              <Wand2 className="w-4 h-4" />
              Create
            </TabsTrigger>
            <TabsTrigger value="result" className="gap-2" disabled={!generatedContent}>
              <Sparkles className="w-4 h-4" />
              Result
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-5">
            {/* Generation Mode */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Generation Mode</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {generationModes.map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setSelectedMode(mode.id)}
                    className={cn(
                      "p-3 rounded-xl border-2 transition-all text-left",
                      selectedMode === mode.id
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-border/50 hover:border-border"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <mode.icon className={cn("w-4 h-4", mode.color)} />
                      <span className="font-medium text-sm">{mode.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{mode.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Project Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Project Type (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {projectTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedProjectType(selectedProjectType === type.id ? '' : type.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
                      selectedProjectType === type.id
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                        : "border-border/50 hover:border-border text-muted-foreground"
                    )}
                  >
                    <type.icon className="w-4 h-4" />
                    <span className="text-sm">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Style Presets */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Style Presets (select up to 3)</Label>
              <div className="flex flex-wrap gap-2">
                {stylePresets.map(style => (
                  <button
                    key={style}
                    onClick={() => toggleStyle(style)}
                    className={cn(
                      "px-3 py-1.5 rounded-full border text-sm transition-all",
                      selectedStyles.includes(style)
                        ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                        : "border-border/50 hover:border-border text-muted-foreground"
                    )}
                  >
                    {selectedStyles.includes(style) && <Check className="w-3 h-3 inline mr-1" />}
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Reference Image */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Reference Image (optional)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {referenceImage ? (
                <div className="relative inline-block">
                  <img 
                    src={referenceImage} 
                    alt="Reference" 
                    className="h-20 w-20 object-cover rounded-lg border border-border"
                  />
                  <button
                    onClick={clearReferenceImage}
                    className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Paperclip className="w-4 h-4" />
                  Add Reference
                </Button>
              )}
            </div>

            {/* Prompt */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Describe Your Project *</Label>
              <Textarea
                placeholder="What are you creating? Describe your vision, target audience, key message, and any specific requirements..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px] bg-muted/50"
              />
            </div>

            {/* Generate Button */}
            <Button
              onClick={generate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  Generate with AI V2
                </>
              )}
            </Button>

            {/* Streaming Preview */}
            {isGenerating && generatedContent && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-muted/30 border border-border/50"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                  <span className="text-xs text-muted-foreground">Streaming response...</span>
                </div>
                <div className="text-sm text-muted-foreground line-clamp-3">
                  {generatedContent.slice(0, 200)}...
                </div>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="result">
            {generatedContent && (
              <div className="space-y-4">
                {/* Stats Bar */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant="outline" className="gap-1">
                      {generationModes.find(m => m.id === selectedMode)?.label}
                    </Badge>
                    {selectedProjectType && (
                      <Badge variant="outline" className="gap-1">
                        {projectTypes.find(t => t.id === selectedProjectType)?.label}
                      </Badge>
                    )}
                  </div>
                  {generationTime && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {(generationTime / 1000).toFixed(1)}s
                    </div>
                  )}
                </div>

                {/* Content */}
                <ScrollArea className="h-[300px]">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <MarkdownRenderer content={generatedContent} />
                  </div>
                </ScrollArea>

                {/* Generated Mockup */}
                {generatedMockup && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Generated Mockup</Label>
                    <div className="relative rounded-lg overflow-hidden border border-border">
                      <img 
                        src={generatedMockup} 
                        alt="Generated mockup" 
                        className="w-full h-48 object-cover"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute bottom-2 right-2 gap-1"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = generatedMockup;
                          link.download = 'mockup.png';
                          link.click();
                        }}
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </Button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={generateMockup}
                    disabled={isGeneratingMockup}
                  >
                    {isGeneratingMockup ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ImageIcon className="w-4 h-4" />
                    )}
                    Mockup
                  </Button>
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => {
                      setSelectedMode('refine');
                      setPrompt(`Refine this concept:\n\n${generatedContent.slice(0, 500)}...`);
                      setActiveTab('create');
                    }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Refine
                  </Button>
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => {
                      setSelectedMode('brainstorm');
                      setActiveTab('create');
                    }}
                  >
                    <Lightbulb className="w-4 h-4" />
                    Ideas
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}