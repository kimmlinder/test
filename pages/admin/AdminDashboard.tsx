import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Package, 
  ShoppingBag, 
  Loader2,
  FolderOpen,
  FileText,
  Briefcase,
  UsersRound,
  Settings,
  ArrowRight,
  Home,
  Sparkles,
  CreditCard,
  Mail,
  LayoutGrid,
  BarChart3,
  Palette,
  MessageSquare
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ full_name: string | null }>({ full_name: null });

  useEffect(() => {
    if (isAdmin) {
      fetchProfile();
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();
    if (data) setProfile(data);
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

  const actionCards = [
    { 
      label: 'Manage Products', 
      description: 'Create, edit, and manage your product catalog',
      icon: Package, 
      href: '/admin/products', 
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      visual: 'products'
    },
    { 
      label: 'Manage Orders', 
      description: 'View and process customer orders',
      icon: ShoppingBag, 
      href: '/admin/orders', 
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      visual: 'orders'
    },
    { 
      label: 'View Analytics', 
      description: 'Analyze performance and revenue statistics',
      icon: BarChart3, 
      href: '/admin/orders', 
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      visual: 'analytics'
    },
    { 
      label: 'Manage Projects', 
      description: 'Create and manage your portfolio projects',
      icon: Briefcase, 
      href: '/admin/projects', 
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
      visual: 'projects'
    },
    { 
      label: 'Blog Posts', 
      description: 'Write and publish blog content',
      icon: FileText, 
      href: '/admin/blog', 
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
      visual: 'blog'
    },
    { 
      label: 'Team Members', 
      description: 'Manage your team profiles',
      icon: UsersRound, 
      href: '/admin/team', 
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
      visual: 'team'
    },
  ];

  const secondaryCards = [
    { label: 'Homepage', icon: Home, href: '/admin/homepage', color: 'text-rose-500', bgColor: 'bg-rose-500/10' },
    { label: 'Highlights', icon: Sparkles, href: '/admin/highlights', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    { label: 'Playground', icon: LayoutGrid, href: '/admin/playground', color: 'text-violet-500', bgColor: 'bg-violet-500/10' },
    { label: 'Users', icon: Users, href: '/admin/users', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { label: 'Categories', icon: FolderOpen, href: '/admin/categories', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
    { label: 'Agency', icon: Palette, href: '/admin/agency-settings', color: 'text-slate-500', bgColor: 'bg-slate-500/10' },
    { label: 'Payments', icon: CreditCard, href: '/admin/payment-settings', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
    { label: 'Newsletter', icon: Mail, href: '/admin/newsletter', color: 'text-rose-500', bgColor: 'bg-rose-500/10' },
    { label: 'Settings', icon: Settings, href: '/admin/settings', color: 'text-teal-500', bgColor: 'bg-teal-500/10' },
  ];

  // Visual illustrations for cards
  const CardVisual = ({ type }: { type: string }) => {
    switch (type) {
      case 'products':
        return (
          <div className="flex items-end gap-2 justify-center h-24">
            <div className="w-12 h-16 rounded-lg bg-gradient-to-b from-purple-400/40 to-purple-500/20 border border-purple-500/30" />
            <div className="w-10 h-20 rounded-lg bg-gradient-to-b from-purple-300/40 to-purple-400/20 border border-purple-400/30" />
            <div className="w-8 h-14 rounded-lg bg-gradient-to-b from-purple-500/40 to-purple-600/20 border border-purple-600/30" />
          </div>
        );
      case 'orders':
        return (
          <div className="flex flex-col gap-2 items-center justify-center h-24">
            <div className="w-32 h-6 rounded bg-green-500/20 border border-green-500/30 flex items-center px-2">
              <div className="w-4 h-4 rounded bg-green-500/40 mr-2" />
              <div className="flex-1 h-2 rounded bg-green-500/30" />
            </div>
            <div className="w-32 h-6 rounded bg-green-400/20 border border-green-400/30 flex items-center px-2">
              <div className="w-4 h-4 rounded bg-green-400/40 mr-2" />
              <div className="flex-1 h-2 rounded bg-green-400/30" />
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="flex gap-2 items-end justify-center h-24">
            <div className="w-6 h-8 rounded bg-orange-500/40" />
            <div className="w-6 h-14 rounded bg-orange-400/50" />
            <div className="w-6 h-10 rounded bg-orange-500/40" />
            <div className="w-6 h-16 rounded bg-orange-300/60" />
            <div className="w-6 h-12 rounded bg-orange-400/50" />
          </div>
        );
      case 'projects':
        return (
          <div className="grid grid-cols-2 gap-2 justify-center h-24 p-2">
            <div className="rounded-lg bg-cyan-500/30 border border-cyan-500/40" />
            <div className="rounded-lg bg-cyan-400/20 border border-cyan-400/30" />
            <div className="rounded-lg bg-cyan-400/20 border border-cyan-400/30" />
            <div className="rounded-lg bg-cyan-500/30 border border-cyan-500/40" />
          </div>
        );
      case 'blog':
        return (
          <div className="flex flex-col gap-1.5 items-center justify-center h-24">
            <div className="w-28 h-2.5 rounded bg-pink-500/40" />
            <div className="w-24 h-2 rounded bg-pink-400/30" />
            <div className="w-28 h-2 rounded bg-pink-400/30" />
            <div className="w-20 h-2 rounded bg-pink-300/30" />
          </div>
        );
      case 'team':
        return (
          <div className="flex items-center justify-center gap-1 h-24">
            <div className="w-10 h-10 rounded-full bg-indigo-500/30 border-2 border-indigo-500/40" />
            <div className="w-12 h-12 rounded-full bg-indigo-400/40 border-2 border-indigo-400/50 -ml-3" />
            <div className="w-10 h-10 rounded-full bg-indigo-500/30 border-2 border-indigo-500/40 -ml-3" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AdminLayout showBreadcrumbs={false}>
      <div className="space-y-6 md:space-y-8">
        {/* Welcome Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-medium text-primary mb-2">
            Welcome back, {profile.full_name || 'Admin'}
          </h1>
          <p className="text-muted-foreground font-body text-base lg:text-lg">
            What would you like to do today?
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Hero Card + Featured Card Row */}
            <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
              {/* Hero Card - spans 2 columns on desktop */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="lg:col-span-2 bg-gradient-to-br from-primary via-primary/90 to-primary/70 rounded-2xl md:rounded-3xl p-6 md:p-8 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 hidden sm:block">
                  <div className="absolute top-8 right-8 w-48 h-32 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/30 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-white/30" />
                      <div className="text-white/80 text-xs font-medium">Admin Panel</div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-white/30 rounded w-3/4" />
                      <div className="h-2 bg-white/20 rounded w-1/2" />
                    </div>
                  </div>
                </div>
                
                <div className="relative z-10 max-w-md">
                  <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-medium text-white mb-3">
                    Manage Your Store
                  </h2>
                  <p className="text-white/80 mb-6 font-body text-sm md:text-base">
                    Access your products, orders, and analytics. Everything you need to run your business.
                  </p>
                  <Button 
                    asChild
                    variant="secondary" 
                    className="bg-white text-primary hover:bg-white/90 w-full sm:w-auto"
                  >
                    <Link to="/admin/products">
                      View Products
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </motion.div>

              {/* Featured Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Link 
                  to="/admin/orders"
                  className="block h-full bg-card border border-border rounded-2xl md:rounded-3xl p-4 md:p-6 hover:border-primary/50 transition-all group"
                >
                  <div className="h-20 md:h-28 mb-4 flex items-center justify-center">
                    <div className="flex gap-2 md:gap-3">
                      <div className="w-12 md:w-16 h-16 md:h-20 rounded-xl bg-gradient-to-b from-blue-400/30 to-blue-500/20 border border-blue-500/30" />
                      <div className="w-10 md:w-14 h-20 md:h-24 rounded-xl bg-gradient-to-b from-blue-300/30 to-blue-400/20 border border-blue-400/30" />
                      <div className="w-8 md:w-12 h-14 md:h-18 rounded-xl bg-gradient-to-b from-blue-500/30 to-blue-600/20 border border-blue-600/30" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/10">
                      <ShoppingBag className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-medium group-hover:text-primary transition-colors">Manage Orders</h3>
                      <p className="text-sm text-muted-foreground">Track and process orders</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            </div>

            {/* Main Action Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              {actionCards.map((card, index) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                >
                  <Link 
                    to={card.href}
                    className="block h-full bg-card border border-border rounded-2xl md:rounded-3xl p-4 md:p-6 hover:border-primary/50 transition-all group"
                  >
                    <div className="mb-3 md:mb-4 hidden sm:block">
                      <CardVisual type={card.visual} />
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className={`p-2 rounded-xl ${card.bgColor}`}>
                        <card.icon className={`h-4 w-4 md:h-5 md:w-5 ${card.color}`} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm md:text-base group-hover:text-primary transition-colors truncate">{card.label}</h3>
                        <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">{card.description}</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Secondary Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-card border border-border rounded-2xl md:rounded-3xl p-4 md:p-6"
            >
              <h2 className="font-display text-base md:text-lg font-medium mb-4">Quick Access</h2>
              <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 md:gap-3">
                {secondaryCards.map((card) => (
                  <Link
                    key={card.label}
                    to={card.href}
                    className="group flex flex-col items-center justify-center p-3 md:p-4 bg-secondary/50 hover:bg-secondary rounded-xl md:rounded-2xl transition-all"
                  >
                    <div className={`p-2 md:p-2.5 rounded-lg md:rounded-xl ${card.bgColor} mb-1 md:mb-2 group-hover:scale-110 transition-transform`}>
                      <card.icon className={`h-4 w-4 md:h-5 md:w-5 ${card.color}`} />
                    </div>
                    <span className="font-body text-[10px] md:text-xs text-center text-muted-foreground group-hover:text-foreground transition-colors">{card.label}</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}