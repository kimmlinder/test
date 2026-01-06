import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { Menu, X, ArrowRight, ChevronDown, Shield, ShoppingCart, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthDialog } from '@/components/AuthDialog';
interface MenuItem {
  label: string;
  href: string;
  submenu?: { label: string; href: string }[];
}

const mainMenuItems: MenuItem[] = [
  { label: 'Home', href: '/' },
  { 
    label: 'Projects', 
    href: '/portfolio',
    submenu: [
      { label: 'Highlights', href: '/highlights' },
      { label: 'Portfolio', href: '/portfolio' },
      { label: 'Playground', href: '/playground' },
    ]
  },
  { label: 'Agency', href: '/about' },
  { label: 'Resources', href: '/resources' },
  { label: 'Blog', href: '/blog' },
  { label: 'Shop', href: '/shop' },
];

const memberMenuItems: MenuItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Dashboard', href: '/member' },
  { label: 'Shop', href: '/member/shop' },
  { label: 'Orders', href: '/member/orders' },
  { label: 'Wishlist', href: '/member/wishlist' },
  { label: 'Notifications', href: '/member/notifications' },
  { label: 'Settings', href: '/member/settings' },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { itemCount } = useCart();
  const [profile, setProfile] = useState<{ avatar_url: string | null; full_name: string | null } | null>(null);

  const menuItems = mainMenuItems;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Fetch user profile for avatar
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, full_name')
        .eq('id', user.id)
        .maybeSingle();
      setProfile(data);
    };
    fetchProfile();
  }, [user]);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };


  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setActiveDropdown(null);
  }, [location.pathname]);

  return (
    <>
      {/* Mobile Header - Fixed separately with higher z-index */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-[60] bg-background border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3 relative">
          {/* Mobile Menu Button - Left */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-muted rounded-full transition-colors"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Centered Logo */}
          <Link to="/" className="absolute left-1/2 transform -translate-x-1/2">
            <span className="font-display text-xl font-semibold tracking-tight">
              pixency
            </span>
          </Link>

          {/* Cart Icon - Right */}
          <Link to="/checkout" className="relative p-2 hover:bg-muted rounded-full transition-colors">
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-primary text-primary-foreground text-xs font-medium rounded-full">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500 hidden lg:block',
          scrolled ? 'bg-background/80 backdrop-blur-xl' : 'bg-transparent'
        )}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="flex items-center justify-between py-4 lg:py-6">
            {/* Logo */}
            <Link to="/" className="relative z-50">
              <span className="font-display text-2xl font-semibold tracking-tight">
                pixency
              </span>
            </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {menuItems.map((item) => (
                <li 
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => item.submenu && setActiveDropdown(item.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    to={item.href}
                    className={cn(
                      "font-body text-sm px-4 py-2 rounded-full transition-all duration-300 flex items-center gap-1",
                      location.pathname === item.href || 
                      (item.submenu && item.submenu.some(s => s.href === location.pathname))
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {item.label}
                    {item.submenu && <ChevronDown className="h-3 w-3" />}
                  </Link>
                  
                  {/* Dropdown */}
                  {item.submenu && (
                    <AnimatePresence>
                      {activeDropdown === item.label && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full left-0 pt-2"
                        >
                          <div className="bg-background/95 backdrop-blur-xl border border-border rounded-2xl p-2 min-w-[180px] shadow-xl">
                            {item.submenu.map((subItem) => (
                              <Link
                                key={subItem.label}
                                to={subItem.href}
                                className={cn(
                                  "block font-body text-sm px-4 py-2 rounded-xl transition-colors",
                                  location.pathname === subItem.href
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                              >
                                {subItem.label}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* CTA Button */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Cart Icon - Always visible */}
            <Link to="/checkout" className="relative p-2 hover:bg-muted rounded-full transition-colors">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-primary text-primary-foreground text-xs font-medium rounded-full">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>
            
            {user ? (
              <>
                <Link 
                  to={roleLoading ? "/member" : (isAdmin ? "/admin" : "/member")}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  title={isAdmin ? "Admin Dashboard" : "Member Dashboard"}
                >
                  <Avatar className="h-9 w-9 border-2 border-border">
                    <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'Profile'} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {getInitials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  {!roleLoading && isAdmin && (
                    <Shield className="h-4 w-4 text-primary" />
                  )}
                </Link>
                <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
                  <Link to={isAdmin ? "/admin/settings" : "/member/settings"} title="Settings">
                    <Settings className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="font-body" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="font-body" onClick={() => setAuthDialogOpen(true)}>
                  Login
                </Button>
                <Button size="sm" className="font-body rounded-full group" asChild>
                  <Link to="/contact">
                    <span>Let's Talk</span>
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </>
            )}
          </div>
          </div>
        </div>
      </header>
      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 top-0 bg-background z-40 lg:hidden overflow-y-auto"
          >
            {/* Close button at top right */}
            <div className="absolute top-4 right-4 z-50">
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex flex-col items-center justify-center min-h-screen gap-6 py-24">
              {menuItems.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <Link
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className="font-display text-3xl font-medium hover:text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                  {item.submenu && (
                    <div className="mt-3 space-y-2">
                      {item.submenu.map((subItem) => (
                        <Link
                          key={subItem.label}
                          to={subItem.href}
                          onClick={() => setIsOpen(false)}
                          className="block font-body text-lg text-muted-foreground hover:text-primary transition-colors"
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: menuItems.length * 0.1 }}
                className="flex flex-col items-center gap-4 mt-8"
              >
                {user ? (
                  <>
                    <Link
                      to={roleLoading ? "/member" : (isAdmin ? "/admin" : "/member")}
                      onClick={() => setIsOpen(false)}
                      className="flex flex-col items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                      <Avatar className="h-20 w-20 border-4 border-border">
                        <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'Profile'} />
                        <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                          {getInitials(profile?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-display text-xl font-medium flex items-center gap-2">
                        {!roleLoading && isAdmin && <Shield className="h-5 w-5" />}
                        {isAdmin ? 'Admin Dashboard' : 'My Dashboard'}
                      </span>
                    </Link>
                    <Link
                      to={isAdmin ? "/admin/settings" : "/member/settings"}
                      onClick={() => setIsOpen(false)}
                      className="font-display text-3xl font-medium hover:text-primary transition-colors flex items-center gap-2"
                    >
                      <Settings className="h-6 w-6" />
                      Settings
                    </Link>
                    <Button 
                      size="lg" 
                      variant="destructive"
                      className="font-body rounded-full mt-4" 
                      onClick={() => {
                        handleSignOut();
                        setIsOpen(false);
                      }}
                    >
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="lg" className="font-body" onClick={() => {
                      setIsOpen(false);
                      setAuthDialogOpen(true);
                    }}>
                      Login
                    </Button>
                    <Button size="lg" className="font-body rounded-full" asChild>
                      <Link to="/contact" onClick={() => setIsOpen(false)}>
                        Let's Talk
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </>
  );
}
