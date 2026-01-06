import { Heart, ShoppingCart, X, Package, Download, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  product_type: 'physical' | 'digital' | 'service';
  category: string;
  in_stock: boolean;
}

interface ProductQuickViewProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  isInWishlist: boolean;
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product) => void;
  isAddingToCart: boolean;
}

export function ProductQuickView({
  product,
  isOpen,
  onClose,
  isInWishlist,
  onToggleWishlist,
  onAddToCart,
  isAddingToCart,
}: ProductQuickViewProps) {
  if (!product) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'digital': return <Download className="h-4 w-4" />;
      case 'service': return <Sparkles className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-card border-border">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className="grid md:grid-cols-2 gap-0">
          {/* Image */}
          <div className="aspect-square relative bg-secondary">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <span className={cn(
              "absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5",
              getTypeBadge(product.product_type)
            )}>
              {getTypeIcon(product.product_type)}
              {product.product_type}
            </span>
          </div>
          
          {/* Details */}
          <div className="p-8 flex flex-col">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground font-body mb-2 uppercase tracking-wider">
                {product.category || 'Uncategorized'}
              </p>
              <h2 className="font-display text-3xl font-medium mb-4">{product.name}</h2>
              <p className="text-muted-foreground font-body leading-relaxed mb-6">
                {product.description}
              </p>
              
              <div className="flex items-center gap-3 mb-8">
                <span className="font-display text-4xl font-medium">€{product.price}</span>
                {!product.in_stock && (
                  <span className="px-3 py-1 bg-destructive/20 text-destructive text-sm rounded-full">
                    Out of Stock
                  </span>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <Button
                size="lg"
                className="w-full"
                onClick={() => onAddToCart(product)}
                disabled={isAddingToCart || !product.in_stock}
              >
                {isAddingToCart ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => onToggleWishlist(product.id)}
              >
                <Heart className={cn(
                  "h-5 w-5 mr-2",
                  isInWishlist && "fill-current text-destructive"
                )} />
                {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}