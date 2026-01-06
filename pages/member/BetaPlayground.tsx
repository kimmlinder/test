import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { BetaLayout } from '@/components/layouts/BetaLayout';
import { useBetaAccess } from '@/hooks/useBetaAccess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FlaskConical, Sparkles, Rocket, Shield, ArrowLeft, Command, Keyboard,
  Mic, Brain, Layers, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BetaFeedbackForm } from '@/components/beta/BetaFeedbackForm';
import { SceneGeneratorV2 } from '@/components/beta/SceneGeneratorV2';
import { AICreatorV2 } from '@/components/beta/AICreatorV2';
import { FocusModeToggle } from '@/components/beta/FocusModeToggle';
import { AIMoodBoard } from '@/components/beta/AIMoodBoard';
import { SmartTemplates } from '@/components/beta/SmartTemplates';
import { toast } from 'sonner';

export default function BetaPlayground() {
  const navigate = useNavigate();
  const { hasBetaAccess, isAdmin, loading } = useBetaAccess();

  useEffect(() => {
    if (!loading && !hasBetaAccess) {
      navigate('/member/settings');
    }
  }, [hasBetaAccess, loading, navigate]);

  if (loading) {
    return (
      <BetaLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </BetaLayout>
    );
  }

  if (!hasBetaAccess) {
    return null;
  }

  const upcomingFeatures = [
    {
      icon: Command,
      title: 'Quick Actions',
      description: 'Keyboard shortcuts and command palette for power users. Press ⌘K to try it!',
      status: 'live',
    },
    {
      icon: Mic,
      title: 'Voice Commands',
      description: 'Control the app with natural voice commands and dictation.',
      status: 'coming-soon',
    },
    {
      icon: Brain,
      title: 'AI Auto-Complete',
      description: 'Smart suggestions as you type descriptions and prompts.',
      status: 'coming-soon',
    },
    {
      icon: Layers,
      title: 'Multi-Layer Editor',
      description: 'Advanced composition editor with layer support.',
      status: 'coming-soon',
    },
    {
      icon: Zap,
      title: 'Batch Processing',
      description: 'Generate multiple variations at once with batch mode.',
      status: 'coming-soon',
    },
    {
      icon: Shield,
      title: 'Advanced Privacy',
      description: 'Granular privacy settings for your projects and data.',
      status: 'coming-soon',
    },
  ];

  return (
    <BetaLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/member')}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
              <FlaskConical className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">Beta Playground</h1>
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {isAdmin ? 'Admin Access' : 'Beta Tester'}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Explore and test upcoming features before they're released
              </p>
            </div>
          </div>
        </div>

        {/* Quick Tip */}
        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Keyboard className="h-5 w-5 text-purple-400" />
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-foreground">Pro Tip:</span>
                <span className="text-sm text-muted-foreground">Press</span>
                <Badge variant="outline" className="text-xs font-mono">⌘K</Badge>
                <span className="text-sm text-muted-foreground">for Quick Actions,</span>
                <Badge variant="outline" className="text-xs font-mono">⌘N</Badge>
                <span className="text-sm text-muted-foreground">for new items,</span>
                <Badge variant="outline" className="text-xs font-mono">⌘,</Badge>
                <span className="text-sm text-muted-foreground">for settings!</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* V2 AI Tools - Featured Beta Features */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SceneGeneratorV2 />
          <AICreatorV2 />
        </div>

        {/* Interactive Beta Features */}
        <div className="grid gap-6 lg:grid-cols-3">
          <FocusModeToggle />
          <AIMoodBoard />
          <SmartTemplates onSelectTemplate={(template) => toast.success(`Selected: ${template.title}`)} />
        </div>

        {/* Upcoming Features Grid */}
        <div>
          <h2 className="text-lg font-semibold mb-4">All Beta Features</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingFeatures.map((feature) => (
              <Card 
                key={feature.title} 
                className="group relative overflow-hidden border-border/50 transition-all hover:border-primary/30"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <feature.icon className="h-4 w-4" />
                    </div>
                    <Badge 
                      variant="outline" 
                      className={
                        feature.status === 'live' 
                          ? 'border-green-500/30 bg-green-500/10 text-green-400' 
                          : 'border-muted-foreground/30 bg-muted/50 text-muted-foreground'
                      }
                    >
                      {feature.status === 'live' ? 'Live' : 'Coming Soon'}
                    </Badge>
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                  <CardDescription className="text-xs">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Feedback Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          <BetaFeedbackForm featureName="Beta Playground" />
          
          {/* Usage Example */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How to use the beta hook</CardTitle>
              <CardDescription>
                Use useBetaAccess to conditionally show beta features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                <code className="text-foreground">{`import { useBetaAccess } from '@/hooks/useBetaAccess';

function MyComponent() {
  const { hasBetaAccess, isAdmin, loading } = useBetaAccess();

  if (!hasBetaAccess) return null;

  return <BetaFeature />;
}`}</code>
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </BetaLayout>
  );
}
