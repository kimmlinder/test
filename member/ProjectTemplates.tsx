import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Video, 
  ImageIcon, 
  Palette, 
  Music, 
  Megaphone,
  Instagram,
  Youtube,
  Store,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectTemplate {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  prompt: string;
  mediaType: string;
  tags: string[];
}

const templates: ProjectTemplate[] = [
  {
    id: 'social-video',
    title: 'Social Media Video',
    description: 'Short-form videos for Instagram, TikTok, or YouTube Shorts',
    icon: Instagram,
    color: 'from-pink-500 to-purple-500',
    mediaType: 'video',
    tags: ['Social', 'Short-form', 'Viral'],
    prompt: 'I want to create an engaging short-form video for social media. It should be eye-catching, fast-paced, and optimized for vertical viewing. I want something that will stop people from scrolling.'
  },
  {
    id: 'youtube-video',
    title: 'YouTube Video',
    description: 'Professional long-form video content with intro and outro',
    icon: Youtube,
    color: 'from-red-500 to-red-600',
    mediaType: 'video',
    tags: ['Long-form', 'Professional', 'Educational'],
    prompt: 'I need a professional YouTube video with a compelling intro, clear structure, and a call-to-action outro. The video should maintain viewer engagement throughout.'
  },
  {
    id: 'product-shoot',
    title: 'Product Photography',
    description: 'High-quality product photos for e-commerce or marketing',
    icon: Store,
    color: 'from-amber-500 to-orange-500',
    mediaType: 'photo',
    tags: ['E-commerce', 'Marketing', 'Product'],
    prompt: 'I need professional product photography that showcases my product from multiple angles. Clean backgrounds, perfect lighting, and attention to detail are essential.'
  },
  {
    id: 'brand-content',
    title: 'Brand Story Video',
    description: 'Tell your brand story through cinematic visuals',
    icon: Megaphone,
    color: 'from-blue-500 to-cyan-500',
    mediaType: 'video',
    tags: ['Branding', 'Storytelling', 'Cinematic'],
    prompt: 'I want to create a brand story video that emotionally connects with my audience. It should showcase our values, mission, and what makes us unique in a cinematic way.'
  },
  {
    id: 'music-video',
    title: 'Music Video',
    description: 'Creative music video with unique visual concepts',
    icon: Music,
    color: 'from-purple-500 to-pink-500',
    mediaType: 'video',
    tags: ['Music', 'Creative', 'Artistic'],
    prompt: 'I want to create a music video that visually represents the mood and message of my song. I\'m looking for creative concepts, interesting locations, and dynamic editing.'
  },
  {
    id: 'graphic-design',
    title: 'Brand Identity Design',
    description: 'Complete visual identity including logo and brand assets',
    icon: Palette,
    color: 'from-green-500 to-emerald-500',
    mediaType: 'graphic',
    tags: ['Logo', 'Branding', 'Identity'],
    prompt: 'I need a complete brand identity design including a memorable logo, color palette, typography, and brand guidelines that reflect my business values and appeal to my target audience.'
  },
];

interface ProjectTemplatesProps {
  onSelectTemplate: (template: ProjectTemplate) => void;
}

export function ProjectTemplates({ onSelectTemplate }: ProjectTemplatesProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
          <Sparkles className="w-4 h-4" />
          Quick Start Templates
        </div>
        <h3 className="font-display text-xl font-medium">Choose a template to get started</h3>
        <p className="text-muted-foreground text-sm">
          Select a template that matches your project type for faster setup
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className="p-4 border-border/50 bg-card/50 hover:bg-card/80 transition-all cursor-pointer group"
              onClick={() => onSelectTemplate(template)}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br",
                  template.color
                )}>
                  <template.icon className="w-6 h-6 text-white" />
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
    </div>
  );
}

export type { ProjectTemplate };
