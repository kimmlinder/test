import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FlaskConical, 
  Search, 
  Filter, 
  Bug, 
  Lightbulb, 
  Heart, 
  MessageSquare,
  Star,
  User,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface BetaFeedback {
  id: string;
  user_id: string;
  feature_name: string;
  feedback_type: string;
  message: string;
  rating: number | null;
  created_at: string;
  user_email?: string;
}

export default function AdminBetaFeedback() {
  const [feedback, setFeedback] = useState<BetaFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterFeature, setFilterFeature] = useState<string>('all');

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('beta_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch user emails for each feedback
      const feedbackWithEmails = await Promise.all(
        (data || []).map(async (item) => {
          const { data: userData } = await supabase.auth.admin.getUserById(item.user_id).catch(() => ({ data: null }));
          return {
            ...item,
            user_email: userData?.user?.email || 'Unknown'
          };
        })
      );
      
      setFeedback(data || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug className="w-4 h-4 text-red-400" />;
      case 'suggestion': return <Lightbulb className="w-4 h-4 text-yellow-400" />;
      case 'praise': return <Heart className="w-4 h-4 text-pink-400" />;
      default: return <MessageSquare className="w-4 h-4 text-blue-400" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      bug: 'bg-red-500/10 text-red-400 border-red-500/20',
      suggestion: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      praise: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
      other: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    };
    return styles[type as keyof typeof styles] || styles.other;
  };

  const uniqueFeatures = [...new Set(feedback.map(f => f.feature_name))];

  const filteredFeedback = feedback.filter(item => {
    const matchesSearch = item.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.feature_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || item.feedback_type === filterType;
    const matchesFeature = filterFeature === 'all' || item.feature_name === filterFeature;
    return matchesSearch && matchesType && matchesFeature;
  });

  const stats = {
    total: feedback.length,
    bugs: feedback.filter(f => f.feedback_type === 'bug').length,
    suggestions: feedback.filter(f => f.feedback_type === 'suggestion').length,
    praise: feedback.filter(f => f.feedback_type === 'praise').length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
              <FlaskConical className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Beta Feedback</h1>
              <p className="text-muted-foreground">Review feedback from beta testers</p>
            </div>
          </div>
          <Button onClick={fetchFeedback} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bugs</p>
                  <p className="text-2xl font-bold text-red-400">{stats.bugs}</p>
                </div>
                <Bug className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Suggestions</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.suggestions}</p>
                </div>
                <Lightbulb className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Praise</p>
                  <p className="text-2xl font-bold text-pink-400">{stats.praise}</p>
                </div>
                <Heart className="w-8 h-8 text-pink-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search feedback..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="bug">Bugs</SelectItem>
                  <SelectItem value="suggestion">Suggestions</SelectItem>
                  <SelectItem value="praise">Praise</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterFeature} onValueChange={setFilterFeature}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Feature" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Features</SelectItem>
                  {uniqueFeatures.map(feature => (
                    <SelectItem key={feature} value={feature}>{feature}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Feedback List */}
        <Card>
          <CardHeader>
            <CardTitle>Feedback ({filteredFeedback.length})</CardTitle>
            <CardDescription>Click to expand and view full feedback</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : filteredFeedback.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FlaskConical className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No feedback found</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {filteredFeedback.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-lg border border-border/50 hover:border-border transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(item.feedback_type)}
                          <Badge variant="outline" className={getTypeBadge(item.feedback_type)}>
                            {item.feedback_type}
                          </Badge>
                          <Badge variant="secondary">{item.feature_name}</Badge>
                        </div>
                        {item.rating && (
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${star <= item.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-foreground mb-3">{item.message}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {item.user_id.slice(0, 8)}...
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(item.created_at), 'MMM d, yyyy HH:mm')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
