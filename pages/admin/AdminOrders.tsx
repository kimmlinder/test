import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  ShoppingBag, 
  Loader2,
  Eye,
  Truck,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  Eye as EyeIcon,
  MessageSquare,
  Send,
  Upload,
  X,
  Image as ImageIcon,
  CreditCard,
  Link as LinkIcon,
} from 'lucide-react';

type OrderStatus = 'pending' | 'accepted' | 'in_progress' | 'preview_sent' | 'shipped' | 'delivered' | 'cancelled' | 'confirmed' | 'processing';

interface Order {
  id: string;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  user_id: string;
  shipping_address: string | null;
  tracking_number: string | null;
  notes: string | null;
  preview_url: string | null;
  payment_method: string | null;
  revolut_link: string | null;
}

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  products: { name: string } | null;
}

interface OrderTimeline {
  id: string;
  status: OrderStatus;
  message: string | null;
  created_at: string;
}

interface OrderFeedback {
  id: string;
  order_id: string;
  user_id: string;
  message: string;
  created_at: string;
}

const statusOptions: { value: OrderStatus; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'pending', label: 'Pending', icon: Clock, color: 'bg-yellow-500/20 text-yellow-400' },
  { value: 'accepted', label: 'Accepted', icon: CheckCircle, color: 'bg-blue-500/20 text-blue-400' },
  { value: 'in_progress', label: 'Working On It', icon: Settings, color: 'bg-purple-500/20 text-purple-400' },
  { value: 'preview_sent', label: 'Preview Sent', icon: Eye, color: 'bg-orange-500/20 text-orange-400' },
  { value: 'shipped', label: 'Order Sent', icon: Truck, color: 'bg-indigo-500/20 text-indigo-400' },
  { value: 'delivered', label: 'Delivered', icon: Package, color: 'bg-green-500/20 text-green-400' },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'bg-red-500/20 text-red-400' },
];

export default function AdminOrders() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderTimeline, setOrderTimeline] = useState<OrderTimeline[]>([]);
  const [orderFeedback, setOrderFeedback] = useState<OrderFeedback[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>('pending');
  const [statusMessage, setStatusMessage] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [revolutLink, setRevolutLink] = useState('');
  const [adminReply, setAdminReply] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  
  // Preview file upload state
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewPreview, setPreviewPreview] = useState<string | null>(null);
  const [uploadingPreview, setUploadingPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdmin) {
      fetchOrders();
    }
  }, [isAdmin]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const openDetailsDialog = async (order: Order) => {
    setSelectedOrder(order);
    setDetailsDialogOpen(true);
    setLoadingDetails(true);
    setAdminReply('');

    try {
      const [itemsRes, timelineRes, feedbackRes] = await Promise.all([
        supabase
          .from('order_items')
          .select('*, products(name)')
          .eq('order_id', order.id),
        supabase
          .from('order_timeline')
          .select('*')
          .eq('order_id', order.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('order_feedback')
          .select('*')
          .eq('order_id', order.id)
          .order('created_at', { ascending: true }),
      ]);

      if (itemsRes.error) throw itemsRes.error;
      if (timelineRes.error) throw timelineRes.error;
      if (feedbackRes.error) throw feedbackRes.error;

      setOrderItems(itemsRes.data || []);
      setOrderTimeline(timelineRes.data || []);
      setOrderFeedback(feedbackRes.data || []);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedOrder || !adminReply.trim()) return;
    
    setSendingReply(true);
    try {
      const { error } = await supabase
        .from('order_feedback')
        .insert({
          order_id: selectedOrder.id,
          user_id: user!.id,
          message: adminReply.trim(),
        });
      
      if (error) throw error;
      
      // Refresh feedback
      const { data: feedbackData } = await supabase
        .from('order_feedback')
        .select('*')
        .eq('order_id', selectedOrder.id)
        .order('created_at', { ascending: true });
      
      setOrderFeedback(feedbackData || []);
      setAdminReply('');
      toast({ title: "Reply sent!", description: "Customer will be notified." });
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({ title: "Error", description: "Failed to send reply.", variant: "destructive" });
    } finally {
      setSendingReply(false);
    }
  };

  const openStatusDialog = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setStatusMessage('');
    setTrackingNumber(order.tracking_number || '');
    setRevolutLink(order.revolut_link || '');
    setPreviewFile(null);
    setPreviewPreview(order.preview_url || null);
    setStatusDialogOpen(true);
  };

  const handlePreviewFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewFile(file);
      const url = URL.createObjectURL(file);
      setPreviewPreview(url);
    }
  };

  const removePreviewFile = () => {
    setPreviewFile(null);
    setPreviewPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadPreviewFile = async (orderId: string): Promise<string | null> => {
    if (!previewFile) return selectedOrder?.preview_url || null;

    setUploadingPreview(true);
    try {
      const fileExt = previewFile.name.split('.').pop();
      const fileName = `${orderId}/preview-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('order-previews')
        .upload(fileName, previewFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('order-previews')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading preview:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload preview file.",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingPreview(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;

    setSaving(true);
    try {
      // Upload preview file if status is preview_sent and file is selected
      let previewUrl: string | null = selectedOrder.preview_url;
      if (newStatus === 'preview_sent' && previewFile) {
        previewUrl = await uploadPreviewFile(selectedOrder.id);
      }

      // Update order status
      const updateData: Partial<Order> = {
        status: newStatus,
      };

      if (trackingNumber && newStatus === 'shipped') {
        updateData.tracking_number = trackingNumber;
      }

      if (newStatus === 'preview_sent') {
        updateData.preview_url = previewUrl;
      }

      // Always update revolut link if provided
      if (revolutLink) {
        updateData.revolut_link = revolutLink;
      }

      const { error: orderError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', selectedOrder.id);

      if (orderError) throw orderError;

      // Add timeline entry
      const { error: timelineError } = await supabase
        .from('order_timeline')
        .insert({
          order_id: selectedOrder.id,
          status: newStatus,
          message: statusMessage || `Order status changed to ${newStatus}`,
        });

      if (timelineError) throw timelineError;

      // Send email notification (fire and forget)
      supabase.functions.invoke('send-order-notification', {
        body: {
          orderId: selectedOrder.id,
          newStatus,
          trackingNumber: trackingNumber || undefined,
          message: statusMessage || undefined,
          previewUrl: previewUrl || undefined,
        },
      }).then(({ error }) => {
        if (error) {
          console.error('Failed to send email notification:', error);
        } else {
          console.log('Email notification sent successfully');
        }
      });

      toast({
        title: "Order updated",
        description: `Order status changed to ${newStatus}.`,
      });

      setStatusDialogOpen(false);
      setPreviewFile(null);
      setPreviewPreview(null);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusConfig = (status: string) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

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
      <div className="mb-6 md:mb-8">
        <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-light tracking-tight mb-2">
          Manage Orders
        </h1>
        <p className="text-muted-foreground font-body text-sm md:text-base">
          View and manage all customer orders
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left px-6 py-4 font-body text-sm font-medium text-muted-foreground">Order</th>
                  <th className="text-left px-6 py-4 font-body text-sm font-medium text-muted-foreground hidden lg:table-cell">Date</th>
                  <th className="text-left px-6 py-4 font-body text-sm font-medium text-muted-foreground">Amount</th>
                  <th className="text-left px-6 py-4 font-body text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-6 py-4 font-body text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => {
                  const statusConfig = getStatusConfig(order.status);
                  return (
                    <tr key={order.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <ShoppingBag className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-mono text-sm">#{order.id.slice(0, 8)}</p>
                            {order.tracking_number && (
                              <p className="text-xs text-muted-foreground">
                                Tracking: {order.tracking_number}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground hidden lg:table-cell">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-medium">
                        ${Number(order.total_amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusConfig.color}`}>
                          <statusConfig.icon className="h-3 w-3" />
                          <span className="hidden sm:inline">{order.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="gap-2"
                            onClick={() => openDetailsDialog(order)}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline">View</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2"
                            onClick={() => openStatusDialog(order)}
                          >
                            <Settings className="h-4 w-4" />
                            <span className="hidden lg:inline">Update</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      No orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-border">
            {orders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              return (
                <div key={order.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ShoppingBag className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-mono text-sm font-medium">#{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusConfig.color}`}>
                      <statusConfig.icon className="h-3 w-3" />
                      {order.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <p className="font-medium text-lg">${Number(order.total_amount).toLocaleString()}</p>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openDetailsDialog(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openStatusDialog(order)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            {orders.length === 0 && (
              <div className="px-6 py-12 text-center text-muted-foreground">
                No orders found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Order #{selectedOrder?.id.slice(0, 8)}
            </DialogTitle>
          </DialogHeader>
          
          {loadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">{selectedOrder?.status}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-medium">${Number(selectedOrder?.total_amount).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">{selectedOrder && new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
                {selectedOrder?.tracking_number && (
                  <div>
                    <p className="text-muted-foreground">Tracking</p>
                    <p className="font-medium font-mono">{selectedOrder.tracking_number}</p>
                  </div>
                )}
              </div>

              {selectedOrder?.shipping_address && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Shipping Address</p>
                  <p className="text-sm bg-secondary/50 p-3 rounded-lg">{selectedOrder.shipping_address}</p>
                </div>
              )}

              {/* Order Items */}
              <div>
                <p className="text-sm font-medium mb-3">Items</p>
                <div className="space-y-2">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-secondary/50 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                          <Package className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.products?.name || 'Unknown Product'}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-medium">€{Number(item.price_at_purchase).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              {orderTimeline.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-3">Activity</p>
                  <div className="space-y-3">
                    {orderTimeline.map((entry) => {
                      const config = getStatusConfig(entry.status);
                      return (
                        <div key={entry.id} className="flex items-start gap-3">
                          <div className={`mt-0.5 p-1.5 rounded-full ${config.color}`}>
                            <config.icon className="h-3 w-3" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">{entry.message}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(entry.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Customer Feedback Section */}
              {orderFeedback.length > 0 && (
                <div className="border-t border-border pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">Customer Feedback ({orderFeedback.length})</p>
                  </div>
                  <div className="space-y-3 max-h-48 overflow-y-auto mb-3">
                    {orderFeedback.map((fb) => (
                      <div 
                        key={fb.id} 
                        className={`p-3 rounded-lg text-sm ${
                          fb.user_id === selectedOrder?.user_id 
                            ? 'bg-primary/10 border border-primary/20' 
                            : 'bg-secondary ml-4'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">
                            {fb.user_id === selectedOrder?.user_id ? 'Customer' : 'Admin'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(fb.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p>{fb.message}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Reply to customer feedback..."
                      value={adminReply}
                      onChange={(e) => setAdminReply(e.target.value)}
                      className="min-h-[60px]"
                    />
                  </div>
                  <Button 
                    onClick={handleSendReply} 
                    disabled={sendingReply || !adminReply.trim()}
                    className="mt-2 w-full"
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sendingReply ? 'Sending...' : 'Send Reply'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Update Order Status
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Status</Label>
              <p className="text-sm text-muted-foreground capitalize">{selectedOrder?.status}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">New Status</Label>
              <Select value={newStatus} onValueChange={(v: OrderStatus) => setNewStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {newStatus === 'shipped' && (
              <div className="space-y-2">
                <Label htmlFor="tracking">Tracking Number</Label>
                <Input
                  id="tracking"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                />
              </div>
            )}

            {newStatus === 'preview_sent' && (
              <div className="space-y-2">
                <Label>Preview File</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Upload an image or file to share with the customer
                </p>
                
                {previewPreview ? (
                  <div className="relative">
                    <div className="border border-border rounded-lg overflow-hidden">
                      {previewPreview.match(/\.(jpg|jpeg|png|gif|webp)$/i) || previewFile?.type.startsWith('image/') ? (
                        <img 
                          src={previewPreview} 
                          alt="Preview" 
                          className="w-full h-48 object-contain bg-secondary"
                        />
                      ) : (
                        <div className="w-full h-32 bg-secondary flex items-center justify-center">
                          <div className="text-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                              {previewFile?.name || 'Preview file attached'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={removePreviewFile}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload preview
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, PDF up to 10MB
                    </p>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handlePreviewFileChange}
                  className="hidden"
                />
              </div>
            )}

            {/* Revolut Payment Link - shown for pending/online payment orders */}
            <div className="space-y-2">
              <Label htmlFor="revolutLink" className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Revolut Payment Link
              </Label>
              <Input
                id="revolutLink"
                value={revolutLink}
                onChange={(e) => setRevolutLink(e.target.value)}
                placeholder="https://checkout.revolut.com/pay/..."
              />
              <p className="text-xs text-muted-foreground">
                Add a custom Revolut payment link for this specific order
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Status Message (optional)</Label>
              <Textarea
                id="message"
                value={statusMessage}
                onChange={(e) => setStatusMessage(e.target.value)}
                placeholder="Add a note about this status change..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={saving || uploadingPreview}>
              {(saving || uploadingPreview) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {uploadingPreview ? 'Uploading...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
