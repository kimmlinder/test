import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface LowStockProduct {
  id: string;
  name: string;
  stock_quantity: number;
}

const LOW_STOCK_THRESHOLD = 10;

export function LowStockAlert() {
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLowStockProducts();
  }, []);

  const fetchLowStockProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, stock_quantity')
        .lt('stock_quantity', LOW_STOCK_THRESHOLD)
        .order('stock_quantity', { ascending: true })
        .limit(5);

      if (error) throw error;
      setLowStockProducts(data || []);
    } catch (error) {
      console.error('Error fetching low stock products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || lowStockProducts.length === 0) {
    return null;
  }

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 mb-8">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-amber-500/20">
          <AlertTriangle className="h-6 w-6 text-amber-500" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-lg font-medium text-amber-500 mb-2">
            Low Stock Alert
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's' : ''} running low on inventory
          </p>
          <div className="space-y-2">
            {lowStockProducts.map((product) => (
              <div 
                key={product.id}
                className="flex items-center justify-between bg-background/50 rounded-lg px-4 py-2"
              >
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{product.name}</span>
                </div>
                <span className={`text-sm font-bold ${
                  product.stock_quantity === 0 
                    ? 'text-destructive' 
                    : 'text-amber-500'
                }`}>
                  {product.stock_quantity} left
                </span>
              </div>
            ))}
          </div>
          <Link to="/admin/products">
            <Button variant="outline" size="sm" className="mt-4">
              Manage Inventory
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
