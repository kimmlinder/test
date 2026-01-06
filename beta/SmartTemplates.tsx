import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Video, 
  Image as ImageIcon, 
  Palette, 
  Music, 
  Megaphone,
  Instagram,
  Youtube,
  Store,
  Sparkles,
  ArrowRight,
  Zap,
  Loader2,
  Wand2,
  Save,
  Brain,
  Lightbulb,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SmartTemplate {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  prompt: string;
  mediaType: string;
  tags: string[];
  aiEnhanced?: boolean;
}

const baseTemplates: SmartTemplate[] = [
  {
    id: 'social-video',
    title: 'Social Media Video',
    description: 'Short-form videos for Instagram, TikTok, or YouTube Shorts',
    icon: Instagram,
    color: 'from-pink-500 to-purple-500',
    mediaType: 'video',
    tags: ['Social', 'Short-form', 'Viral'],
    prompt: 'I want to create an engaging short-form video for social media. It should be eye-catching, fast-paced, and optimized for vertical viewing.'
  },
  {
    id: 'youtube-video',
    title: 'YouTube Video',
    description: 'Professional long-form video content',
    icon: Youtube,
    color: 'from-red-500 to-red-600',
    mediaType: 'video',
    tags: ['Long-form', 'Professional'],
    prompt: 'I need a professional YouTube video with a compelling intro, clear structure, and call-to-action outro.'
  },
  {
    id: 'product-shoot',
    title: 'Product Photography',
    description: 'High-quality product photos for e-commerce',
    icon: Store,
    color: 'from-amber-500 to-orange-500',
    mediaType: 'photo',
    tags: ['E-commerce', 'Product'],
    prompt: 'I need professional product photography that showcases my product from multiple angles with clean backgrounds.'
  },
  {
    id: 'brand-content',
    title: 'Brand Story Video',
    description: 'Tell your brand story through cinematic visuals',
    icon: Megaphone,
    color: 'from-blue-500 to-cyan-500',
    mediaType: 'video',
    tags: ['Branding', 'Storytelling'],
    prompt: 'I want to create a brand story video that emotionally connects with my audience and showcases our values.'
  },
  {
    id: 'music-video',
    title: 'Music Video',
    description: 'Creative music video with unique visual concepts',
    icon: Music,
    color: 'from-purple-500 to-pink-500',
    mediaType: 'video',
    tags: ['Music', 'Creative'],
    prompt: 'I want to create a music video that visually represents the mood and message of my song.'
  },
  {
    id: 'graphic-design',
    title: 'Brand Identity Design',
    description: 'Complete visual identity including logo and assets',
    icon: Palette,
    color: 'from-green-500 to-emerald-500',
    mediaType: 'graphic',
    tags: ['Logo', 'Branding'],
    prompt: 'I need a complete brand identity design including logo, color palette, and typography.'
  },
];

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-creator-v2`;

interface SmartTemplatesProps {
  onSelectTemplate: (template: SmartTemplate) => void;
}

export function SmartTemplates({ onSelectTemplate }: SmartTemplatesProps) {
  const { user } = useAuth();
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiTemplates, setAiTemplates] = useState<SmartTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const categories = [
    { id: 'video', label: 'Video', icon: Video },
    { id: 'photo', label: 'Photo', icon: ImageIcon },
    { id: 'graphic', label: 'Graphic', icon: Palette },
  ];

  const filteredTemplates = selectedCategory 
    ? baseTemplates.filter(t => t.mediaType === selectedCategory)
    : baseTemplates;

  const generateAITemplates = async () => {
    if (!customPrompt.trim()) {
      toast.error('Please describe your project first');
      return;
    }

    setIsGenerating(true);
    setAiTemplates([]);

    try {
      const response = await fetch(AI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          mode: 'brainstorm',
          prompt: `Based on this project idea: "${customPrompt}"
          
Generate 4 unique template suggestions. For each, provide:
1. A catchy title (3-5 words)
2. A brief description (1 sentence)
3. The media type (video, photo, or graphic)
4. 2-3 relevant tags
5. A detailed prompt that would help create this project

Format as JSON array with keys: title, description, mediaType, tags (array), prompt`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate templates');
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
            if (delta) content += delta;
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const templates = JSON.parse(jsonMatch[0]);
        const iconMap: Record<string, React.ElementType> = {
          video: Video,
          photo: ImageIcon,
          graphic: Palette,
        };
        const colorMap: Record<string, string> = {
          video: 'from-indigo-500 to-purple-500',
          photo: 'from-rose-500 to-pink-500',
          graphic: 'from-teal-500 to-cyan-500',
        };

        const smartTemplates: SmartTemplate[] = templates.map((t: any, idx: number) => ({
          id: `ai-${idx}`,
          title: t.title || `AI Template ${idx + 1}`,
          description: t.description || 'AI-generated template',
          icon: iconMap[t.mediaType] || Sparkles,
          color: colorMap[t.mediaType] || 'from-purple-500 to-blue-500',
          mediaType: t.mediaType || 'video',
          tags: t.tags || ['AI Generated'],
          prompt: t.prompt || customPrompt,
          aiEnhanced: true,
        }));

        setAiTemplates(smartTemplates);
        toast.success('Generated custom templates!');
      }
    } catch (error) {
      console.error('Template generation error:', error);
      toast.error('Failed to generate templates');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveTemplate = async (template: SmartTemplate) => {
    if (!user) {
      toast.error('Please sign in to save templates');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('ai_creations' as any)
        .insert({
          user_id: user.id,
          creation_type: 'template',
          title: template.title,
          content: template.prompt,
          metadata: {
            description: template.description,
            mediaType: template.mediaType,
            tags: template.tags,
            aiEnhanced: template.aiEnhanced,
          },
        } as any);

      if (error) throw error;
      toast.success('Template saved!');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-border/50 bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Lightbulb className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-lg">Smart Templates</h3>
              <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-400 text-[10px]">
                V2 BETA
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-powered templates that adapt to your needs
            </p>
          </div>
        </div>

        {/* Custom AI Template Generator */}
        <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-indigo-400" />
            <Label className="text-sm font-medium">Generate Custom Templates</Label>
          </div>
          <Textarea
            placeholder="Describe your project idea and let AI create tailored templates..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="min-h-[80px] bg-background/50"
          />
          <Button
            onClick={generateAITemplates}
            disabled={isGenerating || !customPrompt.trim()}
            className="w-full gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Templates...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Generate AI Templates
              </>
            )}
          </Button>
        </div>

        {/* AI Generated Templates */}
        <AnimatePresence>
          {aiTemplates.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-medium">AI-Generated for You</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aiTemplates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className="p-4 border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br",
                          template.color
                        )}>
                          <template.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm truncate">{template.title}</h4>
                            <Badge variant="outline" className="text-[10px] border-indigo-500/30 text-indigo-400">
                              <Zap className="w-2 h-2 mr-1" />
                              AI
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {template.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {template.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded-full bg-muted text-[10px] text-muted-foreground"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button 
                              size="sm" 
                              onClick={() => onSelectTemplate(template)}
                              className="flex-1 h-8 text-xs"
                            >
                              Use Template
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => saveTemplate(template)}
                              className="h-8 px-2"
                              disabled={isSaving}
                            >
                              <Save className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter:</span>
          <div className="flex gap-2">
            <Button
              variant={selectedCategory === null ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="h-7 text-xs"
            >
              All
            </Button>
            {categories.map(cat => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                className="h-7 text-xs gap-1"
              >
                <cat.icon className="w-3 h-3" />
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Base Templates */}
        <ScrollArea className="h-[300px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className="p-4 border-border/50 bg-card/50 hover:bg-card/80 transition-all cursor-pointer group"
                  onClick={() => onSelectTemplate(template)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br",
                      template.color
                    )}>
                      <template.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
                          {template.title}
                        </h4>
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {template.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {template.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full bg-muted text-[10px] text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
}

export type { SmartTemplate };
