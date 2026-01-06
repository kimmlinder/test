import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';
import { ShoppingBag, Star, Plus, Pencil, Trash2, Loader2, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { FileUpload } from '@/components/admin/FileUpload';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import heroImage from '@/assets/hero-1.jpg';
import presetsImage from '@/assets/presets-product.jpg';

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
  digital_file_url: string | null;
}

interface Category {
  id: string;
  name: string;
}

type ProductType = 'physical' | 'digital' | 'service';

const emptyProduct = {
  name: '',
  description: '',
  price: 0,
  category_id: '',
  image_url: '',
  product_type: 'physical' as ProductType,
  in_stock: true,
  stock_quantity: 0,
  revolut_link: '',
  member_only: false,
  digital_file_url: '',
};

const Shop = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { addToCart } = useCart();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState(emptyProduct);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  
  // Newsletter subscription state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('member_only', false)
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
      digital_file_url: product.digital_file_url || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Product name is required');
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
        digital_file_url: formData.product_type === 'digital' ? (formData.digital_file_url?.trim() || null) : null,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast.success('Product updated');
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);

        if (error) throw error;
        toast.success('Product created');
      }

      setIsDialogOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
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
      toast.success('Product deleted');
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart(product.id);
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const scrollToProducts = () => {
    document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNewsletterSubscribe = async () => {
    if (!newsletterEmail.trim()) {
      toast.error('Please enter your email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newsletterEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSubscribing(true);
    const emailToSubscribe = newsletterEmail.trim().toLowerCase();
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email: emailToSubscribe });

      if (error) {
        if (error.code === '23505') {
          toast.info('You are already subscribed!');
        } else {
          throw error;
        }
      } else {
        // Send welcome email
        supabase.functions.invoke('send-newsletter-welcome', {
          body: { email: emailToSubscribe }
        }).catch(err => console.error('Failed to send welcome email:', err));
        
        toast.success('Successfully subscribed to our newsletter!');
        setNewsletterEmail('');
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Shop hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        </div>
        
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="font-body text-sm uppercase tracking-widest text-primary mb-4 block">
              Premium Digital Products
            </span>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-medium mb-6">
              Creative <span className="text-primary">Resources</span>
            </h1>
            <p className="font-body text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Elevate your projects with our curated collection of templates, presets, and design assets crafted by our creative team.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button size="lg" onClick={scrollToProducts} className="gap-2">
                Browse Products
                <ChevronDown className="h-4 w-4" />
              </Button>
              {isAdmin && (
                <Button size="lg" variant="outline" onClick={openCreateDialog} className="gap-2">
                  <Plus className="h-5 w-5" />
                  Add Product
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <main className="py-24" id="products-section">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl md:text-5xl font-medium mb-4">
              Our Products
            </h2>
            <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto">
              High-quality digital assets to supercharge your creative workflow.
            </p>
          </motion.div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">No products available yet.</p>
              {isAdmin && (
                <Button onClick={openCreateDialog} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Add Your First Product
                </Button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group relative"
                >
                  {/* Admin Controls */}
                  {isAdmin && (
                    <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        onClick={() => {
                          setProductToDelete(product);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <div className="relative aspect-square rounded-2xl overflow-hidden mb-4">
                    {product.image_url ? (
                      <img
                        src={product.name.toLowerCase() === 'presets' ? presetsImage : product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-secondary flex items-center justify-center">
                        <ShoppingBag className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors flex items-center justify-center">
                      <button 
                        onClick={() => handleAddToCart(product)}
                        disabled={!product.in_stock}
                        className="w-14 h-14 rounded-full bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 disabled:bg-muted disabled:cursor-not-allowed"
                      >
                        <ShoppingBag className="h-6 w-6 text-primary-foreground" />
                      </button>
                    </div>
                    {product.category && (
                      <div className="absolute top-4 left-4">
                        <span className="font-body text-xs px-3 py-1 rounded-full bg-background/90 backdrop-blur-sm">
                          {product.category}
                        </span>
                      </div>
                    )}
                    {!product.in_stock && (
                      <div className="absolute bottom-4 left-4">
                        <span className="font-body text-xs px-3 py-1 rounded-full bg-destructive text-destructive-foreground">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < 4 ? 'fill-primary text-primary' : 'text-muted'}`}
                      />
                    ))}
                  </div>
                  <h3 className="font-display text-xl font-medium mb-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  <p className="font-display text-2xl font-medium text-primary">
                    €{product.price}
                  </p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Coming Soon Banner */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-24 text-center p-12 rounded-3xl bg-card"
          >
            <h2 className="font-display text-3xl font-medium mb-4">
              More products coming soon
            </h2>
            <p className="font-body text-muted-foreground mb-8 max-w-lg mx-auto">
              Subscribe to our newsletter to be the first to know about new releases and exclusive offers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNewsletterSubscribe()}
                className="flex-1 px-6 py-3 rounded-full border border-border bg-transparent font-body text-sm focus:outline-none focus:border-primary"
              />
              <button 
                onClick={handleNewsletterSubscribe}
                disabled={subscribing}
                className="font-body text-sm bg-primary text-primary-foreground px-8 py-3 rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {subscribing ? 'Subscribing...' : 'Subscribe'}
              </button>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />

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
              />
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
                />
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock_quantity">Stock Quantity</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  min="0"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product_type">Type</Label>
                <Select
                  value={formData.product_type}
                  onValueChange={(value) => setFormData({ ...formData, product_type: value as ProductType })}
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
            </div>

            <div className="space-y-2">
              <Label>Product Image</Label>
              <ImageUpload
                value={formData.image_url}
                onChange={(url) => setFormData({ ...formData, image_url: url })}
                bucket="product-images"
              />
            </div>

            {formData.product_type === 'digital' && (
              <div className="space-y-2">
                <Label>Digital File</Label>
                <FileUpload
                  value={formData.digital_file_url}
                  onChange={(url) => setFormData({ ...formData, digital_file_url: url })}
                  label="Product File"
                />
                <p className="text-xs text-muted-foreground">
                  Upload the file that customers will receive after purchase (ZIP, PDF, etc.)
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="revolut_link">Revolut Payment Link</Label>
              <Input
                id="revolut_link"
                value={formData.revolut_link}
                onChange={(e) => setFormData({ ...formData, revolut_link: e.target.value })}
                placeholder="https://checkout.revolut.com/pay/..."
              />
              <p className="text-xs text-muted-foreground">Optional: Custom Revolut link for this product</p>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="in_stock"
                checked={formData.in_stock}
                onCheckedChange={(checked) => setFormData({ ...formData, in_stock: checked })}
              />
              <Label htmlFor="in_stock">In Stock</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="member_only"
                checked={formData.member_only}
                onCheckedChange={(checked) => setFormData({ ...formData, member_only: checked })}
              />
              <Label htmlFor="member_only">Member Only</Label>
              <span className="text-xs text-muted-foreground">(Only visible in member shop)</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingProduct ? 'Save Changes' : 'Add Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
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
            <Button 
              variant="destructive" 
              onClick={handleDelete}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Shop;