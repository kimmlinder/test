import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, LayoutGrid, GripVertical, Eye, EyeOff } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  category: string;
  image_url: string | null;
  year: string | null;
  slug: string;
  published: boolean;
  show_in_playground: boolean;
  playground_align: string;
  playground_scale: string;
  playground_order: number;
}

export default function AdminPlayground() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['admin-playground-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('playground_order', { ascending: true });
      
      if (error) throw error;
      return data as Project[];
    },
    enabled: isAdmin
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Project> }) => {
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-playground-projects'] });
      toast.success('Project updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const handleTogglePlayground = (project: Project) => {
    updateMutation.mutate({
      id: project.id,
      updates: { show_in_playground: !project.show_in_playground }
    });
  };

  const handleAlignChange = (projectId: string, align: string) => {
    updateMutation.mutate({
      id: projectId,
      updates: { playground_align: align }
    });
  };

  const handleScaleChange = (projectId: string, scale: string) => {
    updateMutation.mutate({
      id: projectId,
      updates: { playground_scale: scale }
    });
  };

  const handleOrderChange = (projectId: string, order: string) => {
    const orderNum = parseInt(order, 10);
    if (!isNaN(orderNum)) {
      updateMutation.mutate({
        id: projectId,
        updates: { playground_order: orderNum }
      });
    }
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

  const playgroundProjects = projects.filter(p => p.show_in_playground);
  const availableProjects = projects.filter(p => !p.show_in_playground && p.published);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-violet-500/10">
              <LayoutGrid className="h-6 w-6 text-violet-500" />
            </div>
            <h1 className="font-display text-3xl font-medium">Manage Playground</h1>
          </div>
          <p className="text-muted-foreground">
            Select which projects appear in the Playground archive and customize their display.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Playground Projects */}
            <div>
              <h2 className="font-display text-xl font-medium mb-4 flex items-center gap-2">
                <Eye className="h-5 w-5 text-green-500" />
                In Playground ({playgroundProjects.length})
              </h2>
              {playgroundProjects.length === 0 ? (
                <Card className="bg-secondary/30">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No projects in the Playground yet. Add some from below.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {playgroundProjects
                    .sort((a, b) => a.playground_order - b.playground_order)
                    .map((project) => (
                      <Card key={project.id} className="bg-card border-green-500/20">
                        <CardContent className="py-4">
                          <div className="flex items-center gap-4">
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                            
                            {project.image_url && (
                              <img
                                src={project.image_url}
                                alt={project.title}
                                className="w-16 h-12 object-cover rounded"
                              />
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium truncate">{project.title}</h3>
                              <p className="text-sm text-muted-foreground">{project.category}</p>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Label className="text-xs text-muted-foreground">Order</Label>
                                <Input
                                  type="number"
                                  value={project.playground_order}
                                  onChange={(e) => handleOrderChange(project.id, e.target.value)}
                                  className="w-16 h-8"
                                />
                              </div>

                              <div className="flex items-center gap-2">
                                <Label className="text-xs text-muted-foreground">Align</Label>
                                <Select
                                  value={project.playground_align}
                                  onValueChange={(value) => handleAlignChange(project.id, value)}
                                >
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

                              <div className="flex items-center gap-2">
                                <Label className="text-xs text-muted-foreground">Size</Label>
                                <Select
                                  value={project.playground_scale}
                                  onValueChange={(value) => handleScaleChange(project.id, value)}
                                >
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

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleTogglePlayground(project)}
                                className="text-destructive hover:text-destructive"
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </div>

            {/* Available Projects */}
            <div>
              <h2 className="font-display text-xl font-medium mb-4 flex items-center gap-2">
                <EyeOff className="h-5 w-5 text-muted-foreground" />
                Available Projects ({availableProjects.length})
              </h2>
              {availableProjects.length === 0 ? (
                <Card className="bg-secondary/30">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    All published projects are in the Playground.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableProjects.map((project) => (
                    <Card key={project.id} className="bg-card">
                      <CardContent className="py-4">
                        <div className="flex items-center gap-4">
                          {project.image_url && (
                            <img
                              src={project.image_url}
                              alt={project.title}
                              className="w-16 h-12 object-cover rounded"
                            />
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{project.title}</h3>
                            <p className="text-sm text-muted-foreground">{project.category}</p>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTogglePlayground(project)}
                          >
                            Add
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}