import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Loader2, Users, Trash2 } from 'lucide-react';
import { ImageUpload } from '@/components/admin/ImageUpload';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  image_url: string | null;
  display_order: number;
  published: boolean;
}

const TeamSection = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    bio: '',
    image_url: '',
    published: true,
  });
  const [saving, setSaving] = useState(false);

  const { data: members, isLoading } = useQuery({
    queryKey: ['admin-team-section'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as TeamMember[];
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase.from('team_members').update({ published }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-team-section'] });
      toast.success('Team member updated');
    },
    onError: () => toast.error('Failed to update team member'),
  });

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      bio: '',
      image_url: '',
      published: true,
    });
    setEditingMember(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      role: member.role,
      bio: member.bio || '',
      image_url: member.image_url || '',
      published: member.published,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.role.trim()) {
      toast.error('Name and role are required');
      return;
    }

    setSaving(true);
    try {
      if (editingMember) {
        const { error } = await supabase
          .from('team_members')
          .update({
            name: formData.name,
            role: formData.role,
            bio: formData.bio || null,
            image_url: formData.image_url || null,
            published: formData.published,
          })
          .eq('id', editingMember.id);
        if (error) throw error;
        toast.success('Team member updated');
      } else {
        const maxOrder = members?.length ? Math.max(...members.map(m => m.display_order || 0)) : 0;
        const { error } = await supabase.from('team_members').insert({
          name: formData.name,
          role: formData.role,
          bio: formData.bio || null,
          image_url: formData.image_url || null,
          published: formData.published,
          display_order: maxOrder + 1,
        });
        if (error) throw error;
        toast.success('Team member created');
      }
      queryClient.invalidateQueries({ queryKey: ['admin-team-section'] });
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving team member:', error);
      toast.error('Failed to save team member');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingMember) return;
    if (!confirm('Are you sure you want to delete this team member?')) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('team_members').delete().eq('id', editingMember.id);
      if (error) throw error;
      toast.success('Team member deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-team-section'] });
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error deleting team member:', error);
      toast.error('Failed to delete team member');
    } finally {
      setSaving(false);
    }
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
          <h2 className="font-display text-xl font-medium">Team Members</h2>
          <p className="text-sm text-muted-foreground">Manage your team members displayed on the about page</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      {members?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No team members yet</p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add your first team member
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {members?.map((member) => (
            <Card key={member.id}>
              <CardContent className="flex items-center gap-4 p-4">
                {member.image_url ? (
                  <img src={member.image_url} alt={member.name} className="w-14 h-14 object-cover rounded-full" />
                ) : (
                  <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{member.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{member.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={member.published}
                    onCheckedChange={(checked) => togglePublishMutation.mutate({ id: member.id, published: checked })}
                  />
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(member)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMember ? 'Edit Team Member' : 'Add Team Member'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="Creative Director"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="A short bio..."
                rows={3}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label>Photo</Label>
              <ImageUpload
                value={formData.image_url}
                onChange={(url) => setFormData({ ...formData, image_url: url })}
                bucket="avatars"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="published"
                checked={formData.published}
                onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                disabled={saving}
              />
              <Label htmlFor="published">Published</Label>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {editingMember && (
              <Button variant="destructive" onClick={handleDelete} disabled={saving} className="sm:mr-auto">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingMember ? 'Save Changes' : 'Add Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamSection;
