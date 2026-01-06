import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { toast } from 'sonner';
import { Plus, Pencil, Loader2, Briefcase, Eye, EyeOff, Trash2, X } from 'lucide-react';

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

const ProjectsSection = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState(emptyProject);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const { data: projects, isLoading } = useQuery({
    queryKey: ['admin-projects-section'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase.from('projects').update({ published }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-projects-section'] });
      toast.success('Project updated');
    },
    onError: () => toast.error('Failed to update project'),
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const openCreateDialog = () => {
    setEditingProject(null);
    setFormData(emptyProject);
    setDialogOpen(true);
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
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.category.trim()) {
      toast.error('Title and category are required');
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
        toast.success('Project updated');
      } else {
        const { error } = await supabase
          .from('projects')
          .insert(projectData);

        if (error) throw error;
        toast.success('Project created');
      }

      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-projects-section'] });
    } catch (error: any) {
      console.error('Error saving project:', error);
      toast.error(error.message?.includes('duplicate') 
        ? 'A project with this slug already exists.' 
        : 'Failed to save project');
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

      toast.success('Project deleted');
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['admin-projects-section'] });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-medium">Projects</h2>
          <p className="text-sm text-muted-foreground">Manage your portfolio projects</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Project
        </Button>
      </div>

      {projects?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No projects yet</p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add your first project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {projects?.map((project) => (
            <Card key={project.id}>
              <CardContent className="flex items-center gap-4 p-4">
                {project.image_url ? (
                  <img src={project.image_url} alt={project.title} className="w-20 h-14 object-cover rounded" />
                ) : (
                  <div className="w-20 h-14 bg-muted rounded flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{project.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{project.category}</Badge>
                    {project.year && <span className="text-xs text-muted-foreground">{project.year}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {project.published ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Switch
                      checked={project.published}
                      onCheckedChange={(checked) => togglePublishMutation.mutate({ id: project.id, published: checked })}
                    />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(project)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      setProjectToDelete(project);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="font-display text-xl">
              {editingProject ? 'Edit Project' : 'New Project'}
            </DialogTitle>
            <DialogDescription>
              {editingProject ? 'Update the project details below.' : 'Fill in the details for your new project.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-2">
            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="auto-generated"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., branding, web"
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
              <Label htmlFor="services">Services (comma-separated)</Label>
              <Input
                id="services"
                value={formData.services}
                onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                placeholder="branding, web design, development"
              />
            </div>

            <div className="space-y-2">
              <Label>Cover Image</Label>
              <ImageUpload
                value={formData.image_url}
                onChange={(url) => setFormData({ ...formData, image_url: url })}
                bucket="project-images"
              />
            </div>

            <div className="space-y-2">
              <Label>Gallery Images</Label>
              <div className="space-y-2">
                {formData.gallery_images.map((url, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <img src={url} alt={`Gallery ${index + 1}`} className="w-16 h-12 object-cover rounded flex-shrink-0" />
                    <span className="flex-1 text-sm truncate min-w-0">{url}</span>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon"
                      className="flex-shrink-0"
                      onClick={() => removeGalleryImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <ImageUpload
                  value=""
                  onChange={addGalleryImage}
                  bucket="project-images"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="published"
                checked={formData.published}
                onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
              />
              <Label htmlFor="published">Publish immediately</Label>
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 border-t pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingProject ? 'Update' : 'Create'}
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
    </div>
  );
};

export default ProjectsSection;
