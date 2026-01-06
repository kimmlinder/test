import { useState, useEffect } from 'react';
import { MemberLayout } from '@/components/member/MemberLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Clapperboard, 
  Search, 
  Film, 
  Clock, 
  Calendar,
  Download,
  Trash2,
  Play,
  Loader2,
  FileText,
  ChevronDown,
  MapPin,
  Users,
  Music,
  StickyNote,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useBetaAccess } from '@/hooks/useBetaAccess';
import { toast } from 'sonner';
import { generateScenePlanPDF } from '@/utils/scenePlanPdfExport';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ScenePlanGenerator } from '@/components/member/ScenePlanGenerator';
import { SceneGeneratorV2 } from '@/components/beta/SceneGeneratorV2';

interface Scene {
  sceneNumber: number;
  title: string;
  duration: string;
  description: string;
  shotType: string;
  location: string;
  actors: string[];
  props: string[];
  audio: string;
  notes: string;
}

interface ScenePlan {
  projectTitle: string;
  totalDuration: string;
  scenes: Scene[];
  overview: string;
}

interface SavedScenePlan {
  id: string;
  project_name: string;
  video_description: string | null;
  video_duration: number | null;
  video_style: string | null;
  scene_plan: ScenePlan;
  created_at: string;
  updated_at: string;
}

export default function MemberScenePlans() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isAdmin } = useUserRole();
  const { hasBetaAccess } = useBetaAccess();
  const [scenePlans, setScenePlans] = useState<SavedScenePlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingPlan, setViewingPlan] = useState<SavedScenePlan | null>(null);
  const [expandedScenes, setExpandedScenes] = useState<number[]>([]);
  const [useV2Generator, setUseV2Generator] = useState(false);

  useEffect(() => {
    if (user) {
      fetchScenePlans();
    }
  }, [user]);

  const fetchScenePlans = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('scene_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const typedData = (data || []).map(plan => ({
        ...plan,
        scene_plan: plan.scene_plan as unknown as ScenePlan
      }));

      setScenePlans(typedData);
    } catch (error) {
      console.error('Error fetching scene plans:', error);
      toast.error(t.error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('scene_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setScenePlans(prev => prev.filter(plan => plan.id !== id));
      toast.success(t.scenePlanDeleted);
    } catch (error) {
      console.error('Error deleting scene plan:', error);
      toast.error(t.error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportPDF = (plan: SavedScenePlan) => {
    try {
      generateScenePlanPDF(plan);
      toast.success(t.pdfDownloadedSuccess);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(t.error);
    }
  };

  const handleLoadInGenerator = (plan: SavedScenePlan) => {
    navigate('/member/ai-creator', { 
      state: { 
        loadedScenePlan: plan 
      } 
    });
  };

  const toggleScene = (index: number) => {
    setExpandedScenes(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const filteredPlans = scenePlans.filter(plan =>
    plan.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.video_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.video_style?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show V2 generator option for admins
  const canSwitchGenerators = isAdmin && hasBetaAccess;

  return (
    <MemberLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <Clapperboard className="w-6 h-6 text-primary" />
              {t.savedScenePlans}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t.viewManageScenePlans}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Admin: Generator Version Toggle */}
            {canSwitchGenerators && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <Label htmlFor="v2-toggle" className="text-sm text-purple-400 flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  V2 Generator
                </Label>
                <Switch
                  id="v2-toggle"
                  checked={useV2Generator}
                  onCheckedChange={setUseV2Generator}
                />
              </div>
            )}
            <Button 
              onClick={() => navigate('/member/ai-creator')}
              className="gap-2"
            >
              <Film className="w-4 h-4" />
              {t.createNew}
            </Button>
          </div>
        </div>

        {/* Generator Section */}
        {canSwitchGenerators && useV2Generator ? (
          <SceneGeneratorV2 />
        ) : hasBetaAccess ? (
          <SceneGeneratorV2 />
        ) : (
          <ScenePlanGenerator projectName="New Project" />
        )}

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t.searchScenePlans}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredPlans.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                {searchQuery ? t.noMatchingPlans : t.noSavedPlans}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? t.tryDifferentSearch 
                  : t.generateFirstPlan}
              </p>
              {!searchQuery && (
                <Button onClick={() => navigate('/member/ai-creator')}>
                  {t.goToAiCreator}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredPlans.map((plan) => (
              <Card key={plan.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                        <Clapperboard className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{plan.project_name}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Film className="w-3 h-3" />
                            {plan.scene_plan.scenes?.length || 0} scenes
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {plan.scene_plan.totalDuration || `${plan.video_duration}s`}
                          </span>
                          {plan.video_style && (
                            <Badge variant="secondary" className="text-xs">
                              {plan.video_style}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(plan.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setViewingPlan(plan);
                          setExpandedScenes([0]);
                        }}
                        className="h-8 gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        <span className="hidden sm:inline">{t.view}</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportPDF(plan)}
                        className="h-8 gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span className="hidden sm:inline">PDF</span>
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleLoadInGenerator(plan)}
                        className="h-8 gap-1"
                      >
                        <Play className="w-3 h-3" />
                        <span className="hidden sm:inline">{t.load}</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            {deletingId === plan.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t.deleteScenePlan}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t.deleteScenePlanConfirm}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(plan.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {t.delete}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* View Dialog */}
        <Dialog open={!!viewingPlan} onOpenChange={(open) => !open && setViewingPlan(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clapperboard className="w-5 h-5 text-primary" />
                {viewingPlan?.project_name}
              </DialogTitle>
            </DialogHeader>
            
            {viewingPlan && (
              <div className="flex-1 overflow-hidden flex flex-col">
                {/* Plan info */}
                <div className="p-4 bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-lg mb-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {viewingPlan.scene_plan.totalDuration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Film className="w-4 h-4" />
                      {viewingPlan.scene_plan.scenes.length} scenes
                    </span>
                    {viewingPlan.video_style && (
                      <Badge variant="secondary">{viewingPlan.video_style}</Badge>
                    )}
                  </div>
                  {viewingPlan.scene_plan.overview && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {viewingPlan.scene_plan.overview}
                    </p>
                  )}
                </div>

                {/* Scenes */}
                <ScrollArea className="flex-1">
                  <div className="space-y-2 pr-4">
                    {viewingPlan.scene_plan.scenes.map((scene, index) => (
                      <div key={index} className="border rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleScene(index)}
                          className="w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-medium text-primary shrink-0">
                            {scene.sceneNumber}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium">{scene.title}</span>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <span>{scene.duration}</span>
                              <span>•</span>
                              <span>{scene.shotType}</span>
                            </div>
                          </div>
                          <motion.div
                            animate={{ rotate: expandedScenes.includes(index) ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          </motion.div>
                        </button>
                        
                        <AnimatePresence>
                          {expandedScenes.includes(index) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 pt-0 space-y-3 bg-muted/30">
                                <p className="text-sm text-muted-foreground">
                                  {scene.description}
                                </p>
                                
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  {scene.location && (
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                      <MapPin className="w-3 h-3" />
                                      {scene.location}
                                    </div>
                                  )}
                                  {scene.actors && scene.actors.length > 0 && (
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                      <Users className="w-3 h-3" />
                                      {scene.actors.join(', ')}
                                    </div>
                                  )}
                                  {scene.audio && (
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                      <Music className="w-3 h-3" />
                                      {scene.audio}
                                    </div>
                                  )}
                                  {scene.notes && (
                                    <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                                      <StickyNote className="w-3 h-3" />
                                      {scene.notes}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MemberLayout>
  );
}
