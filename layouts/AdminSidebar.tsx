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
  Users, 
  Package, 
  ShoppingBag, 
  FolderOpen, 
  FileText, 
  Briefcase, 
  UsersRound, 
  Settings, 
  Home,
  Sparkles,
  CreditCard,
  Mail,
  LayoutGrid,
  LogOut,
  ExternalLink,
  User,
  Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

const menuSections = [
  {
    label: 'DASHBOARD',
    items: [
      { title: 'Overview', url: '/admin', icon: LayoutDashboard, badgeKey: null },
      { title: 'Page Update', url: '/admin/page-update', icon: Home, badgeKey: null },
    ]
  },
  {
    label: 'CONTENT',
    items: [
      { title: 'Users', url: '/admin/users', icon: Users, badgeKey: 'users' },
      { title: 'Newsletter', url: '/admin/newsletter', icon: Mail, badgeKey: 'subscribers' },
    ]
  },
  {
    label: 'SHOP',
    items: [
      { title: 'Orders', url: '/admin/orders', icon: ShoppingBag, badgeKey: 'pendingOrders' },
      { title: 'Subscriptions', url: '/admin/subscriptions', icon: Crown, badgeKey: 'pendingSubs' },
      { title: 'Payments', url: '/admin/payment-settings', icon: CreditCard, badgeKey: null },
    ]
  },
  {
    label: 'SETTINGS',
    items: [
      { title: 'Settings', url: '/admin/settings', icon: Settings, badgeKey: null },
    ]
  }
];

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
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
    try {
      const [ordersRes, productsRes, subscribersRes, subsRes] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('products').select('id', { count: 'exact', head: true }).lt('stock_quantity', 10).gt('stock_quantity', 0),
        supabase.from('newsletter_subscribers').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('user_subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      setBadges({
        pendingOrders: ordersRes.count || 0,
        lowStock: productsRes.count || 0,
        subscribers: subscribersRes.count || 0,
        pendingSubs: subsRes.count || 0,
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
            <Link to="/admin" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">A</span>
              </div>
              <div className="flex flex-col">
                <span className="font-display text-lg font-semibold text-sidebar-foreground">Admin</span>
                <span className="text-xs text-sidebar-foreground/60">v1.0</span>
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
              <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider px-2 mb-1">
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
                            <SidebarMenuBadge className="bg-primary text-primary-foreground text-xs">
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

        {/* Switch to Member Dashboard */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Member Dashboard">
                  <Link to="/member" className="text-primary hover:text-primary/80">
                    <User className="h-4 w-4" />
                    <span>Member Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* View Site Link */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="View Site">
                  <Link to="/" target="_blank" className="text-sidebar-foreground/60 hover:text-sidebar-foreground">
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
              <p className="text-xs text-primary">Admin</p>
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
