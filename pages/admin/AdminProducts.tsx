import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { 
  Package, 
  Loader2,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200, "Name must be less than 200 characters"),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
  price: z.number().min(0, "Price must be positive"),
  category_id: z.string().uuid().optional().or(z.literal('')),
  image_url: z.string().url("Must be a valid URL").max(500, "URL must be less than 500 characters").optional().or(z.literal('')),
  product_type: z.enum(['physical', 'digital', 'service']),
  in_stock: z.boolean(),
  stock_quantity: z.number().min(0, "Stock quantity must be 0 or greater"),
  revolut_link: z.string().url("Must be a valid URL").max(500, "URL must be less than 500 characters").optional().or(z.literal('')),
  member_only: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  category_id: string | null;
  image_url: string | null;
  in_stock: boolean;
  product_type: 'physical' | 'digital' | 'service';
  stock_quantity: number;
  revolut_link: string | null;
  member_only: boolean;
}

interface Category {
  id: string;
  name: string;
}

const emptyProduct: ProductFormData = {
  name: '',
  description: '',
  price: 0,
  category_id: '',
  image_url: '',
  product_type: 'physical',
  in_stock: true,
  stock_quantity: 0,
  revolut_link: '',
  member_only: false,
};

export default function AdminProducts() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyProduct);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const LOW_STOCK_THRESHOLD = 10;

  useEffect(() => {
    if (isAdmin) {
      fetchProducts();
      fetchCategories();
    }
  }, [isAdmin]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const productsWithCategory = data?.map(p => ({
        ...p,
        category: p.categories?.name || null,
      })) || [];
      setProducts(productsWithCategory);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const openCreateDialog = () => {
    setEditingProduct(null);
    setFormData(emptyProduct);
    setErrors({});
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      category_id: product.category_id || '',
      image_url: product.image_url || '',
      product_type: product.product_type,
      in_stock: product.in_stock,
      stock_quantity: product.stock_quantity || 0,
      revolut_link: product.revolut_link || '',
      member_only: product.member_only,
    });
    setErrors({});
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    const result = productSchema.safeParse(formData);
    
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

    setSaving(true);
    try {
      const productData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        price: formData.price,
        category_id: formData.category_id || null,
        image_url: formData.image_url?.trim() || null,
        product_type: formData.product_type,
        in_stock: formData.in_stock,
        stock_quantity: formData.stock_quantity,
        revolut_link: formData.revolut_link?.trim() || null,
        member_only: formData.member_only,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;

        toast({
          title: "Product updated",
          description: "The product has been updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);

        if (error) throw error;

        toast({
          title: "Product created",
          description: "The new product has been added.",
        });
      }

      setIsDialogOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: "Failed to save product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete.id);

      if (error) throw error;

      toast({
        title: "Product deleted",
        description: "The product has been removed.",
      });

      setDeleteDialogOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-light tracking-tight mb-2">
            Manage Products
          </h1>
          <p className="text-muted-foreground font-body text-sm md:text-base">
            Add, edit, and manage your products
          </p>
        </div>
        <Button className="gap-2 w-full sm:w-auto" onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left px-6 py-4 font-body text-sm font-medium text-muted-foreground">Product</th>
                  <th className="text-left px-6 py-4 font-body text-sm font-medium text-muted-foreground">Category</th>
                  <th className="text-left px-6 py-4 font-body text-sm font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-6 py-4 font-body text-sm font-medium text-muted-foreground">Price</th>
                  <th className="text-left px-6 py-4 font-body text-sm font-medium text-muted-foreground">Stock</th>
                  <th className="text-left px-6 py-4 font-body text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-6 py-4 font-body text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <p className="font-medium">{product.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {product.category || 'Uncategorized'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary text-muted-foreground">
                        {product.product_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      €{product.price}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${
                        product.stock_quantity < LOW_STOCK_THRESHOLD 
                          ? product.stock_quantity === 0 
                            ? 'text-destructive' 
                            : 'text-amber-500'
                          : 'text-foreground'
                      }`}>
                        {product.stock_quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.in_stock 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {product.in_stock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(product)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setProductToDelete(product);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      No products yet. Click "Add Product" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="lg:hidden divide-y divide-border">
            {products.map((product) => (
              <div key={product.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.category || 'Uncategorized'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(product)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setProductToDelete(product);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary text-muted-foreground">
                      {product.product_type}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.in_stock 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {product.in_stock ? 'In Stock' : 'Out'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm ${
                      product.stock_quantity < LOW_STOCK_THRESHOLD 
                        ? product.stock_quantity === 0 
                          ? 'text-destructive' 
                          : 'text-amber-500'
                        : 'text-muted-foreground'
                    }`}>
                      Stock: {product.stock_quantity}
                    </span>
                    <span className="font-semibold">€{product.price}</span>
                  </div>
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <div className="px-6 py-12 text-center text-muted-foreground">
                No products yet. Click "Add Product" to create one.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Product name"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Product description"
                rows={3}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className={errors.price ? 'border-destructive' : ''}
                />
                {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category_id || 'uncategorized'}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value === 'uncategorized' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uncategorized">Uncategorized</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock_quantity">Stock Quantity</Label>
              <Input
                id="stock_quantity"
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                className={errors.stock_quantity ? 'border-destructive' : ''}
              />
              {errors.stock_quantity && <p className="text-sm text-destructive">{errors.stock_quantity}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_type">Product Type *</Label>
              <Select
                value={formData.product_type}
                onValueChange={(value: 'physical' | 'digital' | 'service') => 
                  setFormData({ ...formData, product_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="physical">Physical</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Product Image</Label>
              <ImageUpload
                value={formData.image_url || ''}
                onChange={(url) => setFormData({ ...formData, image_url: url })}
                disabled={saving}
                bucket="product-images"
              />
              {errors.image_url && <p className="text-sm text-destructive">{errors.image_url}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="revolut_link">Revolut Payment Link</Label>
              <Input
                id="revolut_link"
                value={formData.revolut_link || ''}
                onChange={(e) => setFormData({ ...formData, revolut_link: e.target.value })}
                placeholder="https://checkout.revolut.com/pay/..."
                className={errors.revolut_link ? 'border-destructive' : ''}
              />
              <p className="text-xs text-muted-foreground">Optional: Custom Revolut link for this product</p>
              {errors.revolut_link && <p className="text-sm text-destructive">{errors.revolut_link}</p>}
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <Label htmlFor="in_stock">In Stock</Label>
                <p className="text-sm text-muted-foreground">Is this product available?</p>
              </div>
              <Switch
                id="in_stock"
                checked={formData.in_stock}
                onCheckedChange={(checked) => setFormData({ ...formData, in_stock: checked })}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <Label htmlFor="member_only">Member Only</Label>
                <p className="text-sm text-muted-foreground">Only visible in member shop (social media, websites, etc.)</p>
              </div>
              <Switch
                id="member_only"
                checked={formData.member_only}
                onCheckedChange={(checked) => setFormData({ ...formData, member_only: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
