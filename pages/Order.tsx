import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  Package, 
  CheckCircle2, 
  Clock, 
  Truck, 
  AlertCircle,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

type OrderStatus = 
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'preview_sent'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

interface OrderData {
  id: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  customer_name: string | null;
  shipping_address: string | null;
  tracking_number: string | null;
}

interface TimelineEntry {
  id: string;
  status: OrderStatus;
  message: string | null;
  created_at: string;
}

const statusConfig: Record<OrderStatus, { label: string; icon: React.ReactNode; color: string }> = {
  pending: { label: 'Pending', icon: <Clock className="w-5 h-5" />, color: 'text-yellow-500' },
  accepted: { label: 'Accepted', icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-blue-500' },
  in_progress: { label: 'In Progress', icon: <Package className="w-5 h-5" />, color: 'text-blue-500' },
  preview_sent: { label: 'Preview Sent', icon: <Package className="w-5 h-5" />, color: 'text-purple-500' },
  confirmed: { label: 'Confirmed', icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-green-500' },
  processing: { label: 'Processing', icon: <Package className="w-5 h-5" />, color: 'text-blue-500' },
  shipped: { label: 'Shipped', icon: <Truck className="w-5 h-5" />, color: 'text-indigo-500' },
  delivered: { label: 'Delivered', icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-green-500' },
  cancelled: { label: 'Cancelled', icon: <AlertCircle className="w-5 h-5" />, color: 'text-red-500' },
};

export default function TrackOrder() {
  const [searchParams] = useSearchParams();
  const [orderRef, setOrderRef] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [searched, setSearched] = useState(false);

  // Auto-fill from URL parameters
  useEffect(() => {
    const refParam = searchParams.get('ref');
    const emailParam = searchParams.get('email');
    
    if (refParam) {
      setOrderRef(refParam.toUpperCase().replace(/[^A-Z0-9]/g, ''));
    }
    if (emailParam) {
      setEmail(emailParam);
    }
    
    // Auto-search if both params are present
    if (refParam && emailParam) {
      handleAutoSearch(refParam, emailParam);
    }
  }, [searchParams]);

  const handleAutoSearch = async (ref: string, emailAddr: string) => {
    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('track-order', {
        body: {
          order_reference: ref.trim().toUpperCase().replace(/[^A-Z0-9]/g, ''),
          email: emailAddr.trim().toLowerCase(),
        },
      });

      if (fnError) throw fnError;

      if (!data.success) {
        setError(data.error || 'Order not found');
        return;
      }

      setOrder(data.order);
      setTimeline(data.timeline || []);
    } catch (err) {
      console.error('Error tracking order:', err);
      setError('Unable to find your order. Please check your order reference and email.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOrder(null);
    setTimeline([]);
    setSearched(true);

    try {
      // Call edge function to look up order
      const { data, error: fnError } = await supabase.functions.invoke('track-order', {
        body: {
          order_reference: orderRef.trim().toUpperCase(),
          email: email.trim().toLowerCase(),
        },
      });

      if (fnError) throw fnError;

      if (!data.success) {
        setError(data.error || 'Order not found');
        return;
      }

      setOrder(data.order);
      setTimeline(data.timeline || []);
    } catch (err) {
      console.error('Error tracking order:', err);
      setError('Unable to find your order. Please check your order reference and email.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-20">
        <div className="max-w-2xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-light tracking-tight mb-4">
              Track Your Order
            </h1>
            <p className="text-muted-foreground">
              Enter your order reference and email to check your order status
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSearch}
            className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-8"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orderRef">Order Reference</Label>
                <Input
                  id="orderRef"
                  value={orderRef}
                  onChange={(e) => setOrderRef(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder="e.g., C4FE26A7"
                  className="font-mono text-lg tracking-wider"
                  maxLength={8}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  The reference from your confirmation email (e.g., C4FE26A7)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Track Order
                  </>
                )}
              </Button>
            </div>
          </motion.form>

          {error && searched && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center"
            >
              <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
              <p className="text-destructive font-medium">{error}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Make sure you're using the email address you placed the order with.
              </p>
            </motion.div>
          )}

          {order && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Order Summary */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-medium">Order Status</h2>
                  <span className={`flex items-center gap-2 ${statusConfig[order.status].color}`}>
                    {statusConfig[order.status].icon}
                    <span className="font-medium">{statusConfig[order.status].label}</span>
                  </span>
                </div>

                <div className="grid gap-4 text-sm">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Order Reference</span>
                    <span className="font-mono font-bold">{order.id.replace(/-/g, '').slice(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Order Date</span>
                    <span>{formatDate(order.created_at)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Total Amount</span>
                    <span className="font-bold text-primary">€{Number(order.total_amount).toFixed(2)}</span>
                  </div>
                  {order.tracking_number && (
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Tracking Number</span>
                      <span className="font-mono">{order.tracking_number}</span>
                    </div>
                  )}
                  {order.shipping_address && (
                    <div className="py-2">
                      <span className="text-muted-foreground block mb-1">Shipping Address</span>
                      <span className="text-sm">{order.shipping_address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              {timeline.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h2 className="font-display text-xl font-medium mb-6">Order Timeline</h2>
                  <div className="space-y-4">
                    {timeline.map((entry, index) => (
                      <div key={entry.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            index === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                          }`}>
                            {statusConfig[entry.status]?.icon || <Clock className="w-5 h-5" />}
                          </div>
                          {index < timeline.length - 1 && (
                            <div className="w-0.5 h-full bg-border mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-medium">{statusConfig[entry.status]?.label || entry.status}</p>
                          {entry.message && (
                            <p className="text-sm text-muted-foreground">{entry.message}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(entry.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-center">
                <Link to="/contact">
                  <Button variant="ghost">
                    Need Help? Contact Us <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
