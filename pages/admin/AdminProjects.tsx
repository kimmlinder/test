import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { 
  Loader2,
  Plus,
  Edit,
  Trash2,
  FolderOpen,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  slug: string;
  category: string;
  description: string | null;
  challenge: string | null;
  solution: string | null;
  client: string | null;
  year: string | null;
  services: string[] | null;
  image_url: string | null;
  gallery_images: string[] | null;
  gallery_display_type: string | null;
  published: boolean;
  created_at: string;
}

const emptyProject = {
  title: '',
  slug: '',
  category: '',
  description: '',
  challenge: '',
  solution: '',
  client: '',
  year: new Date().getFullYear().toString(),
  services: '',
  image_url: '',
  gallery_images: [] as string[],
  gallery_display_type: 'stacked',
  published: false,
};

export default function AdminProjects() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState(emptyProject);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  useEffect(() => {
    if (isAdmin) {
      fetchProjects();
    }
  }, [isAdmin]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const openCreateDialog = () => {
    setEditingProject(null);
    setFormData(emptyProject);
    setIsDialogOpen(true);
  };

  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      slug: project.slug,
      category: project.category,
      description: project.description || '',
      challenge: project.challenge || '',
      solution: project.solution || '',
      client: project.client || '',
      year: project.year || '',
      services: project.services?.join(', ') || '',
      image_url: project.image_url || '',
      gallery_images: project.gallery_images || [],
      gallery_display_type: project.gallery_display_type || 'stacked',
      published: project.published,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.category.trim()) {
      toast({
        title: "Error",
        description: "Title and category are required.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const slug = formData.slug.trim() || generateSlug(formData.title);
      const servicesArray = formData.services
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      const projectData = {
        title: formData.title.trim(),
        slug,
        category: formData.category.trim(),
        description: formData.description.trim() || null,
        challenge: formData.challenge.trim() || null,
        solution: formData.solution.trim() || null,
        client: formData.client.trim() || null,
        year: formData.year.trim() || null,
        services: servicesArray.length > 0 ? servicesArray : null,
        image_url: formData.image_url.trim() || null,
        gallery_images: formData.gallery_images.length > 0 ? formData.gallery_images : null,
        gallery_display_type: formData.gallery_display_type,
        published: formData.published,
      };

      if (editingProject) {
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', editingProject.id);

        if (error) throw error;

        toast({
          title: "Project updated",
          description: "The project has been updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from('projects')
          .insert(projectData);

        if (error) throw error;

        toast({
          title: "Project created",
          description: "The new project has been added.",
        });
      }

      setIsDialogOpen(false);
      fetchProjects();
    } catch (error: any) {
      console.error('Error saving project:', error);
      toast({
        title: "Error",
        description: error.message?.includes('duplicate') 
          ? "A project with this slug already exists." 
          : "Failed to save project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!projectToDelete) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectToDelete.id);

      if (error) throw error;

      toast({
        title: "Project deleted",
        description: "The project has been removed.",
      });

      setDeleteDialogOpen(false);
      setProjectToDelete(null);
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const togglePublish = async (project: Project) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ published: !project.published })
        .eq('id', project.id);

      if (error) throw error;

      toast({
        title: project.published ? "Project unpublished" : "Project published",
        description: project.published 
          ? "The project is now hidden from the portfolio." 
          : "The project is now visible on the portfolio.",
      });

      fetchProjects();
    } catch (error) {
      console.error('Error toggling publish:', error);
    }
  };

  const addGalleryImage = (url: string) => {
    if (url && !formData.gallery_images.includes(url)) {
      setFormData({ ...formData, gallery_images: [...formData.gallery_images, url] });
    }
  };

  const removeGalleryImage = (index: number) => {
    const newImages = formData.gallery_images.filter((_, i) => i !== index);
    setFormData({ ...formData, gallery_images: newImages });
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-light tracking-tight mb-2">
            Manage Projects
          </h1>
          <p className="text-muted-foreground font-body text-sm md:text-base">
            Create and manage portfolio projects
          </p>
        </div>
        <Button className="gap-2 w-full sm:w-auto" onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left px-6 py-4 font-body text-sm font-medium text-muted-foreground">Project</th>
                  <th className="text-left px-6 py-4 font-body text-sm font-medium text-muted-foreground">Category</th>
                  <th className="text-left px-6 py-4 font-body text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-6 py-4 font-body text-sm font-medium text-muted-foreground hidden lg:table-cell">Year</th>
                  <th className="text-right px-6 py-4 font-body text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                          {project.image_url ? (
                            <img src={project.image_url} alt={project.title} className="w-full h-full object-cover" />
                          ) : (
                            <FolderOpen className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{project.title}</p>
                          <p className="text-sm text-muted-foreground">/{project.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm capitalize">{project.category}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => togglePublish(project)}
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                          project.published 
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                            : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                        } transition-colors`}
                      >
                        {project.published ? (
                          <>
                            <Eye className="h-3 w-3" />
                            Published
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3" />
                            Draft
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground hidden lg:table-cell">
                      {project.year || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(project)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setProjectToDelete(project);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      No projects yet. Click "New Project" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-border">
            {projects.map((project) => (
              <div key={project.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {project.image_url ? (
                        <img src={project.image_url} alt={project.title} className="w-full h-full object-cover" />
                      ) : (
                        <FolderOpen className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{project.title}</p>
                      <p className="text-sm text-muted-foreground capitalize">{project.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(project)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setProjectToDelete(project);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => togglePublish(project)}
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                      project.published 
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                    } transition-colors`}
                  >
                    {project.published ? (
                      <>
                        <Eye className="h-3 w-3" />
                        Published
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3" />
                        Draft
                      </>
                    )}
                  </button>
                  {project.year && (
                    <span className="text-sm text-muted-foreground">{project.year}</span>
                  )}
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <div className="px-6 py-12 text-center text-muted-foreground">
                No projects yet. Click "New Project" to create one.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingProject ? 'Edit Project' : 'New Project'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ 
                    ...formData, 
                    title: e.target.value,
                    slug: formData.slug || generateSlug(e.target.value)
                  });
                }}
                placeholder="Project title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="project-url-slug"
              />
              <p className="text-xs text-muted-foreground">Leave blank to auto-generate from title</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., photo, video, design"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  placeholder="2024"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Input
                id="client"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                placeholder="Client name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="services">Services</Label>
              <Input
                id="services"
                value={formData.services}
                onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                placeholder="Photography, Editing, Color Grading (comma-separated)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Project description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="challenge">Challenge</Label>
              <Textarea
                id="challenge"
                value={formData.challenge}
                onChange={(e) => setFormData({ ...formData, challenge: e.target.value })}
                placeholder="What was the challenge?"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="solution">Solution</Label>
              <Textarea
                id="solution"
                value={formData.solution}
                onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                placeholder="How did you solve it?"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Featured Image/Video</Label>
              <ImageUpload
                value={formData.image_url}
                onChange={(url) => setFormData({ ...formData, image_url: url })}
                disabled={saving}
                acceptVideo
                bucket="product-images"
              />
            </div>

            <div className="space-y-2">
              <Label>Gallery (Images & Videos)</Label>
              <ImageUpload
                value=""
                onChange={(url) => addGalleryImage(url)}
                disabled={saving}
                acceptVideo
                bucket="product-images"
              />
              {formData.gallery_images.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {formData.gallery_images.map((media, idx) => {
                    const isVideo = media.match(/\.(mp4|webm|ogg|mov)$/i) || media.includes('video');
                    return (
                      <div key={idx} className="relative group">
                        {isVideo ? (
                          <video src={media} className="w-full h-16 object-cover rounded" muted />
                        ) : (
                          <img src={media} alt={`Gallery ${idx + 1}`} className="w-full h-16 object-cover rounded" />
                        )}
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(idx)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Gallery Display</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gallery_display_type"
                    value="stacked"
                    checked={formData.gallery_display_type === 'stacked'}
                    onChange={() => setFormData({ ...formData, gallery_display_type: 'stacked' })}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-sm">Stacked (below each other)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gallery_display_type"
                    value="carousel"
                    checked={formData.gallery_display_type === 'carousel'}
                    onChange={() => setFormData({ ...formData, gallery_display_type: 'carousel' })}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-sm">Carousel (swipeable)</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <Label htmlFor="published">Publish</Label>
                <p className="text-sm text-muted-foreground">Make this project visible on the portfolio</p>
              </div>
              <Switch
                id="published"
                checked={formData.published}
                onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingProject ? 'Save Changes' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{projectToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}