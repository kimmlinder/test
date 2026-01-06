import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Package, 
  Heart, 
  Bell, 
  Settings,
  Store,
  Wand2,
  Sparkles,
  TrendingUp,
  Users,
  ShoppingBag,
  Home,
  CreditCard,
  Mail,
  Crown,
  Film,
  ArrowLeftRight,
  FlaskConical,
  Clapperboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { useBetaAccess } from '@/hooks/useBetaAccess';

interface BetaSidebarProps {
  variant?: 'member' | 'admin';
}

export function BetaSidebar({ variant = 'member' }: BetaSidebarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { hasBetaAccess } = useBetaAccess();
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null }>({ 
    full_name: null, 
    avatar_url: null 
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle();
    if (data) setProfile(data);
  };

  const getInitials = (name: string | null, email: string | undefined) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    if (email) return email[0].toUpperCase();
    return 'U';
  };

  const memberMenuSections = [
    {
      label: t.personal || 'PERSONAL',
      items: [
        { title: t.dashboard, url: '/member', icon: TrendingUp },
        { title: t.aiCreator, url: '/member/ai-creator', icon: Wand2 },
        { title: t.scenePlans, url: '/member/scene-plans', icon: Film },
        { title: t.features, url: '/member/features', icon: Sparkles },
      ]
    },
    {
      label: t.shopSection || 'SHOP',
      items: [
        { title: t.shop, url: '/member/shop', icon: Store },
        { title: t.orders, url: '/member/orders', icon: Package },
        { title: t.wishlist, url: '/member/wishlist', icon: Heart },
      ]
    },
    {
      label: t.account || 'ACCOUNT',
      items: [
        { title: t.notifications, url: '/member/notifications', icon: Bell },
        { title: t.settings, url: '/member/settings', icon: Settings },
        ...(hasBetaAccess ? [
          { title: 'Cinema Studio', url: '/member/cinema-studio', icon: Clapperboard, isBeta: true },
          { title: 'Beta Playground', url: '/member/beta-playground', icon: FlaskConical, isBeta: true }
        ] : []),
      ]
    }
  ];

  const adminMenuSections = [
    {
      label: 'DASHBOARD',
      items: [
        { title: t.dashboard, url: '/admin', icon: LayoutDashboard },
        { title: 'Page Update', url: '/admin/page-update', icon: Home },
      ]
    },
    {
      label: 'CONTENT',
      items: [
        { title: 'Users', url: '/admin/users', icon: Users },
        { title: 'Newsletter', url: '/admin/newsletter', icon: Mail },
      ]
    },
    {
      label: 'SHOP',
      items: [
        { title: t.orders, url: '/admin/orders', icon: ShoppingBag },
        { title: 'Subscriptions', url: '/admin/subscriptions', icon: Crown },
        { title: 'Payments', url: '/admin/payment-settings', icon: CreditCard },
      ]
    },
    {
      label: 'BETA',
      items: [
        { title: 'Beta Feedback', url: '/admin/beta-feedback', icon: FlaskConical, isBeta: true },
      ]
    },
    {
      label: 'SETTINGS',
      items: [
        { title: t.settings, url: '/admin/settings', icon: Settings },
      ]
    }
  ];

  const menuSections = variant === 'admin' ? adminMenuSections : memberMenuSections;
  const settingsUrl = variant === 'admin' ? '/admin/settings' : '/member/settings';
  const switchUrl = variant === 'admin' ? '/member' : '/admin';
  const switchLabel = variant === 'admin' ? t.memberView : t.adminView;

  return (
    <div 
      className={cn(
        "fixed left-0 top-0 z-50 flex h-screen flex-col items-start border-r border-border/50 bg-background/95 backdrop-blur-xl py-4 transition-all duration-300 ease-in-out",
        isExpanded ? "w-56" : "w-14"
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo */}
      <Link 
        to={variant === 'member' ? '/member' : '/admin'} 
        className={cn(
          "mb-6 flex h-10 items-center gap-3 rounded-xl transition-all duration-300",
          isExpanded ? "px-3 w-full" : "w-14 justify-center"
        )}
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 shadow-lg shadow-orange-500/20">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        {isExpanded && (
          <div className="flex flex-col overflow-hidden">
            <span className="font-display text-lg font-semibold text-foreground whitespace-nowrap">
              {variant === 'admin' ? t.admin : t.member}
            </span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{t.portal}</span>
          </div>
        )}
      </Link>

      {/* Main Navigation */}
      <nav className="flex flex-1 flex-col items-start gap-1 overflow-y-auto scrollbar-none w-full px-2">
        {menuSections.map((section) => (
          <div key={section.label} className="w-full mb-2">
            {isExpanded && (
              <div className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider px-3 mb-1">
                {section.label}
              </div>
            )}
          {section.items.map((item: { title: string; url: string; icon: React.ComponentType<{ className?: string }>; isBeta?: boolean }) => {
              const isActive = location.pathname === item.url;
              return isExpanded ? (
                <Link
                  key={item.url}
                  to={item.url}
                  className={cn(
                    "flex h-10 w-full items-center gap-3 rounded-xl px-3 transition-all duration-200",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    item.isBeta && "bg-purple-500/5 hover:bg-purple-500/10"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 flex-shrink-0", item.isBeta && "text-purple-400")} />
                  <span className="text-sm font-medium whitespace-nowrap overflow-hidden">{item.title}</span>
                  {item.isBeta && (
                    <Badge variant="secondary" className="ml-auto h-5 bg-purple-500/20 text-purple-400 text-[10px] px-1.5">
                      BETA
                    </Badge>
                  )}
                </Link>
              ) : (
                <Tooltip key={item.url} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.url}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 relative",
                        isActive 
                          ? "bg-primary/10 text-primary" 
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        item.isBeta && "bg-purple-500/5"
                      )}
                    >
                      <item.icon className={cn("h-5 w-5", item.isBeta && "text-purple-400")} />
                      {item.isBeta && (
                        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-purple-500" />
                      )}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="border-border/50 bg-popover flex items-center gap-2">
                    {item.title}
                    {item.isBeta && (
                      <Badge variant="secondary" className="h-4 bg-purple-500/20 text-purple-400 text-[9px] px-1">
                        BETA
                      </Badge>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="flex flex-col items-start gap-1 mb-2 w-full px-2">
        {/* Admin/Member Switch - Only for Admins */}
        {isAdmin && (
          isExpanded ? (
            <Link
              to={switchUrl}
              className="flex h-10 w-full items-center gap-3 rounded-xl px-3 transition-all duration-200 bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-400 hover:from-purple-500/20 hover:to-pink-500/20"
            >
              <ArrowLeftRight className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium whitespace-nowrap overflow-hidden">{switchLabel}</span>
            </Link>
          ) : (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  to={switchUrl}
                  className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-400 hover:from-purple-500/20 hover:to-pink-500/20"
                >
                  <ArrowLeftRight className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="border-border/50 bg-popover">
                {switchLabel}
              </TooltipContent>
            </Tooltip>
          )
        )}
      </div>

      {/* User Avatar */}
      {isExpanded ? (
        <Link 
          to={settingsUrl}
          className="flex items-center gap-3 w-full px-3 py-2 mx-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
        >
          <Avatar className="h-9 w-9 ring-2 ring-primary/30 ring-offset-2 ring-offset-background flex-shrink-0">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-orange-500 to-pink-500 text-white text-xs font-medium">
              {getInitials(profile.full_name, user?.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium text-foreground truncate">
              {profile.full_name || user?.email?.split('@')[0]}
            </span>
            <span className="text-xs text-muted-foreground">{variant === 'admin' ? t.admin : t.member}</span>
          </div>
        </Link>
      ) : (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Link to={settingsUrl} className="px-2">
              <Avatar className="h-9 w-9 ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-pink-500 text-white text-xs font-medium">
                  {getInitials(profile.full_name, user?.email)}
                </AvatarFallback>
              </Avatar>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="border-border/50 bg-popover">
            {profile.full_name || user?.email || t.profile}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
