import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

// Route mapping for breadcrumbs
const routeLabels: Record<string, string> = {
  // Admin routes
  '/admin': 'Dashboard',
  '/admin/homepage': 'Homepage Settings',
  '/admin/highlights': 'Highlights',
  '/admin/playground': 'Playground',
  '/admin/users': 'Users',
  '/admin/products': 'Products',
  '/admin/orders': 'Orders',
  '/admin/categories': 'Categories',
  '/admin/blog': 'Blog',
  '/admin/projects': 'Projects',
  '/admin/team': 'Team',
  '/admin/agency-settings': 'Agency Settings',
  '/admin/payment-settings': 'Payment Settings',
  '/admin/newsletter': 'Newsletter',
  '/admin/settings': 'Settings',
  // Member routes
  '/member': 'Dashboard',
  '/member/shop': 'Shop',
  '/member/orders': 'Orders',
  '/member/wishlist': 'Wishlist',
  '/member/notifications': 'Notifications',
  '/member/settings': 'Settings',
};

export function Breadcrumbs({ className }: { className?: string }) {
  const location = useLocation();
  const pathname = location.pathname;
  
  // Determine if admin or member
  const isAdmin = pathname.startsWith('/admin');
  const baseRoute = isAdmin ? '/admin' : '/member';
  const baseLabel = isAdmin ? 'Admin' : 'Member';
  
  // Build breadcrumb items
  const items: BreadcrumbItem[] = [
    { label: baseLabel, href: baseRoute },
  ];
  
  // If not on base route, add current page
  if (pathname !== baseRoute) {
    const currentLabel = routeLabels[pathname];
    if (currentLabel) {
      items.push({ label: currentLabel });
    } else {
      // Handle dynamic routes like /member/orders/:id
      const segments = pathname.split('/').filter(Boolean);
      if (segments.length >= 3) {
        const parentPath = `/${segments[0]}/${segments[1]}`;
        const parentLabel = routeLabels[parentPath];
        if (parentLabel) {
          items.push({ label: parentLabel, href: parentPath });
          items.push({ label: `#${segments[2].slice(0, 8)}...` });
        }
      }
    }
  }

  if (items.length <= 1 && pathname === baseRoute) {
    return null; // Don't show breadcrumbs on dashboard
  }

  return (
    <nav className={cn("flex items-center gap-1 text-sm text-muted-foreground mb-6", className)}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          {item.href ? (
            <Link 
              to={item.href} 
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              {index === 0 && <Home className="h-3.5 w-3.5" />}
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
