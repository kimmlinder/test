import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { MemberLayout } from '@/components/member/MemberLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Heart, ShoppingCart, Trash2, Package } from 'lucide-react';

interface WishlistItem {
  id: string;
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string;
    product_type: string;
    in_stock: boolean;
  };
}

export default function MemberWishlist() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) fetchWishlist();
  }, [user]);

  const fetchWishlist = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('wishlist')
      .select(`
        id,
        product:products (
          id,
          name,
          description,
          price,
          image_url,
          product_type,
          in_stock
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    setWishlist((data as unknown as WishlistItem[]) || []);
    setIsLoading(false);
  };

  const removeFromWishlist = async (wishlistId: string, productName: string) => {
    await supabase
      .from('wishlist')
      .delete()
      .eq('id', wishlistId);
    
    setWishlist(prev => prev.filter(w => w.id !== wishlistId));
    toast({ title: `${productName} ${t.removedFromWishlist}` });
  };

  const addToCart = (product: WishlistItem['product']) => {
    toast({
      title: t.addedToCart,
      description: `${product.name}`,
    });
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
        >
          <h1 className="font-display text-5xl lg:text-6xl font-medium mb-4">{t.myWishlist}</h1>
          <p className="text-muted-foreground font-body text-lg">
            {t.itemsSavedForLater}
          </p>
        </motion.div>

        {/* Wishlist Items */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-3xl overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-secondary" />
                <div className="p-6 space-y-3">
                  <div className="h-6 bg-secondary rounded w-3/4" />
                  <div className="h-4 bg-secondary rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : wishlist.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {wishlist.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group bg-card border border-border rounded-3xl overflow-hidden"
              >
                <div className="aspect-[4/3] relative overflow-hidden">
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={() => removeFromWishlist(item.id, item.product.name)}
                      className="p-2.5 bg-background/80 hover:bg-destructive hover:text-white rounded-full transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="absolute top-4 left-4">
                    <Heart className="h-5 w-5 text-pink-500 fill-pink-500" />
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="font-display text-xl font-medium mb-2">
                    {item.product.name}
                  </h3>
                  <p className="text-muted-foreground text-sm font-body line-clamp-2 mb-6">
                    {item.product.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-display text-3xl font-medium">
                      €{item.product.price}
                    </span>
                    <Button 
                      size="sm"
                      onClick={() => addToCart(item.product)}
                      disabled={!item.product.in_stock}
                      className="rounded-full px-5"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {item.product.in_stock ? t.addToCart : t.outOfStock}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Heart className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-display text-2xl font-medium mb-2">{t.wishlistEmpty}</h3>
            <p className="text-muted-foreground font-body mb-6">
              {t.saveItemsHeart}
            </p>
            <Link to="/member/shop">
              <Button className="rounded-full px-6">
                <Package className="h-4 w-4 mr-2" />
                {t.browseShopButton}
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </MemberLayout>
  );
}
