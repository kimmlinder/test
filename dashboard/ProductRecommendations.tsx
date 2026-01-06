import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: string | null;
}

interface ProductRecommendationsProps {
  userId: string;
}

export function ProductRecommendations({ userId }: ProductRecommendationsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    fetchRecommendations();
  }, [userId]);

  const fetchRecommendations = async () => {
    try {
      // Get user's order history to find preferred categories
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          product_id,
          products (category)
        `)
        .limit(20);

      // Get categories from previous purchases
      const purchasedCategories = new Set<string>();
      const purchasedProductIds = new Set<string>();
      
      orderItems?.forEach(item => {
        purchasedProductIds.add(item.product_id);
        const product = item.products as { category: string | null } | null;
        if (product?.category) {
          purchasedCategories.add(product.category);
        }
      });

      // Fetch products from similar categories, excluding already purchased
      let query = supabase
        .from('products')
        .select('id, name, price, image_url, category')
        .eq('in_stock', true)
        .limit(8);

      if (purchasedCategories.size > 0) {
        query = query.in('category', Array.from(purchasedCategories));
      }

      const { data: recommendedProducts } = await query;

      // Filter out already purchased and shuffle
      let filtered = (recommendedProducts || []).filter(
        p => !purchasedProductIds.has(p.id)
      );

      // If not enough from preferred categories, add more random products
      if (filtered.length < 4) {
        const { data: moreProducts } = await supabase
          .from('products')
          .select('id, name, price, image_url, category')
          .eq('in_stock', true)
          .not('id', 'in', `(${Array.from(purchasedProductIds).join(',') || 'null'})`)
          .limit(8);

        filtered = [...filtered, ...(moreProducts || [])];
      }

      // Shuffle and take first 4
      const shuffled = filtered.sort(() => Math.random() - 0.5).slice(0, 4);
      setProducts(shuffled);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product: Product) => {
    await addToCart(product.id, 1);
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`
    });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square bg-muted rounded-2xl mb-3" />
            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 bg-secondary/30 rounded-3xl">
        <Sparkles className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <p className="text-muted-foreground font-body">No recommendations yet</p>
        <Link to="/member/shop" className="text-primary text-sm hover:underline mt-2 inline-block">
          Browse all products →
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {products.map((product, index) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="group"
        >
          <Link to={`/shop`} className="block">
            <div className="relative aspect-square bg-secondary rounded-2xl overflow-hidden mb-3">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ShoppingCart className="h-8 w-8" />
                </div>
              )}
              
              {/* Quick action buttons */}
              <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  className="rounded-full"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart(product);
                  }}
                >
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Link>
          
          <h4 className="font-body text-sm font-medium truncate">{product.name}</h4>
          <p className="text-primary font-display font-medium">€{product.price.toFixed(2)}</p>
        </motion.div>
      ))}
    </div>
  );
}
