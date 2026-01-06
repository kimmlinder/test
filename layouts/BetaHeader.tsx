import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Home,
  ChevronRight,
  Search,
  Bell,
  Settings,
  LayoutDashboard,
  Users,
  Package,
  ShoppingBag,
  Crown,
  Sparkles,
  Wand2,
  Store,
  Heart,
  Menu,
  TrendingUp,
  Film,
  CreditCard,
  Mail,
  ArrowLeftRight,
  LogOut,
  X,
  FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserRole } from '@/hooks/useUserRole';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BetaHeaderProps {
  variant?: 'member' | 'admin';
}

export function BetaHeader({ variant = 'member' }: BetaHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const { isAdmin } = useUserRole();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null }>({ 
    full_name: null, 
    avatar_url: null 
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { results: searchResults, loading: searchLoading } = useGlobalSearch(searchQuery);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUnreadCount();
    }
  }, [user]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle();
    if (data) setProfile(data);
  };

  const fetchUnreadCount = async () => {
    if (!user) return;
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);
    setUnreadCount(count || 0);
  };

  const getInitials = (name: string | null, email: string | undefined) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    if (email) return email[0].toUpperCase();
    return 'U';
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

  const handleSearchResultClick = (url: string) => {
    setSearchQuery('');
    setShowSearchResults(false);
    navigate(url);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'product': return Store;
      case 'order': return Package;
      case 'project': return FileText;
      case 'blog': return FileText;
      case 'scene_plan': return Film;
      default: return Search;
    }
  };

  const memberRouteNames: Record<string, { name: string; icon: typeof Home }> = {
    '/member': { name: t.home, icon: Home },
    '/member/ai-creator': { name: t.aiCreator, icon: Wand2 },
    '/member/scene-plans': { name: t.scenePlans, icon: Film },
    '/member/features': { name: t.features, icon: Sparkles },
    '/member/shop': { name: t.shop, icon: Store },
    '/member/orders': { name: t.orders, icon: Package },
    '/member/wishlist': { name: t.wishlist, icon: Heart },
    '/member/notifications': { name: t.notifications, icon: Bell },
    '/member/settings': { name: t.settings, icon: Settings },
  };

  const adminRouteNames: Record<string, { name: string; icon: typeof Home }> = {
    '/admin': { name: t.dashboard, icon: LayoutDashboard },
    '/admin/page-update': { name: 'Page Update', icon: Home },
    '/admin/users': { name: 'Users', icon: Users },
    '/admin/orders': { name: t.orders, icon: ShoppingBag },
    '/admin/payment-settings': { name: 'Payments', icon: CreditCard },
    '/admin/subscriptions': { name: 'Subscriptions', icon: Crown },
    '/admin/newsletter': { name: 'Newsletter', icon: Mail },
    '/admin/settings': { name: t.settings, icon: Settings },
  };

  const memberMenuItems = [
    { title: t.dashboard, url: '/member', icon: TrendingUp },
    { title: t.aiCreator, url: '/member/ai-creator', icon: Wand2 },
    { title: t.scenePlans, url: '/member/scene-plans', icon: Film },
    { title: t.features, url: '/member/features', icon: Sparkles },
    { title: t.shop, url: '/member/shop', icon: Store },
    { title: t.orders, url: '/member/orders', icon: Package },
    { title: t.wishlist, url: '/member/wishlist', icon: Heart },
    { title: t.notifications, url: '/member/notifications', icon: Bell },
    { title: t.settings, url: '/member/settings', icon: Settings },
  ];

  const adminMenuItems = [
    { title: t.dashboard, url: '/admin', icon: LayoutDashboard },
    { title: 'Page Update', url: '/admin/page-update', icon: Home },
    { title: 'Users', url: '/admin/users', icon: Users },
    { title: t.orders, url: '/admin/orders', icon: ShoppingBag },
    { title: 'Payments', url: '/admin/payment-settings', icon: CreditCard },
    { title: 'Subscriptions', url: '/admin/subscriptions', icon: Crown },
    { title: 'Newsletter', url: '/admin/newsletter', icon: Mail },
    { title: t.settings, url: '/admin/settings', icon: Settings },
  ];

  const routeNames = variant === 'admin' ? adminRouteNames : memberRouteNames;
  const menuItems = variant === 'admin' ? adminMenuItems : memberMenuItems;
  const homeUrl = variant === 'admin' ? '/admin' : '/member';
  const settingsUrl = variant === 'admin' ? '/admin/settings' : '/member/settings';
  const notificationsUrl = '/member/notifications';
  const switchUrl = variant === 'admin' ? '/member' : '/admin';
  const switchLabel = variant === 'admin' ? t.memberView : t.adminView;
  
  const currentRoute = routeNames[location.pathname];
  const currentRouteName = currentRoute?.name || 'Page';
  const CurrentIcon = currentRoute?.icon || Settings;
  const isHome = location.pathname === homeUrl;

  // Mobile: Centered logo header like reference
  if (isMobile) {
    return (
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between bg-background px-4">
        {/* Left: Menu Button */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <div className="flex flex-col h-full">
              {/* Logo */}
              <div className="p-4 border-b border-border">
                <Link 
                  to={homeUrl} 
                  className="flex items-center gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 shadow-lg shadow-orange-500/20">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-display text-lg font-semibold text-foreground">
                      {variant === 'admin' ? t.admin : t.member}
                    </span>
                    <span className="text-xs text-muted-foreground">{t.portal}</span>
                  </div>
                </Link>
              </div>

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <Link
                      key={item.url}
                      to={item.url}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex h-11 w-full items-center gap-3 rounded-xl px-3 transition-all duration-200",
                        isActive 
                          ? "bg-primary/10 text-primary" 
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Admin/Member Switch */}
              {isAdmin && (
                <div className="p-3 border-t border-border">
                  <Link
                    to={switchUrl}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex h-11 w-full items-center gap-3 rounded-xl px-3 transition-all duration-200 bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-400 hover:from-purple-500/20 hover:to-pink-500/20"
                  >
                    <ArrowLeftRight className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{switchLabel}</span>
                  </Link>
                </div>
              )}

              {/* Logout Button */}
              <div className="p-3 border-t border-border">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="flex h-11 w-full items-center gap-3 rounded-xl px-3 transition-all duration-200 text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              </div>

              {/* User */}
              <div className="p-3 border-t border-border">
                <Link 
                  to={settingsUrl}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 w-full p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
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
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Center: Logo */}
        <Link to={homeUrl} className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-lg font-semibold text-foreground">
            {variant === 'admin' ? t.admin : t.portal}
          </span>
        </Link>

        {/* Right: Notifications */}
        <Link to={notificationsUrl} className="relative">
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <Bell className="h-5 w-5" />
          </Button>
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 text-[10px] font-bold"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Link>
      </header>
    );
  }

  // Desktop: Original layout with breadcrumbs
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/30 bg-background/60 backdrop-blur-xl px-4 sm:px-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        <Link 
          to={homeUrl} 
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Home className="h-4 w-4" />
          <span>{t.home}</span>
        </Link>
        {!isHome && (
          <>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            <span className="flex items-center gap-1.5 text-foreground font-medium">
              <CurrentIcon className="h-4 w-4" />
              <span>{currentRouteName}</span>
            </span>
          </>
        )}
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Search - Hidden on mobile */}
        <div className="relative hidden md:block" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder={`${t.search}...`}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            className="w-80 h-9 pl-9 pr-8 bg-muted/50 border-border/50 focus-visible:ring-primary/30"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowSearchResults(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          {/* Search Results Dropdown */}
          {showSearchResults && searchQuery.length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
              {searchLoading ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  Searching...
                </div>
              ) : searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((result) => {
                    const Icon = getResultIcon(result.type);
                    return (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleSearchResultClick(result.url)}
                        className="w-full px-4 py-2 flex items-center gap-3 hover:bg-muted transition-colors text-left"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{result.title}</div>
                          {result.description && (
                            <div className="text-xs text-muted-foreground truncate">{result.description}</div>
                          )}
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {result.type}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No results found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        <Link to={notificationsUrl} className="relative">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
            <Bell className="h-5 w-5" />
          </Button>
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 text-[10px] font-bold"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Link>

        {/* Logout Button - Desktop */}
        {!isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleSignOut}
            className="h-9 w-9 text-muted-foreground hover:text-destructive"
            title="Sign Out"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        )}

        {/* User Avatar - Hidden on mobile since it's in the sidebar */}
        {!isMobile && (
          <Link to={settingsUrl}>
            <Avatar className="h-8 w-8 ring-2 ring-primary/20 ring-offset-1 ring-offset-background">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-pink-500 text-white text-xs font-medium">
                {getInitials(profile.full_name, user?.email)}
              </AvatarFallback>
            </Avatar>
          </Link>
        )}
      </div>
    </header>
  );
}
