import { ReactNode } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { BackgroundDecoration } from '@/components/BackgroundDecoration';

interface DashboardLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  className?: string;
}

export function DashboardLayout({ children, sidebar, className }: DashboardLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background relative">
        {/* Optimized Dynamic Background */}
        <BackgroundDecoration />
        
        {sidebar}
        <SidebarInset className={cn("flex-1 relative z-10", className)}>
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-sm px-6 md:hidden">
            <SidebarTrigger className="-ml-2" />
          </header>
          <main className="flex-1">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
