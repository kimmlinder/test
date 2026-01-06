import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { MemberLayout } from '@/components/member/MemberLayout';
import { Button } from '@/components/ui/button';
import { Package, ChevronRight, Clock, CheckCircle, Truck, MapPin, Eye, Download, Bell, BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateOrderHistoryPDF } from '@/utils/pdfExport';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  tracking_number: string | null;
}

export default function MemberOrders() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const { toast } = useToast();
  const { requestPermission, permission, isSupported } = usePushNotifications();

  const statusConfig: Record<string, { icon: typeof Package; color: string; bg: string; label: string }> = {
    pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/20', label: t.orderPlaced },
    accepted: { icon: CheckCircle, color: 'text-blue-500', bg: 'bg-blue-500/20', label: t.accepted },
    in_progress: { icon: Package, color: 'text-purple-500', bg: 'bg-purple-500/20', label: t.workingOnIt },
    preview_sent: { icon: Eye, color: 'text-orange-500', bg: 'bg-orange-500/20', label: t.previewSent },
    shipped: { icon: Truck, color: 'text-cyan-500', bg: 'bg-cyan-500/20', label: t.orderSent },
    delivered: { icon: MapPin, color: 'text-green-500', bg: 'bg-green-500/20', label: t.delivered },
    cancelled: { icon: Package, color: 'text-destructive', bg: 'bg-destructive/20', label: t.cancelled },
    confirmed: { icon: CheckCircle, color: 'text-blue-500', bg: 'bg-blue-500/20', label: t.confirmed },
    processing: { icon: Package, color: 'text-purple-500', bg: 'bg-purple-500/20', label: t.processing },
  };

  const filterLabels: Record<string, string> = {
    all: t.all,
    pending: t.pending,
    in_progress: t.inProgress,
    preview_sent: t.previewSent,
    shipped: t.shipped,
    delivered: t.delivered,
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    setOrders(data || []);
    setIsLoading(false);
  };

  const filters = ['all', 'pending', 'in_progress', 'preview_sent', 'shipped', 'delivered'];
  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter);

  const handleExportPDF = () => {
    if (orders.length === 0) {
      toast({ title: t.noOrdersToExport, variant: "destructive" });
      return;
    }
    generateOrderHistoryPDF(orders);
    toast({ title: t.pdfDownloaded, description: t.orderHistoryExported });
  };

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast({ title: t.notificationsEnabled, description: t.orderStatusUpdates });
    } else {
      toast({ title: t.notificationsBlocked, description: t.enableInBrowser, variant: "destructive" });
    }
  };

  if (loading || !user) {
    return (
      <MemberLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">{t.loading}</div>
        </div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 space-y-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-start md:justify-between gap-6"
        >
          <div>
            <h1 className="font-display text-5xl lg:text-6xl font-medium mb-4">{t.myOrders}</h1>
            <p className="text-muted-foreground font-body text-lg">
              {t.trackManageOrders}
            </p>
          </div>
          <div className="flex gap-3">
            {isSupported && permission !== 'granted' && (
              <Button variant="outline" className="gap-2" onClick={handleEnableNotifications}>
                <Bell className="h-4 w-4" />
                {t.enableNotifications}
              </Button>
            )}
            {isSupported && permission === 'granted' && (
              <Button variant="ghost" className="gap-2" disabled>
                <BellOff className="h-4 w-4" />
                {t.notificationsOn}
              </Button>
            )}
            <Button variant="outline" className="gap-2" onClick={handleExportPDF} disabled={orders.length === 0}>
              <Download className="h-4 w-4" />
              {t.exportPdf}
            </Button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 overflow-x-auto pb-2"
        >
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-5 py-2.5 rounded-full font-body text-sm whitespace-nowrap transition-all capitalize",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {filterLabels[f] || f}
            </button>
          ))}
        </motion.div>

        {/* Orders List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-secondary rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-secondary rounded w-1/4" />
                    <div className="h-4 bg-secondary rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => {
              const status = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={`/member/orders/${order.id}`}
                    className="block bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-4 rounded-xl", status.bg)}>
                          <StatusIcon className={cn("h-6 w-6", status.color)} />
                        </div>
                        
                        <div>
                          <p className="font-body text-sm text-muted-foreground mb-1">
                            {t.orderNumber} #{order.id.slice(0, 8)}
                          </p>
                          <p className="font-display text-xl font-medium">
                            €{order.total_amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(order.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                          <span className={cn(
                            "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium",
                            status.bg, status.color
                          )}>
                            <StatusIcon className="h-4 w-4" />
                            {status.label}
                          </span>
                          {order.tracking_number && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {t.tracking}: {order.tracking_number}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                    
                    <div className="md:hidden mt-4 pt-4 border-t border-border">
                      <span className={cn(
                        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium",
                        status.bg, status.color
                      )}>
                        <StatusIcon className="h-4 w-4" />
                        {status.label}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Package className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-display text-2xl font-medium mb-2">{t.noOrdersFound}</h3>
            <p className="text-muted-foreground font-body mb-6">
              {filter === 'all' 
                ? t.noOrdersYet 
                : `${t.noFilteredOrders} ${filterLabels[filter] || filter}`}
            </p>
            <Link
              to="/member/shop"
              className="inline-flex items-center gap-2 text-primary hover:underline font-body"
            >
              {t.startShopping} <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>
        )}
      </div>
    </MemberLayout>
  );
}
