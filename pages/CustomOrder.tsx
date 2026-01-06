import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Paintbrush, ArrowLeft, ArrowDown } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import hero4 from '@/assets/hero-4.jpg';
import { z } from 'zod';

const customOrderSchema = z.object({
  customer_name: z.string().trim().min(1, "Name is required").max(100),
  customer_phone: z.string().trim().min(1, "Phone number is required").max(20),
  shipping_address: z.string().trim().max(500).optional(),
  project_type: z.string().min(1, "Please select a project type"),
  project_description: z.string().trim().min(10, "Please describe your project (at least 10 characters)").max(2000),
  budget_range: z.string().optional(),
  timeline: z.string().optional(),
  special_instructions: z.string().max(1000).optional(),
});

type CustomOrderFormData = z.infer<typeof customOrderSchema>;

const projectTypes = [
  { value: 'branding', label: 'Brand Identity & Logo Design' },
  { value: 'web-design', label: 'Website Design' },
  { value: 'print', label: 'Print Design (Posters, Flyers, etc.)' },
  { value: 'packaging', label: 'Packaging Design' },
  { value: 'motion', label: 'Motion Graphics & Animation' },
  { value: 'illustration', label: 'Custom Illustration' },
  { value: 'social-media', label: 'Social Media Content' },
  { value: 'other', label: 'Other (Describe below)' },
];

const budgetRanges = [
  { value: 'under-500', label: 'Under $500' },
  { value: '500-1000', label: '$500 - $1,000' },
  { value: '1000-2500', label: '$1,000 - $2,500' },
  { value: '2500-5000', label: '$2,500 - $5,000' },
  { value: 'over-5000', label: 'Over $5,000' },
  { value: 'flexible', label: 'Flexible / Not sure' },
];

const timelines = [
  { value: 'urgent', label: 'Urgent (1-2 weeks)' },
  { value: 'standard', label: 'Standard (2-4 weeks)' },
  { value: 'relaxed', label: 'Relaxed (1-2 months)' },
  { value: 'flexible', label: 'Flexible' },
];

export default function CustomOrder() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<CustomOrderFormData>({
    customer_name: '',
    customer_phone: '',
    shipping_address: '',
    project_type: '',
    project_description: '',
    budget_range: '',
    timeline: '',
    special_instructions: '',
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = customOrderSchema.safeParse(formData);
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
      // Build description with all project details
      const projectLabel = projectTypes.find(p => p.value === formData.project_type)?.label || formData.project_type;
      const budgetLabel = budgetRanges.find(b => b.value === formData.budget_range)?.label || 'Not specified';
      const timelineLabel = timelines.find(t => t.value === formData.timeline)?.label || 'Not specified';
      
      const notes = `**Custom Project Request**

**Project Type:** ${projectLabel}
**Budget Range:** ${budgetLabel}
**Timeline:** ${timelineLabel}

**Project Description:**
${formData.project_description}

${formData.special_instructions ? `**Additional Notes:**\n${formData.special_instructions}` : ''}`;

      // Create custom order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: 0, // To be determined after quote
          status: 'pending',
          order_type: 'custom',
          customer_name: formData.customer_name.trim(),
          customer_phone: formData.customer_phone.trim(),
          shipping_address: formData.shipping_address?.trim() || null,
          notes,
          special_instructions: formData.special_instructions?.trim() || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Add initial timeline entry
      await supabase
        .from('order_timeline')
        .insert({
          order_id: order.id,
          status: 'pending',
          message: 'Custom project request submitted - awaiting review and quote',
        });

      toast({
        title: "Request submitted!",
        description: "We'll review your project and get back to you with a quote.",
      });

      navigate(`/member/orders/${order.id}`);
    } catch (error) {
      console.error('Error submitting custom order:', error);
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToForm = () => {
    document.getElementById('custom-order-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col justify-center items-center text-center pt-20 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={hero4}
            alt="Custom order hero"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="px-6 relative z-10"
        >
          <p className="font-body text-sm text-muted-foreground uppercase tracking-wider mb-4">
            Bespoke Creations
          </p>
          <h1 className="font-display text-7xl md:text-9xl font-medium mb-6">
            custom
          </h1>
          <div className="font-body text-lg text-muted-foreground max-w-xl mx-auto">
            <p>Tell us about your vision</p>
            <p className="font-display italic">and we'll bring it to life</p>
          </div>
        </motion.div>

        {/* Hero Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="absolute bottom-12 left-0 right-0 px-6 lg:px-12 flex items-center justify-between max-w-7xl mx-auto w-full z-10"
        >
          <button 
            onClick={scrollToForm}
            className="flex items-center gap-3 font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="w-10 h-10 rounded-full border border-foreground/20 flex items-center justify-center">
              <ArrowDown className="h-4 w-4" />
            </div>
            <span>Start Your Request</span>
          </button>
          <span className="font-body text-sm text-muted-foreground">
            Custom Projects
          </span>
        </motion.div>
      </section>

      <main id="custom-order-form" className="pb-20">
        <div className="max-w-3xl mx-auto px-6 lg:px-12 pt-16 border-t border-border">
          <Link 
            to="/member/shop" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Shop
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Paintbrush className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-light tracking-tight mb-4">
              Request Custom Work
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Tell us about your project and we'll create something amazing together. 
              We'll review your request and get back to you with a personalized quote.
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit}
            className="space-y-8 bg-card p-8 rounded-2xl border border-border"
          >
            {/* Contact Information */}
            <div>
              <h2 className="font-display text-xl font-medium mb-4">Contact Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
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
              </div>

              <div className="space-y-2 mt-4">
                <Label htmlFor="shipping_address">Address (Optional)</Label>
                <Textarea
                  id="shipping_address"
                  value={formData.shipping_address}
                  onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                  placeholder="Your address (if physical deliverables are needed)"
                  rows={2}
                />
              </div>
            </div>

            {/* Project Details */}
            <div>
              <h2 className="font-display text-xl font-medium mb-4">Project Details</h2>
              
              <div className="space-y-2 mb-4">
                <Label htmlFor="project_type">Project Type *</Label>
                <Select
                  value={formData.project_type}
                  onValueChange={(value) => setFormData({ ...formData, project_type: value })}
                >
                  <SelectTrigger className={errors.project_type ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select a project type" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.project_type && <p className="text-sm text-destructive">{errors.project_type}</p>}
              </div>

              <div className="space-y-2 mb-4">
                <Label htmlFor="project_description">Project Description *</Label>
                <Textarea
                  id="project_description"
                  value={formData.project_description}
                  onChange={(e) => setFormData({ ...formData, project_description: e.target.value })}
                  placeholder="Describe your project in detail. What are you looking for? What's the purpose? Any specific requirements or preferences?"
                  rows={6}
                  className={errors.project_description ? 'border-destructive' : ''}
                />
                {errors.project_description && <p className="text-sm text-destructive">{errors.project_description}</p>}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget_range">Budget Range</Label>
                  <Select
                    value={formData.budget_range}
                    onValueChange={(value) => setFormData({ ...formData, budget_range: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select budget range" />
                    </SelectTrigger>
                    <SelectContent>
                      {budgetRanges.map((budget) => (
                        <SelectItem key={budget.value} value={budget.value}>
                          {budget.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeline">Timeline</Label>
                  <Select
                    value={formData.timeline}
                    onValueChange={(value) => setFormData({ ...formData, timeline: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeline" />
                    </SelectTrigger>
                    <SelectContent>
                      {timelines.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="special_instructions">Additional Notes</Label>
              <Textarea
                id="special_instructions"
                value={formData.special_instructions}
                onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                placeholder="Any other information, references, inspiration, or special requirements..."
                rows={4}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </motion.form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
