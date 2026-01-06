import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MemberLayout } from '@/components/member/MemberLayout';
import { ArrowLeft, Package, Clock, CheckCircle, Truck, MapPin, Copy, Eye, Send, MessageSquare, Download, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { generateSingleOrderPDF } from '@/utils/pdfExport';

interface Order {
  id: string;
  status: string;
  total_amount: number;
  shipping_address: string | null;
  tracking_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  preview_url: string | null;
}

interface OrderItem {
  id: string;
  quantity: number;
  price_at_purchase: number;
  product: {
    name: string;
    image_url: string;
    product_type: string;
  };
}

interface TimelineEvent {
  id: string;
  status: string;
  message: string | null;
  created_at: string;
}

interface Feedback {
  id: string;
  message: string;
  user_id: string;
  created_at: string;
}

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: Clock },
  { key: 'accepted', label: 'Accepted', icon: CheckCircle },
  { key: 'in_progress', label: 'Working On It', icon: Package },
  { key: 'preview_sent', label: 'Preview Sent', icon: Eye },
  { key: 'shipped', label: 'Order Sent', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: MapPin },
];

export default function MemberOrderDetail() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { notifyOrderStatusChange } = usePushNotifications();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [newFeedback, setNewFeedback] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && id) fetchOrderDetails();
  }, [user, id]);

  // Real-time subscription for order updates
  useEffect(() => {
    if (!user || !id) return;

    const ordersChannel = supabase
      .channel(`order-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        (payload) => {
          const newStatus = payload.new.status;
          setOrder(prev => prev ? { ...prev, ...payload.new } : null);
          toast({ title: "Order Updated", description: `Status changed to ${newStatus}` });
          notifyOrderStatusChange(id, newStatus);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_timeline', filter: `order_id=eq.${id}` },
        (payload) => {
          setTimeline(prev => [...prev, payload.new as TimelineEvent]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_feedback', filter: `order_id=eq.${id}` },
        (payload) => {
          setFeedback(prev => [...prev, payload.new as Feedback]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, [user, id, toast, notifyOrderStatusChange]);

  const fetchOrderDetails = async () => {
    if (!user || !id) return;

    const { data: orderData } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (orderData) {
      setOrder(orderData);
      
      const { data: itemsData } = await supabase
        .from('order_items')
        .select(`
          id,
          quantity,
          price_at_purchase,
          product:products (
            name,
            image_url,
            product_type
          )
        `)
        .eq('order_id', id);
      
      setItems((itemsData as unknown as OrderItem[]) || []);
      
      const { data: timelineData } = await supabase
        .from('order_timeline')
        .select('*')
        .eq('order_id', id)
        .order('created_at', { ascending: true });
      
      setTimeline(timelineData || []);

      // Fetch feedback
      const { data: feedbackData } = await supabase
        .from('order_feedback')
        .select('*')
        .eq('order_id', id)
        .order('created_at', { ascending: true });
      
      setFeedback(feedbackData || []);
    }
    
    setIsLoading(false);
  };

  const submitFeedback = async () => {
    if (!user || !id || !newFeedback.trim()) return;
    
    setSendingFeedback(true);
    try {
      const { error } = await supabase
        .from('order_feedback')
        .insert({
          order_id: id,
          user_id: user.id,
          message: newFeedback.trim(),
        });
      
      if (error) throw error;
      
      setNewFeedback('');
      toast({ title: "Feedback sent!", description: "We'll review your feedback and update the order accordingly." });
    } catch (error) {
      console.error('Error sending feedback:', error);
      toast({ title: "Error", description: "Failed to send feedback.", variant: "destructive" });
    } finally {
      setSendingFeedback(false);
    }
  };

  const copyTrackingNumber = () => {
    if (order?.tracking_number) {
      navigator.clipboard.writeText(order.tracking_number);
      toast({ title: "Tracking number copied!" });
    }
  };

  const handleExportPDF = () => {
    if (!order) return;
    const pdfItems = items.map(item => ({
      quantity: item.quantity,
      price_at_purchase: item.price_at_purchase,
      product: { name: item.product.name },
    }));
    generateSingleOrderPDF(order, pdfItems);
    toast({ title: "PDF downloaded!" });
  };

  const getCurrentStep = () => {
    const index = statusSteps.findIndex(s => s.key === order?.status);
    return index >= 0 ? index : 0;
  };

  if (loading || !user) {
    return (
      <MemberLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </MemberLayout>
    );
  }

  if (isLoading) {
    return (
      <MemberLayout>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-secondary rounded w-1/4" />
            <div className="h-64 bg-secondary rounded-3xl" />
          </div>
        </div>
      </MemberLayout>
    );
  }

  if (!order) {
    return (
      <MemberLayout>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 text-center py-20">
          <Package className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-display text-2xl mb-2">Order not found</h2>
          <Link to="/member/orders" className="text-primary hover:underline">
            Back to orders
          </Link>
        </div>
      </MemberLayout>
    );
  }

  const currentStep = getCurrentStep();

  return (
    <MemberLayout>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 space-y-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <Link
              to="/member/orders"
              className="p-2.5 hover:bg-secondary rounded-xl transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="font-display text-3xl lg:text-4xl font-medium">
                Order #{order.id.slice(0, 8)}
              </h1>
              <p className="text-muted-foreground font-body">
                Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          <Button variant="outline" className="gap-2 self-start" onClick={handleExportPDF}>
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </motion.div>

        {/* Status Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-3xl p-8 lg:p-10"
        >
          <h2 className="font-display text-2xl font-medium mb-8">Order Status</h2>
          
          {order.status === 'cancelled' ? (
            <div className="text-center py-8">
              <div className="bg-destructive/20 p-4 rounded-2xl inline-block mb-4">
                <Package className="h-8 w-8 text-destructive" />
              </div>
              <p className="font-display text-xl text-destructive">Order Cancelled</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute top-6 left-0 right-0 h-1 bg-secondary rounded-full hidden md:block">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${(currentStep / (statusSteps.length - 1)) * 100}%` }}
                />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {statusSteps.map((step, index) => {
                  const isCompleted = index <= currentStep;
                  const isCurrent = index === currentStep;
                  const StepIcon = step.icon;
                  
                  return (
                    <div
                      key={step.key}
                      className={cn(
                        "relative flex flex-col items-center text-center",
                        index > currentStep && "opacity-40"
                      )}
                    >
                      <div
                        className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all z-10",
                          isCompleted
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground",
                          isCurrent && "ring-4 ring-primary/30"
                        )}
                      >
                        <StepIcon className="h-5 w-5" />
                      </div>
                      <p className={cn(
                        "font-body text-sm",
                        isCurrent && "font-medium text-primary"
                      )}>
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {order.tracking_number && (
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground mb-2">Tracking Number</p>
              <div className="flex items-center gap-2">
                <code className="bg-secondary px-4 py-2 rounded-lg font-mono text-sm">
                  {order.tracking_number}
                </code>
                <Button variant="ghost" size="icon" onClick={copyTrackingNumber}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Items */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-3xl p-8"
          >
            <h2 className="font-display text-2xl font-medium mb-6">Order Items</h2>
            
            {items.length > 0 ? (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-secondary rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-medium truncate">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-display font-medium text-lg">
                      €{(item.price_at_purchase * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No items found</p>
            )}
            
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex justify-between text-xl">
                <span className="font-body font-medium">Total</span>
                <span className="font-display font-medium">€{order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </motion.div>

          {/* Timeline & Shipping */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-8"
          >
            {/* Activity Timeline */}
            <div className="bg-card border border-border rounded-3xl p-8">
              <h2 className="font-display text-2xl font-medium mb-6">Activity</h2>
              
              {timeline.length > 0 ? (
                <div className="space-y-4">
                  {timeline.map((event, index) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          index === timeline.length - 1 ? "bg-primary" : "bg-muted"
                        )} />
                        {index < timeline.length - 1 && (
                          <div className="w-px h-full bg-border" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="font-body text-sm capitalize font-medium">{event.status}</p>
                        {event.message && (
                          <p className="text-sm text-muted-foreground">{event.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(event.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No activity yet</p>
              )}
            </div>

            {/* Preview Feedback Section - Show when status is preview_sent */}
            {order.status === 'preview_sent' && (
              <div className="bg-card border border-primary/30 rounded-3xl p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-2xl font-medium">Preview</h2>
                </div>
                
                {/* Preview Image */}
                {order.preview_url && (
                  <div className="mb-6">
                    <div className="border border-border rounded-xl overflow-hidden bg-secondary">
                      {order.preview_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <img 
                          src={order.preview_url} 
                          alt="Order Preview" 
                          className="w-full max-h-96 object-contain"
                        />
                      ) : (
                        <div className="p-8 text-center">
                          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground mb-3">Preview file attached</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            asChild
                          >
                            <a href={order.preview_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View File
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                    {order.preview_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                      <div className="mt-3 text-center">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          asChild
                        >
                          <a href={order.preview_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open Full Size
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <h3 className="font-display text-lg font-medium">Feedback</h3>
                </div>
                <p className="text-muted-foreground text-sm mb-4">
                  We've sent you a preview! Let us know if you'd like any changes before we finalize your order.
                </p>
                
                {feedback.length > 0 && (
                  <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                    {feedback.map((fb) => (
                      <div 
                        key={fb.id} 
                        className={cn(
                          "p-3 rounded-xl text-sm",
                          fb.user_id === user.id ? "bg-primary/10 ml-8" : "bg-secondary mr-8"
                        )}
                      >
                        <p>{fb.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(fb.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Describe the changes you'd like..."
                    value={newFeedback}
                    onChange={(e) => setNewFeedback(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                <Button 
                  onClick={submitFeedback} 
                  disabled={sendingFeedback || !newFeedback.trim()}
                  className="mt-3 w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendingFeedback ? 'Sending...' : 'Send Feedback'}
                </Button>
              </div>
            )}

            {order.shipping_address && (
              <div className="bg-card border border-border rounded-3xl p-8">
                <h2 className="font-display text-2xl font-medium mb-4">Shipping Address</h2>
                <p className="text-muted-foreground font-body whitespace-pre-line">
                  {order.shipping_address}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </MemberLayout>
  );
}
