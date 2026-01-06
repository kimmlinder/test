import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  product_type: string;
  in_stock: boolean;
}

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: Product;
}

interface GuestCartItem {
  product_id: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  itemCount: number;
  totalAmount: number;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const GUEST_CART_KEY = 'guest_cart';

const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper to get guest cart from localStorage
const getGuestCart = (): GuestCartItem[] => {
  try {
    const stored = localStorage.getItem(GUEST_CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Helper to save guest cart to localStorage
const saveGuestCart = (cart: GuestCartItem[]) => {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
};

// Helper to clear guest cart
const clearGuestCart = () => {
  localStorage.removeItem(GUEST_CART_KEY);
};

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch product details for guest cart items
  const fetchGuestCartWithProducts = async (): Promise<CartItem[]> => {
    const guestCart = getGuestCart();
    if (guestCart.length === 0) return [];

    const productIds = guestCart.map(item => item.product_id);
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, price, image_url, product_type, in_stock')
      .in('id', productIds);

    if (error || !products) return [];

    return guestCart.map(item => {
      const product = products.find(p => p.id === item.product_id);
      if (!product) return null;
      return {
        id: `guest-${item.product_id}`,
        product_id: item.product_id,
        quantity: item.quantity,
        product,
      };
    }).filter(Boolean) as CartItem[];
  };

  // Sync guest cart to database when user logs in
  const syncGuestCartToDb = async (userId: string) => {
    const guestCart = getGuestCart();
    if (guestCart.length === 0) return;

    try {
      for (const item of guestCart) {
        // Check if item already exists in user's cart
        const { data: existing } = await supabase
          .from('cart_items')
          .select('id, quantity')
          .eq('user_id', userId)
          .eq('product_id', item.product_id)
          .maybeSingle();

        if (existing) {
          // Update quantity
          await supabase
            .from('cart_items')
            .update({ quantity: existing.quantity + item.quantity })
            .eq('id', existing.id);
        } else {
          // Insert new item
          await supabase
            .from('cart_items')
            .insert({
              user_id: userId,
              product_id: item.product_id,
              quantity: item.quantity,
            });
        }
      }
      clearGuestCart();
    } catch (error) {
      console.error('Error syncing guest cart:', error);
    }
  };

  const fetchCart = async () => {
    setLoading(true);
    try {
      if (user) {
        // Sync guest cart first if exists
        await syncGuestCartToDb(user.id);

        const { data, error } = await supabase
          .from('cart_items')
          .select(`
            id,
            product_id,
            quantity,
            product:products(id, name, price, image_url, product_type, in_stock)
          `)
          .eq('user_id', user.id);

        if (error) throw error;
        
        const cartItems = (data || []).map(item => ({
          ...item,
          product: item.product as unknown as Product
        }));
        
        setItems(cartItems);
      } else {
        // Fetch guest cart with product details
        const guestItems = await fetchGuestCartWithProducts();
        setItems(guestItems);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const addToCart = async (productId: string, quantity = 1) => {
    try {
      if (user) {
        // Logged in user - use database
        const existingItem = items.find(item => item.product_id === productId);
        
        if (existingItem) {
          await updateQuantity(productId, existingItem.quantity + quantity);
        } else {
          const { error } = await supabase
            .from('cart_items')
            .insert({
              user_id: user.id,
              product_id: productId,
              quantity,
            });

          if (error) throw error;
          
          toast({
            title: "Added to cart",
            description: "Item has been added to your cart.",
          });
          
          await fetchCart();
        }
      } else {
        // Guest user - use localStorage
        const guestCart = getGuestCart();
        const existingIndex = guestCart.findIndex(item => item.product_id === productId);
        
        if (existingIndex >= 0) {
          guestCart[existingIndex].quantity += quantity;
        } else {
          guestCart.push({ product_id: productId, quantity });
        }
        
        saveGuestCart(guestCart);
        
        toast({
          title: "Added to cart",
          description: "Item has been added to your cart.",
        });
        
        await fetchCart();
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart.",
        variant: "destructive",
      });
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        await removeFromCart(productId);
        return;
      }

      if (user) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity })
          .eq('user_id', user.id)
          .eq('product_id', productId);

        if (error) throw error;
      } else {
        const guestCart = getGuestCart();
        const existingIndex = guestCart.findIndex(item => item.product_id === productId);
        
        if (existingIndex >= 0) {
          guestCart[existingIndex].quantity = quantity;
          saveGuestCart(guestCart);
        }
      }
      
      await fetchCart();
    } catch (error) {
      console.error('Error updating cart:', error);
      toast({
        title: "Error",
        description: "Failed to update cart.",
        variant: "destructive",
      });
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      if (user) {
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);

        if (error) throw error;
      } else {
        const guestCart = getGuestCart().filter(item => item.product_id !== productId);
        saveGuestCart(guestCart);
      }
      
      toast({
        title: "Removed from cart",
        description: "Item has been removed from your cart.",
      });
      
      await fetchCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast({
        title: "Error",
        description: "Failed to remove item from cart.",
        variant: "destructive",
      });
    }
  };

  const clearCart = async () => {
    try {
      if (user) {
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        clearGuestCart();
      }
      
      setItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      loading,
      itemCount,
      totalAmount,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      refreshCart: fetchCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
