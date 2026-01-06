import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { MemberLayout } from '@/components/member/MemberLayout';
import { Button } from '@/components/ui/button';
import { Bell, Package, Check, CheckCheck, Trash2, Info, AlertCircle, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link: string | null;
  created_at: string;
}

const typeConfig: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  order: { icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/20' },
  promo: { icon: Gift, color: 'text-pink-500', bg: 'bg-pink-500/20' },
  alert: { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/20' },
  info: { icon: Info, color: 'text-cyan-500', bg: 'bg-cyan-500/20' },
};

export default function MemberNotifications() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      const channel = supabase
        .channel('notifications-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          () => fetchNotifications()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    setNotifications(data || []);
    setIsLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
    
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
    
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = async (id: string) => {
    await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="font-display text-5xl lg:text-6xl font-medium mb-4">{t.notifications}</h1>
            <p className="text-muted-foreground font-body text-lg">
              {unreadCount > 0 
                ? `${unreadCount} ${t.unreadNotifications}${unreadCount > 1 ? 's' : ''}`
                : t.allCaughtUp}
            </p>
          </div>
          
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead} className="gap-2 rounded-full">
              <CheckCheck className="h-4 w-4" />
              {t.markAllAsRead}
            </Button>
          )}
        </motion.div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-secondary rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-secondary rounded w-1/3" />
                    <div className="h-4 bg-secondary rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notification, index) => {
              const config = typeConfig[notification.type] || typeConfig.info;
              const NotificationIcon = config.icon;
              
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={cn(
                    "bg-card border rounded-2xl p-6 transition-all",
                    notification.read 
                      ? "border-border" 
                      : "border-primary/50 bg-primary/5"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn("p-3 rounded-xl flex-shrink-0", config.bg)}>
                      <NotificationIcon className={cn("h-5 w-5", config.color)} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-body font-medium mb-1 text-lg">
                            {notification.title}
                          </h3>
                          <p className="text-muted-foreground font-body">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => markAsRead(notification.id)}
                              title="Mark as read"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteNotification(notification.id)}
                            className="text-muted-foreground hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {notification.link && (
                        <Link
                          to={notification.link}
                          className="inline-block mt-3 text-sm text-primary hover:underline font-medium"
                        >
                          {t.viewDetails} →
                        </Link>
                      )}
                    </div>
                  </div>
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
            <Bell className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-display text-2xl font-medium mb-2">{t.noNotifications}</h3>
            <p className="text-muted-foreground font-body">
              {t.notifyWhenImportant}
            </p>
          </motion.div>
        )}
      </div>
    </MemberLayout>
  );
}
