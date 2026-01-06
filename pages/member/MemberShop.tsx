import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { MemberLayout } from '@/components/member/MemberLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Heart, ShoppingCart, Package, Sparkles, Download, Paintbrush, Loader2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductQuickView } from '@/components/shop/ProductQuickView';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  product_type: 'physical' | 'digital' | 'service';
  category: string;
  in_stock: boolean;
  member_only: boolean;
}

export default function MemberShop() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const { addToCart, itemCount } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    fetchProducts();
    if (user) fetchWishlist();
  }, [user]);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('member_only', true)
      .order('created_at', { ascending: false });
    
    setProducts((data as Product[]) || []);
    setIsLoading(false);
  };

  const fetchWishlist = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('wishlist')
      .select('product_id')
      .eq('user_id', user.id);
    
    setWishlist(data?.map(w => w.product_id) || []);
  };

  const toggleWishlist = async (productId: string) => {
    if (!user) return;
    
    const isInWishlist = wishlist.includes(productId);
    
    if (isInWishlist) {
      await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);
      setWishlist(prev => prev.filter(id => id !== productId));
      toast({ title: t.removedFromWishlistShort });
    } else {
      await supabase
        .from('wishlist')
        .insert({ user_id: user.id, product_id: productId });
      setWishlist(prev => [...prev, productId]);
      toast({ title: t.addedToWishlist });
    }
  };

  const handleAddToCart = async (product: Product) => {
    setAddingToCart(product.id);
    await addToCart(product.id);
    setAddingToCart(null);
  };

  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];
  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'digital': return <Download className="h-3 w-3" />;
      case 'service': return <Sparkles className="h-3 w-3" />;
      default: return <Package className="h-3 w-3" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      physical: 'bg-secondary text-secondary-foreground',
      digital: 'bg-accent text-accent-foreground',
      service: 'bg-primary/20 text-primary'
    };
    return styles[type] || styles.physical;
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
            <h1 className="font-display text-5xl lg:text-6xl font-medium mb-4">{t.shopTitle}</h1>
            <p className="text-muted-foreground font-body text-lg max-w-2xl">
              {t.shopDescription}
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/custom-order">
              <Button variant="outline" className="gap-2">
                <Paintbrush className="h-4 w-4" />
                {t.requestCustomWork}
              </Button>
            </Link>
            <Link to="/checkout">
              <Button className="gap-2 relative">
                <ShoppingCart className="h-4 w-4" />
                {t.cart}
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 overflow-x-auto pb-2"
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "px-5 py-2.5 rounded-full font-body text-sm whitespace-nowrap transition-all",
                selectedCategory === category
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </motion.div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-3xl overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-secondary" />
                <div className="p-6 space-y-3">
                  <div className="h-6 bg-secondary rounded w-3/4" />
                  <div className="h-4 bg-secondary rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group bg-card border border-border rounded-3xl overflow-hidden hover:border-primary/50 transition-all duration-500 cursor-pointer"
                onClick={() => setQuickViewProduct(product)}
              >
                <div className="aspect-[4/3] relative overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <span className={cn(
                    "absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                    getTypeBadge(product.product_type)
                  )}>
                    {getTypeIcon(product.product_type)}
                    {product.product_type}
                  </span>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(product.id);
                    }}
                    className={cn(
                      "absolute top-4 right-4 p-2.5 rounded-full transition-all",
                      wishlist.includes(product.id)
                        ? "bg-destructive text-destructive-foreground"
                        : "bg-background/80 text-muted-foreground hover:text-destructive"
                    )}
                  >
                    <Heart className={cn("h-4 w-4", wishlist.includes(product.id) && "fill-current")} />
                  </button>
                  
                  {/* Quick View Indicator */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/40">
                    <div className="bg-background/90 px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium">
                      <Eye className="h-4 w-4" />
                      {t.quickView}
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <p className="text-xs text-muted-foreground font-body mb-1">{product.category || t.uncategorized}</p>
                  <h3 className="font-display text-xl font-medium mb-2">{product.name}</h3>
                  <p className="text-muted-foreground text-sm font-body line-clamp-2 mb-6">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-display text-3xl font-medium">€{product.price}</span>
                    <Button 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      className="rounded-full px-5"
                      disabled={addingToCart === product.id || !product.in_stock}
                    >
                      {addingToCart === product.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          {product.in_stock ? t.addToCart : t.outOfStock}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Custom Order Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 p-8 md:p-12 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
        >
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Paintbrush className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="font-display text-2xl font-medium mb-2">
                {t.needSomethingCustom}
              </h2>
              <p className="text-muted-foreground max-w-lg">
                {t.customWorkDescription}
              </p>
            </div>
            <Link to="/custom-order">
              <Button size="lg" className="flex-shrink-0">
                {t.requestCustomWork}
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Quick View Modal */}
        <ProductQuickView
          product={quickViewProduct}
          isOpen={!!quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          isInWishlist={quickViewProduct ? wishlist.includes(quickViewProduct.id) : false}
          onToggleWishlist={toggleWishlist}
          onAddToCart={handleAddToCart}
          isAddingToCart={addingToCart === quickViewProduct?.id}
        />
      </div>
    </MemberLayout>
  );
}
