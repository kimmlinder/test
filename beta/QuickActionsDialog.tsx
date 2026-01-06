import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  Store,
  Package,
  Heart,
  Bell,
  Settings,
  Wand2,
  Film,
  Sparkles,
  Moon,
  Sun,
  LogOut,
  User,
  FlaskConical,
  Plus,
  Home,
  ShoppingBag,
  CreditCard,
  Mail,
  Crown,
  Users,
  Search,
  FileText,
  Keyboard
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useBetaAccess } from '@/hooks/useBetaAccess';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface QuickActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickActionsDialog({ open, onOpenChange }: QuickActionsDialogProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const { hasBetaAccess } = useBetaAccess();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [searchQuery, setSearchQuery] = useState('');
  const { results: searchResults, loading: searchLoading } = useGlobalSearch(searchQuery);

  // Determine if we're in admin or member area
  const isAdminArea = location.pathname.startsWith('/admin');

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for command palette
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
      // Cmd/Ctrl + N for new (context-aware)
      if (e.key === 'n' && (e.metaKey || e.ctrlKey) && !open) {
        e.preventDefault();
        if (location.pathname.includes('scene-plans')) {
          navigate('/member/scene-plans');
          toast.info('Create a new scene plan');
        } else if (location.pathname.includes('ai-creator')) {
          navigate('/member/ai-creator');
          toast.info('Start new AI creation');
        } else {
          onOpenChange(true);
        }
      }
      // Cmd/Ctrl + , for settings
      if (e.key === ',' && (e.metaKey || e.ctrlKey) && !open) {
        e.preventDefault();
        navigate(isAdminArea ? '/admin/settings' : '/member/settings');
      }
      // Cmd/Ctrl + Shift + L for logout
      if (e.key === 'l' && (e.metaKey || e.ctrlKey) && e.shiftKey && !open) {
        e.preventDefault();
        signOut();
        toast.success('Signed out successfully');
      }
      // Escape to go home
      if (e.key === 'Escape' && e.shiftKey && !open) {
        e.preventDefault();
        navigate(isAdminArea ? '/admin' : '/member');
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange, navigate, location.pathname, signOut, isAdminArea]);

  const runCommand = (command: () => void) => {
    onOpenChange(false);
    setSearchQuery('');
    command();
  };

  const memberNavigationItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/member' },
    { icon: Wand2, label: 'AI Creator', path: '/member/ai-creator' },
    { icon: Film, label: 'Scene Plans', path: '/member/scene-plans' },
    { icon: Sparkles, label: 'Features', path: '/member/features' },
    { icon: Store, label: 'Shop', path: '/member/shop' },
    { icon: Package, label: 'Orders', path: '/member/orders' },
    { icon: Heart, label: 'Wishlist', path: '/member/wishlist' },
    { icon: Bell, label: 'Notifications', path: '/member/notifications' },
    { icon: Settings, label: 'Settings', path: '/member/settings' },
    ...(hasBetaAccess ? [{ icon: FlaskConical, label: 'Beta Playground', path: '/member/beta-playground' }] : []),
  ];

  const adminNavigationItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Home, label: 'Page Update', path: '/admin/page-update' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: ShoppingBag, label: 'Orders', path: '/admin/orders' },
    { icon: CreditCard, label: 'Payments', path: '/admin/payment-settings' },
    { icon: Crown, label: 'Subscriptions', path: '/admin/subscriptions' },
    { icon: Mail, label: 'Newsletter', path: '/admin/newsletter' },
    { icon: FlaskConical, label: 'Beta Feedback', path: '/admin/beta-feedback' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  const navigationItems = isAdminArea ? adminNavigationItems : memberNavigationItems;

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
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

  return (
    <CommandDialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) setSearchQuery('');
    }}>
      <CommandInput 
        placeholder="Type a command or search..." 
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Search Results */}
        {searchQuery.length >= 2 && searchResults.length > 0 && (
          <>
            <CommandGroup heading="Search Results">
              {searchResults.map((result) => {
                const Icon = getResultIcon(result.type);
                return (
                  <CommandItem
                    key={`${result.type}-${result.id}`}
                    onSelect={() => runCommand(() => navigate(result.url))}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{result.title}</span>
                      {result.description && (
                        <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                          {result.description}
                        </span>
                      )}
                    </div>
                    <Badge variant="outline" className="ml-auto text-[10px]">
                      {result.type}
                    </Badge>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}
        
        <CommandGroup heading="Navigation">
          {navigationItems.map((item) => (
            <CommandItem
              key={item.path}
              onSelect={() => runCommand(() => navigate(item.path))}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          {!isAdminArea && (
            <>
              <CommandItem onSelect={() => runCommand(() => navigate('/member/scene-plans'))}>
                <Plus className="mr-2 h-4 w-4" />
                New Scene Plan
                <Badge variant="outline" className="ml-auto text-[10px]">⌘N</Badge>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate('/member/ai-creator'))}>
                <Wand2 className="mr-2 h-4 w-4" />
                New AI Creation
              </CommandItem>
            </>
          )}
          <CommandItem onSelect={() => runCommand(toggleTheme)}>
            {theme === 'dark' ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            Toggle Theme
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate(isAdminArea ? '/admin/settings' : '/member/settings'))}>
            <User className="mr-2 h-4 w-4" />
            Edit Profile
            <Badge variant="outline" className="ml-auto text-[10px]">⌘,</Badge>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Switch & Logout */}
        <CommandGroup heading="Account">
          {isAdmin && (
            <CommandItem onSelect={() => runCommand(() => navigate(isAdminArea ? '/member' : '/admin'))}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Switch to {isAdminArea ? 'Member' : 'Admin'} View
            </CommandItem>
          )}
          <CommandItem onSelect={() => runCommand(handleSignOut)} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
            <Badge variant="outline" className="ml-auto text-[10px]">⌘⇧L</Badge>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Keyboard Shortcuts">
          <CommandItem disabled className="opacity-60">
            <Keyboard className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground text-sm">
              <Badge variant="outline" className="mr-2 text-[10px]">⌘K</Badge>
              Command Palette
              <Badge variant="outline" className="mx-2 text-[10px]">⌘N</Badge>
              New Item
              <Badge variant="outline" className="mx-2 text-[10px]">⇧Esc</Badge>
              Go Home
            </span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}