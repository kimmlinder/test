import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Crown, Sparkles, Check, Infinity, Zap, Star, ExternalLink, Loader2, Clock, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSubscription } from '@/hooks/useSubscription';

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const plans = [
  {
    name: 'Free',
    price: '€0',
    period: '/month',
    description: 'Get started with basic features',
    features: [
      '10 AI Media Creations/month',
      '5 Mockup Generations/month',
      '3 Custom Orders/month',
      '10 Brand Assets',
      'Email Support',
    ],
    current: true,
  },
  {
    name: 'Premium',
    price: '€29',
    period: '/month',
    description: 'Unlock unlimited creative power',
    features: [
      'Unlimited AI Media Creations',
      'Unlimited Mockup Generations',
      'Unlimited Custom Orders',
      'Unlimited Brand Assets',
      'Priority Support',
      '24-hour Response Guarantee',
      'Dedicated Account Manager',
      'Early Access to New Features',
    ],
    popular: true,
  },
];

export function UpgradeDialog({ open, onOpenChange }: UpgradeDialogProps) {
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { subscription, isPremium, hasPendingPayment, createPendingSubscription, refetch } = useSubscription();

  useEffect(() => {
    if (open) {
      fetchPaymentLink();
      refetch();
    }
  }, [open, refetch]);

  const fetchPaymentLink = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_settings')
        .select('premium_payment_link, default_revolut_link')
        .single();
      
      if (error) throw error;
      // Use premium link if set, otherwise fall back to default Revolut link
      setPaymentLink(data?.premium_payment_link || data?.default_revolut_link || null);
    } catch (error) {
      console.error('Error fetching payment link:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async () => {
    // Create pending subscription before redirecting
    const { error } = await createPendingSubscription();
    if (error) {
      toast.error('Failed to initiate upgrade. Please try again.');
      return;
    }

    if (paymentLink) {
      toast.success('Opening payment page. Complete your payment to activate Premium!');
      window.open(paymentLink, '_blank', 'noopener,noreferrer');
    } else {
      // Fallback payment link
      toast.success('Opening payment page. Complete your payment to activate Premium!');
      window.open('https://checkout.revolut.com/pay/f0f9a97b-2463-4d00-9ceb-fb1b9806a7e2', '_blank', 'noopener,noreferrer');
    }
    onOpenChange(false);
  };

  // Determine current plan based on subscription
  const userIsFree = !isPremium;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center space-y-4 pb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center"
          >
            <Crown className="w-8 h-8 text-amber-500" />
          </motion.div>
          <DialogTitle className="text-2xl font-display">
            {isPremium ? 'You\'re Premium!' : 'Upgrade Your Plan'}
          </DialogTitle>
          <DialogDescription className="text-center max-w-md mx-auto">
            {isPremium 
              ? 'Thank you for being a Premium member. Enjoy unlimited access to all features!'
              : hasPendingPayment
                ? 'Your payment is being verified. We\'ll activate your account once confirmed.'
                : 'Get unlimited access to all features and take your creative projects to the next level.'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Pending Payment Banner */}
        {hasPendingPayment && !isPremium && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="font-medium text-amber-500">Payment Pending Verification</p>
              <p className="text-sm text-muted-foreground">
                We're verifying your payment. This usually takes a few hours.
              </p>
            </div>
          </motion.div>
        )}

        {/* Premium Active Banner */}
        {isPremium && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-primary">Premium Active</p>
              <p className="text-sm text-muted-foreground">
                {subscription?.started_at 
                  ? `Active since ${new Date(subscription.started_at).toLocaleDateString()}`
                  : 'Enjoy unlimited access to all features!'
                }
              </p>
            </div>
          </motion.div>
        )}

        <div className="grid md:grid-cols-2 gap-4 py-4">
          {plans.map((plan, index) => {
            const isCurrent = (plan.name === 'Free' && userIsFree) || (plan.name === 'Premium' && isPremium);
            
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={cn(
                  "p-6 h-full relative",
                  plan.popular 
                    ? "border-amber-500/50 bg-gradient-to-br from-amber-500/5 to-transparent" 
                    : "border-border/50"
                )}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-amber-500 text-black text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <h3 className={cn(
                      "font-display text-xl font-medium mb-1",
                      plan.popular && "text-amber-500"
                    )}>
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-display font-bold">{plan.price}</span>
                      <span className="text-muted-foreground text-sm">{plan.period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <div className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                          plan.popular ? "bg-amber-500/10" : "bg-primary/10"
                        )}>
                          {feature.includes('Unlimited') ? (
                            <Infinity className={cn("w-3 h-3", plan.popular ? "text-amber-500" : "text-primary")} />
                          ) : (
                            <Check className={cn("w-3 h-3", plan.popular ? "text-amber-500" : "text-primary")} />
                          )}
                        </div>
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      {isPremium && plan.name === 'Premium' ? 'Current Plan' : 'Current Plan'}
                    </Button>
                  ) : plan.name === 'Premium' ? (
                    hasPendingPayment ? (
                      <Button 
                        className="w-full bg-amber-500/50 text-black gap-2"
                        disabled
                      >
                        <Clock className="w-4 h-4" />
                        Pending Verification
                      </Button>
                    ) : (
                      <Button 
                        className="w-full bg-amber-500 hover:bg-amber-600 text-black gap-2"
                        onClick={handleUpgrade}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Zap className="w-4 h-4" />
                            Upgrade Now
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </>
                        )}
                      </Button>
                    )
                  ) : (
                    <Button variant="outline" className="w-full" disabled>
                      Free Plan
                    </Button>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-border/50 space-y-3">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Cancel anytime. No questions asked.</span>
          </div>
          {!paymentLink && !isLoading && !isPremium && (
            <p className="text-xs text-center text-muted-foreground">
              Payment is currently being set up. Please contact support if you'd like to upgrade.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
