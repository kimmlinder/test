import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, Plus, Minus, ShoppingBag, ArrowLeft, User, Mail, CreditCard, Truck, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';

const checkoutSchema = z.object({
  customer_name: z.string().trim().min(1, "Name is required").max(100),
  customer_email: z.string().trim().email("Valid email is required").max(255),
  customer_phone: z.string().trim().min(1, "Phone number is required").max(20),
  shipping_address: z.string().trim().min(1, "Shipping address is required").max(500),
  special_instructions: z.string().max(1000).optional(),
  preferred_delivery_date: z.string().optional(),
  payment_method: z.enum(['pay_on_delivery', 'bank_transfer', 'pay_online']),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;
type PaymentMethod = 'pay_on_delivery' | 'bank_transfer' | 'pay_online';

export default function Checkout() {
  const { user, loading: authLoading } = useAuth();
  const { items, totalAmount, updateQuantity, removeFromCart, clearCart, loading: cartLoading } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<CheckoutFormData>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    shipping_address: '',
    special_instructions: '',
    preferred_delivery_date: '',
    payment_method: 'pay_on_delivery',
  });

  // Fetch payment settings for Revolut link
  const { data: paymentSettings } = useQuery({
    queryKey: ['payment-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch user profile to pre-fill shipping address
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile-checkout', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone, address, city, country, postal_code')
        .eq('id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Pre-fill form with profile data when available
  useEffect(() => {
    if (userProfile) {
      const addressParts = [
        userProfile.address,
        userProfile.city,
        userProfile.postal_code,
        userProfile.country,
      ].filter(Boolean);
      
      setFormData(prev => ({
        ...prev,
        customer_name: prev.customer_name || userProfile.full_name || '',
        customer_phone: prev.customer_phone || userProfile.phone || '',
        shipping_address: prev.shipping_address || addressParts.join(', ') || '',
      }));
    }
  }, [userProfile]);

  // Pre-fill email from user when available
  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({
        ...prev,
        customer_email: prev.customer_email || user.email || '',
      }));
    }
  }, [user]);

  const revolutLink = paymentSettings?.default_revolut_link || 'https://checkout.revolut.com/pay/f0f9a97b-2463-4d00-9ceb-fb1b9806a7e2';

  if (authLoading || cartLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20">
          <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
            <h1 className="font-display text-3xl font-medium mb-4">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">Add some products to get started.</p>
            <Link to="/shop">
              <Button>Browse Products</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For free orders, set payment to a default value since it's not needed
    const dataToValidate = totalAmount === 0 
      ? { ...formData, payment_method: 'pay_on_delivery' as PaymentMethod }
      : formData;
    
    const result = checkoutSchema.safeParse(dataToValidate);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const isFreeOrder = totalAmount === 0;
      const effectivePaymentMethod = isFreeOrder ? 'pay_on_delivery' : formData.payment_method;
      
      // For guest users, we need to handle the order differently
      // We'll use the service role through an edge function to create the order
      if (!user) {
        // Call edge function for guest checkout
        const { data, error } = await supabase.functions.invoke('guest-checkout', {
          body: {
            customer_name: formData.customer_name.trim(),
            customer_email: formData.customer_email.trim(),
            customer_phone: formData.customer_phone.trim(),
            shipping_address: formData.shipping_address.trim(),
            special_instructions: formData.special_instructions?.trim() || null,
            preferred_delivery_date: formData.preferred_delivery_date || null,
            payment_method: effectivePaymentMethod,
            total_amount: totalAmount,
            items: items.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity,
              price_at_purchase: item.product.price,
            })),
            is_free_order: isFreeOrder,
          },
        });

        if (error) throw error;
        
        // Clear cart
        await clearCart();

        const confirmationUrl = `/payment-confirmation?order=${data?.orderId || ''}&method=${effectivePaymentMethod}&amount=${totalAmount}`;
        
        if (effectivePaymentMethod === 'pay_online' && !isFreeOrder) {
          window.open(revolutLink, '_blank');
        }
        
        navigate(confirmationUrl);
      } else {
        // Logged in user - use database directly
        const orderStatus = isFreeOrder ? 'accepted' : 'pending';
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: user.id,
            total_amount: totalAmount,
            status: orderStatus,
            order_type: 'standard',
            customer_name: formData.customer_name.trim(),
            customer_phone: formData.customer_phone.trim(),
            shipping_address: formData.shipping_address.trim(),
            special_instructions: isFreeOrder 
              ? `[Free Order] ${formData.special_instructions?.trim() || ''}`.trim()
              : `[Payment: ${effectivePaymentMethod === 'bank_transfer' ? 'Bank Transfer' : effectivePaymentMethod === 'pay_online' ? 'Pay Online' : 'Pay on Delivery'}] ${formData.special_instructions?.trim() || ''}`.trim(),
            preferred_delivery_date: formData.preferred_delivery_date || null,
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Create order items
        const orderItems = items.map(item => ({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price_at_purchase: item.product.price,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;

        // Add initial timeline entry
        await supabase
          .from('order_timeline')
          .insert({
            order_id: order.id,
            status: orderStatus,
            message: isFreeOrder ? 'Free order completed' : 'Order placed successfully',
          });

        // Notify admins about new order (fire and forget)
        supabase.functions.invoke('notify-admin-new-order', {
          body: {
            order_id: order.id,
            customer_name: formData.customer_name.trim(),
            customer_phone: formData.customer_phone.trim(),
            total_amount: totalAmount,
            items_count: items.length,
          },
        }).catch(err => console.error('Failed to notify admins:', err));

        // Process digital orders - auto-accept if paid online or free
        if (effectivePaymentMethod === 'pay_online' || isFreeOrder) {
          supabase.functions.invoke('process-digital-order', {
            body: {
              order_id: order.id,
              payment_confirmed: true,
            },
          }).catch(err => console.error('Failed to process digital order:', err));
        }

        // Clear cart
        await clearCart();

        const confirmationUrl = `/payment-confirmation?order=${order.id}&method=${effectivePaymentMethod}&amount=${totalAmount}`;
        
        if (effectivePaymentMethod === 'pay_online' && !isFreeOrder) {
          window.open(revolutLink, '_blank');
        }
        
        navigate(confirmationUrl);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <Link 
            to="/shop" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </Link>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl md:text-5xl font-light tracking-tight mb-12"
          >
            Checkout
          </motion.h1>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Cart Items */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="font-display text-2xl font-medium mb-6">Your Cart</h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 bg-card rounded-xl border border-border">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                      {item.product.image_url ? (
                        <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">{item.product.name}</h3>
                      <p className="text-primary font-medium">€{item.product.price}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeFromCart(item.product_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-secondary/50 rounded-xl">
                <div className="flex justify-between items-center text-lg font-medium">
                  <span>Total</span>
                  <span className="text-primary">€{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Login prompt for guests */}
              {!user && (
                <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <User className="h-5 w-5 text-primary" />
                    <span className="font-medium">Have an account?</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Sign in to track your orders and access order history.
                  </p>
                  <Link to="/auth">
                    <Button variant="outline" size="sm">Sign In</Button>
                  </Link>
                </div>
              )}
            </motion.div>

            {/* Checkout Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="font-display text-2xl font-medium mb-6">
                {user ? 'Delivery Details' : 'Guest Checkout'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="customer_name">Full Name *</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    placeholder="Your full name"
                    className={errors.customer_name ? 'border-destructive' : ''}
                  />
                  {errors.customer_name && <p className="text-sm text-destructive">{errors.customer_name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="customer_email"
                      type="email"
                      value={formData.customer_email}
                      onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                      placeholder="your@email.com"
                      className={`pl-10 ${errors.customer_email ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.customer_email && <p className="text-sm text-destructive">{errors.customer_email}</p>}
                  {!user && (
                    <p className="text-xs text-muted-foreground">We'll send order confirmation to this email</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_phone">Phone Number *</Label>
                  <Input
                    id="customer_phone"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    className={errors.customer_phone ? 'border-destructive' : ''}
                  />
                  {errors.customer_phone && <p className="text-sm text-destructive">{errors.customer_phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shipping_address">Shipping Address *</Label>
                  <Textarea
                    id="shipping_address"
                    value={formData.shipping_address}
                    onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                    placeholder="Street address, city, state, ZIP code"
                    rows={3}
                    className={errors.shipping_address ? 'border-destructive' : ''}
                  />
                  {errors.shipping_address && <p className="text-sm text-destructive">{errors.shipping_address}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferred_delivery_date">Preferred Delivery Date</Label>
                  <Input
                    id="preferred_delivery_date"
                    type="date"
                    value={formData.preferred_delivery_date}
                    onChange={(e) => setFormData({ ...formData, preferred_delivery_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="special_instructions">Special Instructions</Label>
                  <Textarea
                    id="special_instructions"
                    value={formData.special_instructions}
                    onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                    placeholder="Any special requests, delivery notes, or customization requirements..."
                    rows={4}
                  />
                  {errors.special_instructions && <p className="text-sm text-destructive">{errors.special_instructions}</p>}
                </div>

                {/* Payment Method Selection - only show if total > 0 */}
                {totalAmount > 0 && (
                  <div className="space-y-3">
                    <Label>Payment Method *</Label>
                    <RadioGroup
                      value={formData.payment_method}
                      onValueChange={(value: PaymentMethod) => setFormData({ ...formData, payment_method: value })}
                      className="grid gap-3"
                    >
                      <div className="flex items-center space-x-3 p-4 border border-border rounded-xl hover:border-primary/50 transition-colors cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                        <RadioGroupItem value="pay_on_delivery" id="pay_on_delivery" />
                        <Label htmlFor="pay_on_delivery" className="flex items-center gap-3 cursor-pointer flex-1">
                          <Truck className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">Pay on Delivery</p>
                            <p className="text-sm text-muted-foreground">Pay cash when your order arrives</p>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-4 border border-border rounded-xl hover:border-primary/50 transition-colors cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                        <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                        <Label htmlFor="bank_transfer" className="flex items-center gap-3 cursor-pointer flex-1">
                          <Building2 className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">Bank Transfer</p>
                            <p className="text-sm text-muted-foreground">Transfer to our bank account</p>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-4 border border-border rounded-xl hover:border-primary/50 transition-colors cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                        <RadioGroupItem value="pay_online" id="pay_online" />
                        <Label htmlFor="pay_online" className="flex items-center gap-3 cursor-pointer flex-1">
                          <CreditCard className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">Pay Online</p>
                            <p className="text-sm text-muted-foreground">Pay securely via Revolut</p>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                    {errors.payment_method && <p className="text-sm text-destructive">{errors.payment_method}</p>}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : totalAmount === 0 ? (
                    <>Complete Order</>
                  ) : (
                    <>Place Order - €{totalAmount.toFixed(2)}</>
                  )}
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
