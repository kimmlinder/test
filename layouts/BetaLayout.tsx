import React, { ReactNode, useState } from 'react';
import { BetaSidebar } from './BetaSidebar';
import { BetaHeader } from './BetaHeader';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MessageCircle } from 'lucide-react';
import { BetaChatbot } from '@/components/beta/BetaChatbot';
import { QuickActionsDialog } from '@/components/beta/QuickActionsDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { useBetaAccess } from '@/hooks/useBetaAccess';
import { BackgroundDecoration } from '@/components/BackgroundDecoration';

interface BetaLayoutProps {
  children: ReactNode;
  variant?: 'member' | 'admin';
}

export function BetaLayout({ children, variant = 'member' }: BetaLayoutProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const isMobile = useIsMobile();
  const { hasBetaAccess } = useBetaAccess();

  return (
    <div className="min-h-screen bg-background">
      {/* Global Quick Actions Dialog for Beta Users */}
      {hasBetaAccess && (
        <QuickActionsDialog open={quickActionsOpen} onOpenChange={setQuickActionsOpen} />
      )}

      {/* Icon-only Sidebar (expands on hover) - hidden on mobile */}
      {!isMobile && <BetaSidebar variant={variant} />}
      
      {/* Main Content Area */}
      <div className={isMobile ? '' : 'pl-14 transition-all duration-300'}>
        {/* Top Header */}
        <BetaHeader variant={variant} />
        
        {/* Content with dynamic background */}
        <main className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden">
          {/* Optimized Dynamic Background from context */}
          <BackgroundDecoration />
          
          {/* Content - Responsive padding with safe area support */}
          <div className="relative z-10 px-4 py-4 sm:p-4 md:p-6 lg:p-10 pb-safe">
            {children}
          </div>
        </main>
      </div>

      {/* Floating AI Chat Button - All Members */}
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button
            onClick={() => setIsChatOpen(true)}
            size="icon"
            className="fixed bottom-6 right-3 sm:right-4 md:right-6 z-40 h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-lg shadow-pink-500/30 transition-all hover:scale-105"
          >
            <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" className="border-border/50 bg-popover hidden sm:block">
          <p>AI Assistant</p>
        </TooltipContent>
      </Tooltip>

      {/* AI Chatbot Panel - All Members */}
      <BetaChatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
