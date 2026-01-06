import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Loader2,
  Crown,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  RefreshCw,
  User,
  Calendar,
  CreditCard,
  RotateCcw,
  AlertTriangle,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addMonths, differenceInDays } from 'date-fns';

interface Subscription {
  id: string;
  user_id: string;
  plan_type: string;
  status: string;
  payment_reference: string | null;
  payment_method: string | null;
  amount: number | null;
  started_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string | null;
  };
}

export default function AdminSubscriptions() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{ 
    open: boolean; 
    subscription: Subscription | null; 
    action: 'activate' | 'cancel' | 'renew' | 'send_reminder';
  }>({
    open: false,
    subscription: null,
    action: 'activate',
  });
  const [paymentReference, setPaymentReference] = useState('');
  const [processing, setProcessing] = useState(false);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      fetchSubscriptions();
    }
  }, [isAdmin]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      // First fetch subscriptions
      const { data: subsData, error: subsError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (subsError) throw subsError;

      // Then fetch profiles for these users
      const userIds = subsData?.map(s => s.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      // Combine the data
      const combined = (subsData || []).map(sub => ({
        ...sub,
        profiles: profilesData?.find(p => p.id === sub.user_id) || null,
      }));

      setSubscriptions(combined);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!confirmDialog.subscription) return;
    
    setProcessing(true);
    try {
      const expiresAt = addMonths(new Date(), 1).toISOString();
      
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'active',
          payment_reference: paymentReference || null,
          started_at: new Date().toISOString(),
          expires_at: expiresAt,
        })
        .eq('id', confirmDialog.subscription.id);

      if (error) throw error;

      // Send email notification
      await supabase.functions.invoke('send-subscription-notification', {
        body: {
          user_id: confirmDialog.subscription.user_id,
          notification_type: 'activated',
          expires_at: expiresAt,
        },
      });

      toast.success('Subscription activated and email sent!');
      setConfirmDialog({ open: false, subscription: null, action: 'activate' });
      setPaymentReference('');
      fetchSubscriptions();
    } catch (error) {
      console.error('Error activating subscription:', error);
      toast.error('Failed to activate subscription');
    } finally {
      setProcessing(false);
    }
  };

  const handleRenew = async () => {
    if (!confirmDialog.subscription) return;
    
    setProcessing(true);
    try {
      // Extend from current expiry or from now
      const currentExpiry = confirmDialog.subscription.expires_at 
        ? new Date(confirmDialog.subscription.expires_at) 
        : new Date();
      const newExpiry = addMonths(currentExpiry > new Date() ? currentExpiry : new Date(), 1);
      
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'active',
          payment_reference: paymentReference || confirmDialog.subscription.payment_reference,
          expires_at: newExpiry.toISOString(),
        })
        .eq('id', confirmDialog.subscription.id);

      if (error) throw error;

      // Send renewal notification
      await supabase.functions.invoke('send-subscription-notification', {
        body: {
          user_id: confirmDialog.subscription.user_id,
          notification_type: 'renewed',
          expires_at: newExpiry.toISOString(),
        },
      });

      toast.success('Subscription renewed and email sent!');
      setConfirmDialog({ open: false, subscription: null, action: 'activate' });
      setPaymentReference('');
      fetchSubscriptions();
    } catch (error) {
      console.error('Error renewing subscription:', error);
      toast.error('Failed to renew subscription');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!confirmDialog.subscription) return;
    
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
        })
        .eq('id', confirmDialog.subscription.id);

      if (error) throw error;

      toast.success('Subscription cancelled');
      setConfirmDialog({ open: false, subscription: null, action: 'cancel' });
      fetchSubscriptions();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setProcessing(false);
    }
  };

  const handleSendReminder = async (sub: Subscription) => {
    setSendingReminder(sub.id);
    try {
      await supabase.functions.invoke('send-subscription-notification', {
        body: {
          user_id: sub.user_id,
          notification_type: 'payment_reminder',
        },
      });

      toast.success('Payment reminder sent!');
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast.error('Failed to send reminder');
    } finally {
      setSendingReminder(null);
    }
  };

  const getExpiryWarning = (sub: Subscription) => {
    if (sub.status !== 'active' || !sub.expires_at) return null;
    const daysLeft = differenceInDays(new Date(sub.expires_at), new Date());
    if (daysLeft <= 0) return { level: 'expired', text: 'Expired' };
    if (daysLeft <= 3) return { level: 'critical', text: `${daysLeft}d left` };
    if (daysLeft <= 7) return { level: 'warning', text: `${daysLeft}d left` };
    return null;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-primary/10 text-primary border-primary/30"><CheckCircle2 className="w-3 h-3 mr-1" />Active</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/30"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      case 'expired':
        return <Badge variant="outline" className="text-destructive border-destructive/30"><XCircle className="w-3 h-3 mr-1" />Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const name = sub.profiles?.full_name?.toLowerCase() || '';
    const id = sub.user_id.toLowerCase();
    const search = searchTerm.toLowerCase();
    return name.includes(search) || id.includes(search);
  });

  const pendingCount = subscriptions.filter(s => s.status === 'pending').length;

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/member" replace />;
  }

  return (
    <AdminLayout>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl md:text-4xl font-light tracking-tight">
              Subscriptions
            </h1>
            {pendingCount > 0 && (
              <Badge className="bg-amber-500 text-black">
                {pendingCount} pending
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground font-body mt-2">
            Manage premium memberships and confirm payments
          </p>
        </div>
        <Button onClick={fetchSubscriptions} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">
                {subscriptions.filter(s => s.status === 'active').length}
              </p>
              <p className="text-xs text-muted-foreground">Active Premium</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending Verification</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">
                €{subscriptions.filter(s => s.status === 'active').reduce((sum, s) => sum + (s.amount || 0), 0)}
              </p>
              <p className="text-xs text-muted-foreground">Monthly Revenue</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{subscriptions.length}</p>
              <p className="text-xs text-muted-foreground">Total Subscriptions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or user ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredSubscriptions.length === 0 ? (
        <div className="text-center py-20">
          <Crown className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No subscriptions found</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.map((sub) => {
                const expiryWarning = getExpiryWarning(sub);
                return (
                  <TableRow key={sub.id} className={cn(
                    sub.status === 'pending' && 'bg-amber-500/5',
                    sub.status === 'expired' && 'bg-destructive/5'
                  )}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{sub.profiles?.full_name || 'Unknown User'}</p>
                        <p className="text-xs text-muted-foreground font-mono">{sub.user_id.slice(0, 8)}...</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Crown className={cn("w-4 h-4", sub.plan_type === 'premium' ? "text-amber-500" : "text-muted-foreground")} />
                        <span className="capitalize">{sub.plan_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(sub.status)}
                        {expiryWarning && (
                          <Badge className={cn(
                            "text-xs",
                            expiryWarning.level === 'critical' && "bg-destructive/10 text-destructive border-destructive/30",
                            expiryWarning.level === 'warning' && "bg-amber-500/10 text-amber-500 border-amber-500/30"
                          )}>
                            <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                            {expiryWarning.text}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>€{sub.amount || 0}</TableCell>
                    <TableCell>
                      {sub.expires_at ? (
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(sub.expires_at), 'MMM d, yyyy')}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(sub.created_at), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {sub.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSendReminder(sub)}
                              disabled={sendingReminder === sub.id}
                              className="text-muted-foreground"
                            >
                              {sendingReminder === sub.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Mail className="w-3 h-3" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => setConfirmDialog({ open: true, subscription: sub, action: 'activate' })}
                              className="bg-primary hover:bg-primary/90"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmDialog({ open: true, subscription: sub, action: 'cancel' })}
                              className="text-destructive hover:text-destructive"
                            >
                              <XCircle className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        {sub.status === 'active' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setConfirmDialog({ open: true, subscription: sub, action: 'renew' })}
                            >
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Renew
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmDialog({ open: true, subscription: sub, action: 'cancel' })}
                              className="text-muted-foreground"
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {(sub.status === 'expired' || sub.status === 'cancelled') && (
                          <Button
                            size="sm"
                            onClick={() => setConfirmDialog({ open: true, subscription: sub, action: 'renew' })}
                            className="bg-primary hover:bg-primary/90"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.action === 'activate' && 'Confirm Payment & Activate Premium'}
              {confirmDialog.action === 'renew' && 'Renew Premium Subscription'}
              {confirmDialog.action === 'cancel' && 'Cancel Subscription'}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.action === 'activate' && 'This will activate the user\'s Premium subscription and send them an email notification.'}
              {confirmDialog.action === 'renew' && 'This will extend the subscription by 1 month and send an email notification.'}
              {confirmDialog.action === 'cancel' && 'This will cancel the subscription. The user will lose Premium access.'}
            </DialogDescription>
          </DialogHeader>

          {(confirmDialog.action === 'activate' || confirmDialog.action === 'renew') && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="payment_reference">Payment Reference (optional)</Label>
                <Input
                  id="payment_reference"
                  placeholder="e.g., Revolut transaction ID"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Add a reference to track this payment
                </p>
              </div>
              {confirmDialog.action === 'renew' && confirmDialog.subscription?.expires_at && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Current expiry: <strong>{format(new Date(confirmDialog.subscription.expires_at), 'MMMM d, yyyy')}</strong>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    New expiry: <strong>{format(addMonths(
                      new Date(confirmDialog.subscription.expires_at) > new Date() 
                        ? new Date(confirmDialog.subscription.expires_at) 
                        : new Date(), 
                      1
                    ), 'MMMM d, yyyy')}</strong>
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmDialog({ open: false, subscription: null, action: 'activate' });
                setPaymentReference('');
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (confirmDialog.action === 'activate') handleActivate();
                else if (confirmDialog.action === 'renew') handleRenew();
                else handleCancel();
              }}
              disabled={processing}
              className={cn(
                confirmDialog.action === 'cancel' && "bg-destructive hover:bg-destructive/90"
              )}
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : confirmDialog.action === 'activate' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Activate Premium
                </>
              ) : confirmDialog.action === 'renew' ? (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Renew Subscription
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Subscription
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
