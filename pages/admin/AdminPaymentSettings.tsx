import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2,
  Save,
  Building2,
  Link as LinkIcon,
  Crown,
} from 'lucide-react';

interface PaymentSettings {
  id: string;
  bank_beneficiary: string;
  bank_iban: string;
  bank_bic: string;
  bank_name: string;
  default_revolut_link: string | null;
  premium_payment_link: string | null;
}

export default function AdminPaymentSettings() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [formData, setFormData] = useState({
    bank_beneficiary: '',
    bank_iban: '',
    bank_bic: '',
    bank_name: '',
    default_revolut_link: '',
    premium_payment_link: '',
  });

  useEffect(() => {
    if (isAdmin) {
      fetchSettings();
    }
  }, [isAdmin]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
        setFormData({
          bank_beneficiary: data.bank_beneficiary || '',
          bank_iban: data.bank_iban || '',
          bank_bic: data.bank_bic || '',
          bank_name: data.bank_name || '',
          default_revolut_link: data.default_revolut_link || '',
          premium_payment_link: data.premium_payment_link || '',
        });
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
      toast({
        title: "Error",
        description: "Failed to load payment settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (settings) {
        // Update existing settings
        const { error } = await supabase
          .from('payment_settings')
          .update({
            bank_beneficiary: formData.bank_beneficiary,
            bank_iban: formData.bank_iban,
            bank_bic: formData.bank_bic,
            bank_name: formData.bank_name,
            default_revolut_link: formData.default_revolut_link || null,
            premium_payment_link: formData.premium_payment_link || null,
          })
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        // Insert new settings
        const { error } = await supabase
          .from('payment_settings')
          .insert({
            bank_beneficiary: formData.bank_beneficiary,
            bank_iban: formData.bank_iban,
            bank_bic: formData.bank_bic,
            bank_name: formData.bank_name,
            default_revolut_link: formData.default_revolut_link || null,
            premium_payment_link: formData.premium_payment_link || null,
          });

        if (error) throw error;
      }

      toast({
        title: "Settings saved",
        description: "Payment settings have been updated successfully.",
      });

      fetchSettings();
    } catch (error) {
      console.error('Error saving payment settings:', error);
      toast({
        title: "Error",
        description: "Failed to save payment settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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
      <div className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-light tracking-tight mb-2">
          Payment Settings
        </h1>
        <p className="text-muted-foreground font-body">
          Configure bank transfer details and payment links
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-8 max-w-2xl">
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-xl font-medium">Bank Transfer Details</h2>
                <p className="text-sm text-muted-foreground">These details are shown to customers who choose bank transfer</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bank_beneficiary">Beneficiary Name</Label>
                <Input
                  id="bank_beneficiary"
                  value={formData.bank_beneficiary}
                  onChange={(e) => setFormData({ ...formData, bank_beneficiary: e.target.value })}
                  placeholder="e.g., Kim Magnus Linder"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_iban">IBAN</Label>
                <Input
                  id="bank_iban"
                  value={formData.bank_iban}
                  onChange={(e) => setFormData({ ...formData, bank_iban: e.target.value })}
                  placeholder="e.g., LT91 3250 0314 3638 0880"
                  className="font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank_bic">BIC/SWIFT</Label>
                  <Input
                    id="bank_bic"
                    value={formData.bank_bic}
                    onChange={(e) => setFormData({ ...formData, bank_bic: e.target.value })}
                    placeholder="e.g., REVOLT21"
                    className="font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input
                    id="bank_name"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    placeholder="e.g., Revolut Bank UAB"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <LinkIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-xl font-medium">Default Revolut Link</h2>
                <p className="text-sm text-muted-foreground">Default payment link for online payments</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_revolut_link">Revolut Payment Link</Label>
              <Input
                id="default_revolut_link"
                value={formData.default_revolut_link}
                onChange={(e) => setFormData({ ...formData, default_revolut_link: e.target.value })}
                placeholder="https://checkout.revolut.com/pay/..."
              />
              <p className="text-xs text-muted-foreground">
                This is the default link used for "Pay Online" option. You can override this per-order in the orders page.
              </p>
            </div>
          </div>

          {/* Premium Upgrade Link */}
          <div className="bg-card border border-amber-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Crown className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h2 className="font-display text-xl font-medium">Premium Upgrade Link</h2>
                <p className="text-sm text-muted-foreground">Payment link for premium membership upgrades</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="premium_payment_link">Payment Link URL</Label>
              <Input
                id="premium_payment_link"
                value={formData.premium_payment_link}
                onChange={(e) => setFormData({ ...formData, premium_payment_link: e.target.value })}
                placeholder="https://checkout.revolut.com/pay/... or Stripe/PayPal link"
              />
              <p className="text-xs text-muted-foreground">
                This link is used when members click "Upgrade to Premium". Supports Revolut, Stripe, PayPal, or any payment URL.
              </p>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} size="lg" className="w-full">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      )}
    </AdminLayout>
  );
}