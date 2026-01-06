import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { MemberLayout } from '@/components/member/MemberLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Heart, 
  Bell, 
  ShoppingBag, 
  Settings,
  ArrowRight,
  Sparkles,
  Send,
  FileText
} from 'lucide-react';

interface DashboardStats {
  totalOrders: number;
  activeOrders: number;
  wishlistItems: number;
  unreadNotifications: number;
}

export default function MemberDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    activeOrders: 0,
    wishlistItems: 0,
    unreadNotifications: 0
  });
  const [profile, setProfile] = useState<{ full_name: string | null }>({ full_name: null });
  const [aiPrompt, setAiPrompt] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();
    
    if (profileData) setProfile(profileData);

    const [ordersResult, wishlistResult, notificationsResult] = await Promise.all([
      supabase.from('orders').select('id, status').eq('user_id', user.id),
      supabase.from('wishlist').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('read', false)
    ]);

    const orders = ordersResult.data || [];
    const activeStatuses = ['pending', 'accepted', 'in_progress', 'preview_sent', 'confirmed', 'processing', 'shipped'];
    
    setStats({
      totalOrders: orders.length,
      activeOrders: orders.filter(o => activeStatuses.includes(o.status)).length,
      wishlistItems: wishlistResult.count || 0,
      unreadNotifications: notificationsResult.count || 0
    });
  };

  if (loading || !user) {
    return (
      <MemberLayout showBreadcrumbs={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </MemberLayout>
    );
  }

  const firstName = profile.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  return (
    <MemberLayout showBreadcrumbs={false}>
      <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center pt-2 sm:pt-4"
        >
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-medium mb-1 sm:mb-2">{t.welcomeBack}, {firstName}</h1>
          <p className="text-muted-foreground text-sm sm:text-base">{t.hereToHelp}</p>
        </motion.div>

        {/* AI Creator Hero Card - Centered Featured Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center px-1"
        >
          <div className="relative w-full max-w-2xl overflow-hidden rounded-xl sm:rounded-2xl bg-card/40 backdrop-blur-xl border border-border/50 p-4 sm:p-6 lg:p-8">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-pink-500/5 pointer-events-none" />
            
            <div className="relative z-10">
              {/* Header with icon and badge */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-display text-base sm:text-lg font-medium text-amber-400">AI Media Creator</h2>
                    <p className="text-muted-foreground text-xs sm:text-sm">Create your media brief with AI magic ✨</p>
                  </div>
                </div>
                <span className="self-start sm:self-auto px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] sm:text-xs font-medium flex items-center gap-1 sm:gap-1.5 border border-emerald-500/30 whitespace-nowrap">
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Unlimited
                </span>
              </div>
              
              {/* Input Field */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (aiPrompt.trim()) {
                    navigate('/member/ai-creator', { state: { initialPrompt: aiPrompt.trim() } });
                  } else {
                    navigate('/member/ai-creator');
                  }
                }}
                className="relative"
              >
                <Input
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Type a description to generate a media brief..."
                  className="h-12 sm:h-14 bg-muted/30 border-border/50 text-foreground placeholder:text-muted-foreground text-sm sm:text-base pr-12 sm:pr-14 rounded-lg sm:rounded-xl focus-visible:ring-violet-500/50 focus-visible:border-violet-500/50"
                />
                <Button 
                  type="submit"
                  size="icon"
                  className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50"
                  variant="ghost"
                >
                  <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Button>
              </form>
            </div>
          </div>
        </motion.div>

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center justify-between px-1"
        >
          <div>
            <h2 className="font-display text-lg sm:text-xl font-medium">{t.quickActions}</h2>
            <p className="text-muted-foreground text-xs sm:text-sm">{t.hereToHelp}</p>
          </div>
        </motion.div>

        {/* Action Cards Grid - Responsive columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Orders Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link to="/member/orders" className="block group">
              <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-card/40 backdrop-blur-xl border border-border/50 p-4 sm:p-5 h-40 sm:h-44 hover:border-primary/30 hover:bg-card/60 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent pointer-events-none" />
                <div className="relative z-10 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                    </div>
                    {stats.activeOrders > 0 && (
                      <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-blue-500/20 text-blue-400 text-[10px] sm:text-xs font-medium border border-blue-500/30">
                        {stats.activeOrders} active
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-base sm:text-lg font-medium text-amber-400 mb-0.5 sm:mb-1">My Orders</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm flex-1">
                    {stats.totalOrders} total order{stats.totalOrders !== 1 ? 's' : ''}
                  </p>
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    View Orders <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Wishlist Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Link to="/member/wishlist" className="block group">
              <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-card/40 backdrop-blur-xl border border-border/50 p-4 sm:p-5 h-40 sm:h-44 hover:border-primary/30 hover:bg-card/60 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-transparent pointer-events-none" />
                <div className="relative z-10 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                      <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400" />
                    </div>
                    {stats.wishlistItems > 0 && (
                      <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-pink-500/20 text-pink-400 text-[10px] sm:text-xs font-medium border border-pink-500/30">
                        {stats.wishlistItems} saved
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-base sm:text-lg font-medium text-amber-400 mb-0.5 sm:mb-1">Wishlist</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm flex-1">Your saved items</p>
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    View Wishlist <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Shop Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link to="/member/shop" className="block group">
              <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-card/40 backdrop-blur-xl border border-border/50 p-4 sm:p-5 h-40 sm:h-44 hover:border-primary/30 hover:bg-card/60 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
                <div className="relative z-10 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                    </div>
                  </div>
                  <h3 className="font-display text-base sm:text-lg font-medium text-amber-400 mb-0.5 sm:mb-1">Shop</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm flex-1">Browse exclusive products</p>
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    Start Shopping <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Scene Plans Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Link to="/member/scene-plans" className="block group">
              <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-card/40 backdrop-blur-xl border border-border/50 p-4 sm:p-5 h-40 sm:h-44 hover:border-primary/30 hover:bg-card/60 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-transparent pointer-events-none" />
                <div className="relative z-10 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
                    </div>
                  </div>
                  <h3 className="font-display text-base sm:text-lg font-medium text-amber-400 mb-0.5 sm:mb-1">Scene Plans</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm flex-1">AI-generated scene breakdowns</p>
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    View Plans <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Notifications Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Link to="/member/notifications" className="block group">
              <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-card/40 backdrop-blur-xl border border-border/50 p-4 sm:p-5 h-40 sm:h-44 hover:border-primary/30 hover:bg-card/60 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent pointer-events-none" />
                <div className="relative z-10 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                      <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                    </div>
                    {stats.unreadNotifications > 0 && (
                      <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-destructive/20 text-destructive text-[10px] sm:text-xs font-medium border border-destructive/30 animate-pulse">
                        {stats.unreadNotifications} new
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-base sm:text-lg font-medium text-amber-400 mb-0.5 sm:mb-1">Notifications</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm flex-1">Updates & announcements</p>
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    View All <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Settings Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <Link to="/member/settings" className="block group">
              <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-card/40 backdrop-blur-xl border border-border/50 p-4 sm:p-5 h-40 sm:h-44 hover:border-primary/30 hover:bg-card/60 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-muted/20 via-transparent to-transparent pointer-events-none" />
                <div className="relative z-10 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-muted/30 border border-border/50 flex items-center justify-center">
                      <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                    </div>
                  </div>
                  <h3 className="font-display text-base sm:text-lg font-medium text-amber-400 mb-0.5 sm:mb-1">Settings</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm flex-1">Profile & preferences</p>
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    Manage <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Quick Stats Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-6 bg-card/40 backdrop-blur-xl border border-border/50 rounded-xl sm:rounded-2xl"
        >
          <div className="text-center">
            <p className="font-display text-xl sm:text-2xl font-medium">{stats.totalOrders}</p>
            <p className="text-muted-foreground text-xs sm:text-sm">Total Orders</p>
          </div>
          <div className="text-center">
            <p className="font-display text-xl sm:text-2xl font-medium">{stats.activeOrders}</p>
            <p className="text-muted-foreground text-xs sm:text-sm">Active Orders</p>
          </div>
          <div className="text-center">
            <p className="font-display text-xl sm:text-2xl font-medium">{stats.wishlistItems}</p>
            <p className="text-muted-foreground text-xs sm:text-sm">Wishlist Items</p>
          </div>
          <div className="text-center">
            <p className="font-display text-xl sm:text-2xl font-medium">{stats.unreadNotifications}</p>
            <p className="text-muted-foreground text-xs sm:text-sm">Notifications</p>
          </div>
        </motion.div>
      </div>
    </MemberLayout>
  );
}
