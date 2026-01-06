import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface Project {
  id: string;
  title: string;
  category: string;
  image_url: string | null;
  show_in_playground: boolean;
  playground_order: number;
  playground_scale: string;
  playground_align: string;
}

const PlaygroundSection = () => {
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['admin-playground-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, category, image_url, show_in_playground, playground_order, playground_scale, playground_align')
        .eq('published', true)
        .order('playground_order', { ascending: true });
      if (error) throw error;
      return data as Project[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Project> }) => {
      const { error } = await supabase.from('projects').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-playground-projects'] });
    },
    onError: () => toast.error('Failed to update'),
  });

  const togglePlayground = (project: Project) => {
    updateMutation.mutate({
      id: project.id,
      updates: { show_in_playground: !project.show_in_playground }
    });
  };

  const updateScale = (projectId: string, scale: string) => {
    updateMutation.mutate({ id: projectId, updates: { playground_scale: scale } });
  };

  const updateAlign = (projectId: string, align: string) => {
    updateMutation.mutate({ id: projectId, updates: { playground_align: align } });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const playgroundProjects = projects?.filter(p => p.show_in_playground) || [];
  const availableProjects = projects?.filter(p => !p.show_in_playground) || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-medium">Playground Projects</h2>
        <p className="text-sm text-muted-foreground">Configure which projects appear in the playground section</p>
      </div>

      {/* Projects in Playground */}
      <div className="space-y-4">
        <Label>In Playground ({playgroundProjects.length})</Label>
        {playgroundProjects.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No projects in playground. Enable some below.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {playgroundProjects.map((project) => (
              <Card key={project.id}>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-4">
                    {project.image_url ? (
                      <img src={project.image_url} alt={project.title} className="w-20 h-14 object-cover rounded flex-shrink-0" />
                    ) : (
                      <div className="w-20 h-14 bg-muted rounded flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{project.title}</h3>
                      <p className="text-sm text-muted-foreground">{project.category}</p>
                    </div>
                    <Switch checked={true} onCheckedChange={() => togglePlayground(project)} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pl-0 md:pl-24">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground whitespace-nowrap">Scale:</Label>
                      <Select value={project.playground_scale || 'medium'} onValueChange={(v) => updateScale(project.id, v)}>
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground whitespace-nowrap">Align:</Label>
                      <Select value={project.playground_align || 'center'} onValueChange={(v) => updateAlign(project.id, v)}>
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Available Projects */}
      <div className="space-y-4">
        <Label>Available Projects ({availableProjects.length})</Label>
        {availableProjects.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              All published projects are in the playground.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {availableProjects.map((project) => (
              <Card key={project.id} className="opacity-60 hover:opacity-100 transition-opacity">
                <CardContent className="flex items-center gap-4 p-4">
                  {project.image_url && (
                    <img src={project.image_url} alt={project.title} className="w-20 h-14 object-cover rounded" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{project.title}</h3>
                    <p className="text-sm text-muted-foreground">{project.category}</p>
                  </div>
                  <Switch checked={false} onCheckedChange={() => togglePlayground(project)} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaygroundSection;
