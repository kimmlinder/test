import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { 
  Loader2, 
  Home, 
  Image, 
  Video, 
  Briefcase,
  Save,
  Plus,
  Trash2,
  GripVertical
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  category: string;
  image_url: string | null;
}

interface HomepageSettings {
  id: string;
  hero_media_type: 'images' | 'video';
  hero_video_url: string | null;
  hero_images: string[];
  featured_project_ids: string[];
}

export default function AdminHomepage() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<HomepageSettings | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [heroMediaType, setHeroMediaType] = useState<'images' | 'video'>('images');
  const [heroVideoUrl, setHeroVideoUrl] = useState('');
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      const [settingsRes, projectsRes] = await Promise.all([
        supabase.from('homepage_settings').select('*').single(),
        supabase.from('projects').select('id, title, category, image_url').eq('published', true)
      ]);

      if (settingsRes.data) {
        const data = settingsRes.data as HomepageSettings;
        setSettings(data);
        setHeroMediaType(data.hero_media_type);
        setHeroVideoUrl(data.hero_video_url || '');
        setHeroImages(data.hero_images || []);
        setSelectedProjectIds(data.featured_project_ids || []);
      }

      if (projectsRes.data) {
        setProjects(projectsRes.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('homepage_settings')
        .update({
          hero_media_type: heroMediaType,
          hero_video_url: heroVideoUrl || null,
          hero_images: heroImages,
          featured_project_ids: selectedProjectIds
        })
        .eq('id', settings.id);

      if (error) throw error;

      toast({
        title: 'Settings saved',
        description: 'Homepage settings have been updated successfully.',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const addHeroImage = (url: string) => {
    if (heroImages.length < 6) {
      setHeroImages([...heroImages, url]);
    }
  };

  const removeHeroImage = (index: number) => {
    setHeroImages(heroImages.filter((_, i) => i !== index));
  };

  const toggleProjectSelection = (projectId: string) => {
    if (selectedProjectIds.includes(projectId)) {
      setSelectedProjectIds(selectedProjectIds.filter(id => id !== projectId));
    } else if (selectedProjectIds.length < 6) {
      setSelectedProjectIds([...selectedProjectIds, projectId]);
    } else {
      toast({
        title: 'Maximum reached',
        description: 'You can only feature up to 6 projects.',
        variant: 'destructive',
      });
    }
  };

  const moveProject = (fromIndex: number, toIndex: number) => {
    const newOrder = [...selectedProjectIds];
    const [removed] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, removed);
    setSelectedProjectIds(newOrder);
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/member" replace />;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <Home className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-medium">Homepage Settings</h1>
          </div>
          <p className="text-muted-foreground">Manage your hero section media and featured projects</p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="hero" className="space-y-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="hero" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Hero Media
              </TabsTrigger>
              <TabsTrigger value="projects" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Featured Projects
              </TabsTrigger>
            </TabsList>

            {/* Hero Media Tab */}
            <TabsContent value="hero" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-2xl p-6"
              >
                <h2 className="font-display text-xl font-medium mb-6">Hero Media Type</h2>
                
                <div className="flex gap-4 mb-8">
                  <button
                    onClick={() => setHeroMediaType('images')}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                      heroMediaType === 'images' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Image className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="font-body text-sm font-medium">Image Slider</p>
                    <p className="font-body text-xs text-muted-foreground mt-1">
                      Rotating background images
                    </p>
                  </button>
                  
                  <button
                    onClick={() => setHeroMediaType('video')}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                      heroMediaType === 'video' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Video className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="font-body text-sm font-medium">Video Background</p>
                    <p className="font-body text-xs text-muted-foreground mt-1">
                      YouTube or Vimeo video
                    </p>
                  </button>
                </div>

                {heroMediaType === 'video' ? (
                  <div className="space-y-4">
                    <Label htmlFor="videoUrl">Video URL</Label>
                    <Input
                      id="videoUrl"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={heroVideoUrl}
                      onChange={(e) => setHeroVideoUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter a YouTube or Vimeo URL. The video will autoplay muted in the background.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Hero Images ({heroImages.length}/6)</Label>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {heroImages.map((url, index) => (
                        <div key={index} className="relative aspect-video rounded-lg overflow-hidden group">
                          <img 
                            src={url} 
                            alt={`Hero ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => removeHeroImage(index)}
                            className="absolute top-2 right-2 p-1.5 bg-destructive rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4 text-destructive-foreground" />
                          </button>
                        </div>
                      ))}
                      
                      {heroImages.length < 6 && (
                        <div className="aspect-video">
                          <ImageUpload
                            value=""
                            onChange={addHeroImage}
                            bucket="product-images"
                          />
                        </div>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      Upload up to 6 images. They will rotate automatically in the hero section.
                    </p>
                  </div>
                )}
              </motion.div>
            </TabsContent>

            {/* Featured Projects Tab */}
            <TabsContent value="projects" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-2xl p-6"
              >
                <h2 className="font-display text-xl font-medium mb-2">Featured Projects</h2>
                <p className="text-muted-foreground text-sm mb-6">
                  Select up to 6 projects to feature on the homepage. Drag to reorder.
                </p>

                {/* Selected Projects */}
                {selectedProjectIds.length > 0 && (
                  <div className="mb-8">
                    <Label className="mb-4 block">Selected Projects ({selectedProjectIds.length}/6)</Label>
                    <div className="space-y-2">
                      {selectedProjectIds.map((id, index) => {
                        const project = projects.find(p => p.id === id);
                        if (!project) return null;
                        return (
                          <div 
                            key={id}
                            className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg"
                          >
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </span>
                            {project.image_url && (
                              <img 
                                src={project.image_url} 
                                alt={project.title}
                                className="w-12 h-8 object-cover rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{project.title}</p>
                              <p className="text-xs text-muted-foreground">{project.category}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              {index > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveProject(index, index - 1)}
                                >
                                  ↑
                                </Button>
                              )}
                              {index < selectedProjectIds.length - 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveProject(index, index + 1)}
                                >
                                  ↓
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleProjectSelection(id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Available Projects */}
                <div>
                  <Label className="mb-4 block">Available Projects</Label>
                  {projects.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">
                      No published projects available. Create some projects first.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {projects
                        .filter(p => !selectedProjectIds.includes(p.id))
                        .map((project) => (
                          <button
                            key={project.id}
                            onClick={() => toggleProjectSelection(project.id)}
                            className="flex items-center gap-3 p-3 bg-secondary/30 hover:bg-secondary/50 rounded-lg transition-colors text-left"
                          >
                            {project.image_url && (
                              <img 
                                src={project.image_url} 
                                alt={project.title}
                                className="w-16 h-10 object-cover rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{project.title}</p>
                              <p className="text-xs text-muted-foreground">{project.category}</p>
                            </div>
                            <Plus className="h-4 w-4 text-primary" />
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </TabsContent>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} size="lg">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
}