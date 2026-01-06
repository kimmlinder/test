import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { 
  ShoppingBag, 
  UserPlus, 
  Package, 
  Bell,
  TrendingUp,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  type: 'order' | 'user' | 'product' | 'notification';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface ActivityFeedProps {
  isAdmin?: boolean;
  userId?: string;
  limit?: number;
}

const activityIcons = {
  order: ShoppingBag,
  user: UserPlus,
  product: Package,
  notification: Bell
};

const activityColors = {
  order: 'bg-blue-500/20 text-blue-500',
  user: 'bg-green-500/20 text-green-500',
  product: 'bg-purple-500/20 text-purple-500',
  notification: 'bg-amber-500/20 text-amber-500'
};

export function ActivityFeed({ isAdmin = false, userId, limit = 10 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
    
    // Set up real-time subscription for orders
    const channel = supabase
      .channel('activity-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          const newOrder = payload.new as { id: string; total_amount: number; created_at: string; customer_name?: string };
          const newActivity: Activity = {
            id: `order-${newOrder.id}`,
            type: 'order',
            title: 'New Order Placed',
            description: `Order #${newOrder.id.slice(0, 8)} - $${newOrder.total_amount}`,
            timestamp: newOrder.created_at
          };
          setActivities(prev => [newActivity, ...prev].slice(0, limit));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, userId, limit]);

  const fetchActivities = async () => {
    try {
      const activityList: Activity[] = [];

      if (isAdmin) {
        // Fetch recent orders for admin
        const { data: orders } = await supabase
          .from('orders')
          .select('id, total_amount, created_at, status, customer_name')
          .order('created_at', { ascending: false })
          .limit(limit);

        orders?.forEach(order => {
          activityList.push({
            id: `order-${order.id}`,
            type: 'order',
            title: order.customer_name ? `Order from ${order.customer_name}` : 'New Order',
            description: `$${order.total_amount} - ${order.status}`,
            timestamp: order.created_at
          });
        });
      } else if (userId) {
        // Fetch user's notifications
        const { data: notifications } = await supabase
          .from('notifications')
          .select('id, title, message, created_at, type')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);

        notifications?.forEach(notif => {
          activityList.push({
            id: `notif-${notif.id}`,
            type: 'notification',
            title: notif.title,
            description: notif.message,
            timestamp: notif.created_at
          });
        });

        // Fetch user's recent order updates
        const { data: orders } = await supabase
          .from('orders')
          .select('id, status, created_at, total_amount')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5);

        orders?.forEach(order => {
          activityList.push({
            id: `order-${order.id}`,
            type: 'order',
            title: 'Order Update',
            description: `Order #${order.id.slice(0, 8)} - ${order.status}`,
            timestamp: order.created_at
          });
        });
      }

      // Sort by timestamp
      activityList.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setActivities(activityList.slice(0, limit));
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-start gap-4 animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-3 w-48 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <p className="text-muted-foreground font-body">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {activities.map((activity, index) => {
          const Icon = activityIcons[activity.type];
          const colorClass = activityColors[activity.type];
          
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start gap-4 p-4 bg-secondary/30 hover:bg-secondary/50 rounded-xl transition-colors"
            >
              <div className={`p-2.5 rounded-xl ${colorClass}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm font-medium truncate">{activity.title}</p>
                <p className="text-muted-foreground text-xs truncate">{activity.description}</p>
              </div>
              <span className="text-muted-foreground text-xs whitespace-nowrap">
                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
