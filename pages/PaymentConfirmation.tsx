import { useSearchParams, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { CheckCircle2, ExternalLink, CreditCard, Mail, ArrowRight, Truck, Building2, Clock, Gift, Sparkles } from 'lucide-react';

export default function PaymentConfirmation() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order');
  const paymentMethod = searchParams.get('method') || 'pay_on_delivery';
  const amount = searchParams.get('amount') || '0';
  const isFreeOrder = parseFloat(amount) === 0;
  const orderRef = orderId?.replace(/-/g, '')?.slice(0, 8)?.toUpperCase() || '';
  
  // Default Revolut link for online payments
  const revolutLink = 'https://checkout.revolut.com/pay/f0f9a97b-2463-4d00-9ceb-fb1b9806a7e2';

  const renderPaymentContent = () => {
    // Free order - no payment required
    if (isFreeOrder) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-2xl p-6 md:p-8 mb-6 relative overflow-hidden"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-teal-400/20 to-transparent rounded-full blur-2xl" />
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Gift className="w-5 h-5 text-emerald-500" />
              </div>
              <h2 className="font-display text-xl font-medium">It's on Us!</h2>
            </div>
            
            <div className="bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-lg p-4 mb-4 border border-emerald-500/10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <p className="font-medium text-emerald-700 dark:text-emerald-400">No payment required!</p>
              </div>
              <p className="text-muted-foreground text-sm">
                This order is completely free. Your items are ready to be delivered to you at no cost.
              </p>
            </div>

            <div className="space-y-3 text-muted-foreground">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                Your order has been confirmed automatically
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                We'll notify you when your order is ready
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                Check your email for order details
              </p>
            </div>
          </div>
        </motion.div>
      );
    }

    switch (paymentMethod) {
      case 'pay_online':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="w-6 h-6 text-primary" />
              <h2 className="font-display text-xl font-medium">Complete Your Payment</h2>
            </div>
            
            <p className="text-muted-foreground mb-6">
              Click the button below to open the secure Revolut payment page. If a new tab didn't open automatically, 
              use this button to complete your payment.
            </p>
            
            <Button 
              size="lg" 
              className="w-full"
              onClick={() => window.open(revolutLink, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Pay €{parseFloat(amount).toFixed(2)} with Revolut
            </Button>
          </motion.div>
        );

      case 'bank_transfer':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="w-6 h-6 text-primary" />
              <h2 className="font-display text-xl font-medium">Bank Transfer</h2>
            </div>
            
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <p className="font-medium text-amber-700 dark:text-amber-400">Awaiting Order Acceptance</p>
              </div>
              <p className="text-muted-foreground text-sm">
                Your order is being reviewed. Once accepted, we'll send you an email with the bank transfer details and payment instructions.
              </p>
            </div>

            <div className="bg-primary/10 rounded-lg p-4 border border-primary/20 mb-6">
              <p className="text-sm font-medium text-muted-foreground mb-1">Order Reference</p>
              <span className="font-mono text-lg font-bold">{orderRef}</span>
            </div>

            <div className="space-y-3 text-muted-foreground">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                We're reviewing your order now
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                You'll receive bank details via email once accepted
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                Amount to pay: <span className="font-bold text-foreground">€{parseFloat(amount).toFixed(2)}</span>
              </p>
            </div>
          </motion.div>
        );

      case 'pay_on_delivery':
      default:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Truck className="w-6 h-6 text-primary" />
              <h2 className="font-display text-xl font-medium">Pay on Delivery</h2>
            </div>
            
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
              <p className="text-green-700 dark:text-green-400">
                <strong>No payment required now!</strong> You'll pay <span className="font-bold">€{parseFloat(amount).toFixed(2)}</span> in cash when your order arrives.
              </p>
            </div>

            <div className="space-y-3 text-muted-foreground">
              <p>✓ Your order has been confirmed and is being processed</p>
              <p>✓ We'll notify you when your order is shipped</p>
              <p>✓ Please have the exact amount ready upon delivery</p>
            </div>
          </motion.div>
        );
    }
  };

  const getTitle = () => {
    if (isFreeOrder) {
      return 'Order Complete!';
    }
    switch (paymentMethod) {
      case 'pay_online':
        return 'Complete Your Payment';
      case 'bank_transfer':
        return 'Order Placed - Bank Transfer Required';
      default:
        return 'Order Confirmed!';
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Extra decorations for free orders */}
      {isFreeOrder && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <motion.div 
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="absolute top-32 right-1/4 w-4 h-4 bg-emerald-400/40 rounded-full"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="absolute top-48 left-1/4 w-3 h-3 bg-teal-400/40 rounded-full"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="absolute bottom-40 right-1/3 w-5 h-5 bg-cyan-400/40 rounded-full"
          />
        </div>
      )}
      
      <Header />
      <main className="pt-32 pb-20 relative z-10">
        <div className="max-w-2xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
              isFreeOrder
                ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20'
                : paymentMethod === 'pay_on_delivery' 
                  ? 'bg-green-500/10' 
                  : 'bg-primary/10'
            }`}>
              {isFreeOrder ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                >
                  <Gift className="w-10 h-10 text-emerald-500" />
                </motion.div>
              ) : (
                <CheckCircle2 className={`w-10 h-10 ${
                  paymentMethod === 'pay_on_delivery' 
                    ? 'text-green-500' 
                    : 'text-primary'
                }`} />
              )}
            </div>
            
            <h1 className="font-display text-3xl md:text-4xl font-light tracking-tight mb-4">
              {getTitle()}
            </h1>
            
            {orderRef && (
              <p className="text-muted-foreground mb-2">
                Order Reference: <span className="font-mono font-bold text-foreground">{orderRef}</span>
              </p>
            )}
            
            <p className="text-muted-foreground mb-8">
              Thank you for your order!
            </p>
          </motion.div>

          {renderPaymentContent()}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-secondary/30 border border-border rounded-2xl p-6 mb-8"
          >
            <div className="flex items-center gap-3 mb-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-medium">Check Your Email</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              We've sent a confirmation email with your order details
              {paymentMethod === 'pay_online' && ' and a backup payment link'}
              {paymentMethod === 'bank_transfer' && ' and bank transfer details'}
              . If you don't see it, please check your spam folder.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/track-order">
              <Button>
                Track Your Order
              </Button>
            </Link>
            <Link to="/shop">
              <Button variant="outline">
                Continue Shopping
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="ghost">
                Need Help? <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
