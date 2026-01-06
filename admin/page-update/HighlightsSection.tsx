import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, GripVertical, ExternalLink, Loader2 } from 'lucide-react';
import { ImageUpload } from '@/components/admin/ImageUpload';

interface Highlight {
  id: string;
  title: string;
  category: string;
  image_url: string | null;
  link_url: string | null;
  display_order: number;
  published: boolean;
}

const HighlightsSection = () => {
  const queryClient = useQueryClient();
  const [editingHighlight, setEditingHighlight] = useState<Highlight | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    image_url: '',
    link_url: '',
    published: true,
  });

  const { data: highlights, isLoading } = useQuery({
    queryKey: ['admin-highlights'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('highlights')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as Highlight[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const maxOrder = highlights?.length ? Math.max(...highlights.map(h => h.display_order)) + 1 : 0;
      const { error } = await supabase.from('highlights').insert({
        title: data.title,
        category: data.category,
        image_url: data.image_url || null,
        link_url: data.link_url || null,
        published: data.published,
        display_order: maxOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-highlights'] });
      toast.success('Highlight created');
      resetForm();
    },
    onError: () => toast.error('Failed to create highlight'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from('highlights').update({
        title: data.title,
        category: data.category,
        image_url: data.image_url || null,
        link_url: data.link_url || null,
        published: data.published,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-highlights'] });
      toast.success('Highlight updated');
      resetForm();
    },
    onError: () => toast.error('Failed to update highlight'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('highlights').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-highlights'] });
      toast.success('Highlight deleted');
    },
    onError: () => toast.error('Failed to delete highlight'),
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase.from('highlights').update({ display_order: newOrder }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-highlights'] }),
  });

  const resetForm = () => {
    setFormData({ title: '', category: '', image_url: '', link_url: '', published: true });
    setEditingHighlight(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (highlight: Highlight) => {
    setEditingHighlight(highlight);
    setFormData({
      title: highlight.title,
      category: highlight.category,
      image_url: highlight.image_url || '',
      link_url: highlight.link_url || '',
      published: highlight.published,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingHighlight) {
      updateMutation.mutate({ id: editingHighlight.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const moveHighlight = (index: number, direction: 'up' | 'down') => {
    if (!highlights) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= highlights.length) return;
    
    const current = highlights[index];
    const target = highlights[newIndex];
    
    reorderMutation.mutate({ id: current.id, newOrder: target.display_order });
    reorderMutation.mutate({ id: target.id, newOrder: current.display_order });
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
          <h2 className="font-display text-xl font-medium">Highlights</h2>
          <p className="text-sm text-muted-foreground">Manage featured highlights shown on the homepage</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Highlight
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingHighlight ? 'Edit Highlight' : 'Add Highlight'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>Image</Label>
                <div className="mt-2">
                  <ImageUpload 
                    value={formData.image_url} 
                    onChange={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                    bucket="highlight-images"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="link_url">Link URL</Label>
                <Input
                  id="link_url"
                  value={formData.link_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                  placeholder="/project/muzeum"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="published"
                  checked={formData.published}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, published: checked }))}
                />
                <Label htmlFor="published">Published</Label>
              </div>
              <Button type="submit" className="w-full">
                {editingHighlight ? 'Update' : 'Create'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {highlights?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No highlights yet</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add your first highlight
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {highlights?.map((highlight, index) => (
            <Card key={highlight.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveHighlight(index, 'up')} disabled={index === 0}>
                    <GripVertical className="h-4 w-4 rotate-90" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveHighlight(index, 'down')} disabled={index === highlights.length - 1}>
                    <GripVertical className="h-4 w-4 rotate-90" />
                  </Button>
                </div>
                {highlight.image_url && (
                  <img src={highlight.image_url} alt={highlight.title} className="w-24 h-16 object-cover rounded" />
                )}
                <div className="flex-1">
                  <h3 className="font-medium">{highlight.title}</h3>
                  <p className="text-sm text-muted-foreground">{highlight.category}</p>
                  {highlight.link_url && (
                    <p className="text-xs text-primary flex items-center gap-1 mt-1">
                      <ExternalLink className="h-3 w-3" />
                      {highlight.link_url}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${highlight.published ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                    {highlight.published ? 'Published' : 'Draft'}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(highlight)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete this highlight?')) deleteMutation.mutate(highlight.id); }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default HighlightsSection;
