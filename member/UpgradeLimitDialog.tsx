import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, Check, Infinity } from 'lucide-react';
import { motion } from 'framer-motion';
import { UpgradeDialog } from './UpgradeDialog';

interface UpgradeLimitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName: string;
  currentUsage: number;
  limit: number;
}

const premiumBenefits = [
  'Unlimited AI Media Creations',
  'Unlimited Mockup Generations',
  'Unlimited Custom Orders',
  'Unlimited Brand Assets',
  'Priority Support',
  '24-hour Response Guarantee',
];

export function UpgradeLimitDialog({ 
  open, 
  onOpenChange, 
  featureName, 
  currentUsage, 
  limit 
}: UpgradeLimitDialogProps) {
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const handleUpgradeClick = () => {
    onOpenChange(false);
    setShowUpgradeDialog(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center"
            >
              <Crown className="w-8 h-8 text-amber-500" />
            </motion.div>
            <DialogTitle className="text-xl font-display">
              Monthly Limit Reached
            </DialogTitle>
            <DialogDescription className="text-center">
              You've used <span className="font-semibold text-foreground">{currentUsage}</span> of{' '}
              <span className="font-semibold text-foreground">{limit}</span> {featureName} this month.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span className="font-medium text-amber-500">Upgrade to Premium</span>
              </div>
              <ul className="space-y-2">
                {premiumBenefits.map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {benefit.includes('Unlimited') ? (
                        <Infinity className="w-3 h-3 text-primary" />
                      ) : (
                        <Check className="w-3 h-3 text-primary" />
                      )}
                    </div>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button 
              className="w-full bg-amber-500 hover:bg-amber-600 text-black gap-2"
              onClick={handleUpgradeClick}
            >
              <Crown className="w-4 h-4" />
              Upgrade to Premium
            </Button>
            <Button 
              variant="ghost" 
              className="w-full" 
              onClick={() => onOpenChange(false)}
            >
              Maybe Later
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <UpgradeDialog 
        open={showUpgradeDialog} 
        onOpenChange={setShowUpgradeDialog} 
      />
    </>
  );
}
