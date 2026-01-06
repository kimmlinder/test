import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Heart, 
  Bell, 
  Settings,
  LogOut,
  ExternalLink,
  Store,
  Shield,
  Wand2,
  Sparkles,
  Clapperboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useUserRole } from '@/hooks/useUserRole';

// Grouped menu items
const menuSections = [
  {
    label: 'PERSONAL',
    items: [
      { title: 'Dashboard', url: '/member', icon: LayoutDashboard, badgeKey: null },
      { title: 'AI Creator', url: '/member/ai-creator', icon: Wand2, badgeKey: null },
      { title: 'Scene Plans', url: '/member/scene-plans', icon: Clapperboard, badgeKey: null },
      { title: 'Features', url: '/member/features', icon: Sparkles, badgeKey: null },
    ]
  },
  {
    label: 'SHOP',
    items: [
      { title: 'Shop', url: '/member/shop', icon: Store, badgeKey: null },
      { title: 'Orders', url: '/member/orders', icon: Package, badgeKey: 'activeOrders' },
      { title: 'Wishlist', url: '/member/wishlist', icon: Heart, badgeKey: 'wishlist' },
    ]
  },
  {
    label: 'ACCOUNT',
    items: [
      { title: 'Notifications', url: '/member/notifications', icon: Bell, badgeKey: 'notifications' },
      { title: 'Settings', url: '/member/settings', icon: Settings, badgeKey: null },
    ]
  },
];

export function MemberSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const { isAdmin } = useUserRole();
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null }>({ full_name: null, avatar_url: null });
  const [badges, setBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchBadges();
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

  const fetchBadges = async () => {
    if (!user) return;
    try {
      const activeStatuses = ['pending', 'accepted', 'in_progress', 'preview_sent', 'confirmed', 'processing', 'shipped'] as const;
      
      const [ordersRes, wishlistRes, notificationsRes] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', user.id).in('status', [...activeStatuses]),
        supabase.from('wishlist').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('read', false),
      ]);

      setBadges({
        activeOrders: ordersRes.count || 0,
        wishlist: wishlistRes.count || 0,
        notifications: notificationsRes.count || 0,
      });
    } catch (error) {
      console.error('Error fetching badges:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const getInitials = (name: string | null, email: string | undefined) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    if (email) return email[0].toUpperCase();
    return 'U';
  };

  const getBadgeCount = (badgeKey: string | null) => {
    if (!badgeKey) return 0;
    return badges[badgeKey] || 0;
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className={cn(
          "flex items-center",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          {!isCollapsed && (
            <Link to="/member" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <ShoppingBag className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-display text-lg font-semibold text-sidebar-foreground">Member</span>
                <span className="text-xs text-sidebar-foreground/60">Portal</span>
              </div>
            </Link>
          )}
          <SidebarTrigger className="text-sidebar-foreground/60 hover:text-sidebar-foreground" />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {menuSections.map((section) => (
          <SidebarGroup key={section.label}>
            {!isCollapsed && (
              <SidebarGroupLabel className="text-[11px] font-semibold tracking-wider text-sidebar-foreground/40 uppercase px-3 py-2">
                {section.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive = location.pathname === item.url;
                  const badgeCount = getBadgeCount(item.badgeKey);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className={cn(
                          "transition-colors",
                          isActive && "bg-primary/10 text-primary"
                        )}
                      >
                        <Link to={item.url}>
                          <item.icon className={cn("h-4 w-4", isActive && "text-primary")} />
                          <span>{item.title}</span>
                          {badgeCount > 0 && !isCollapsed && (
                            <SidebarMenuBadge className={cn(
                              "text-xs",
                              item.badgeKey === 'notifications' 
                                ? "bg-destructive text-destructive-foreground" 
                                : "bg-primary text-primary-foreground"
                            )}>
                              {badgeCount}
                            </SidebarMenuBadge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Admin Dashboard Link (for admins only) */}
        {isAdmin && (
          <SidebarGroup>
            {!isCollapsed && (
              <SidebarGroupLabel className="text-[11px] font-semibold tracking-wider text-sidebar-foreground/40 uppercase px-3 py-2">
                ADMIN
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Admin Dashboard">
                    <Link to="/admin" className="text-primary hover:text-primary/80">
                      <Shield className="h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* View Site Link */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="View Site">
                  <Link to="/" className="text-sidebar-foreground/60 hover:text-sidebar-foreground">
                    <ExternalLink className="h-4 w-4" />
                    <span>View Site</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-xl bg-sidebar-accent/50",
          isCollapsed && "justify-center p-2"
        )}>
          <Avatar className="h-10 w-10 border-2 border-primary/30">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground font-medium">
              {getInitials(profile.full_name, user?.email)}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile.full_name || user?.email?.split('@')[0]}
              </p>
              <p className="text-xs text-primary">Member</p>
            </div>
          )}
        </div>
        
        {!isCollapsed && (
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full p-2 mt-2 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm">Sign Out</span>
          </button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
