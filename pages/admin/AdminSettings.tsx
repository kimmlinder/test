import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Save, 
  Loader2, 
  Camera, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  Clock, 
  Sun, 
  Moon, 
  CreditCard, 
  Crown, 
  Building2, 
  Check, 
  X, 
  Infinity, 
  ArrowRight 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function AdminSettings() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Password change state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [profile, setProfile] = useState({
    full_name: '',
    avatar_url: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    postal_code: '',
  });

  const [notifications, setNotifications] = useState({
    email_orders: true,
    email_promotions: false,
    push_orders: true,
    push_promotions: false,
  });

  useEffect(() => {
    if (user && isAdmin) {
      fetchProfile();
    }
  }, [user, isAdmin]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setProfile({
          full_name: data.full_name || '',
          avatar_url: data.avatar_url || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          country: data.country || '',
          postal_code: data.postal_code || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated.",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          address: profile.address,
          city: profile.city,
          country: profile.country,
          postal_code: profile.postal_code,
        })
        .eq('id', user?.id);
      
      if (error) throw error;
      
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      
      setPasswordDialogOpen(false);
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to change password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || user?.email?.charAt(0).toUpperCase() || 'A';
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto px-6 lg:px-12 py-16">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Theme cards data for appearance tab
  const themeCards = [
    { id: 'purple', name: 'Purple Haze', colors: ['#9333ea', '#a855f7', '#6366f1'], selected: true },
    { id: 'ocean', name: 'Ocean Blue', colors: ['#0ea5e9', '#38bdf8', '#06b6d4'], selected: false },
    { id: 'sunset', name: 'Sunset', colors: ['#f97316', '#fb923c', '#ef4444'], selected: false },
    { id: 'forest', name: 'Forest', colors: ['#22c55e', '#4ade80', '#10b981'], selected: false },
    { id: 'rose', name: 'Rose', colors: ['#f43f5e', '#fb7185', '#ec4899'], selected: false },
    { id: 'sky', name: 'Sky Tides', colors: ['#0ea5e9', '#22d3ee', '#06b6d4'], selected: false },
  ];

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto px-6 lg:px-12 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-2">
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-primary">
              Admin Settings
            </h1>
            <span className="px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded-full">
              Admin
            </span>
          </div>
          <p className="text-muted-foreground font-body">
            Customize your experience
          </p>
        </motion.div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 w-full bg-transparent gap-2 md:gap-3 h-auto p-0 mb-8">
            <TabsTrigger 
              value="profile" 
              className={cn(
                "flex items-center justify-center gap-2 py-3 px-2 md:px-4 rounded-xl border transition-all",
                activeTab === 'profile' 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-card border-border hover:bg-muted/50"
              )}
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger 
              value="appearance" 
              className={cn(
                "flex items-center justify-center gap-2 py-3 px-2 md:px-4 rounded-xl border transition-all",
                activeTab === 'appearance' 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-card border-border hover:bg-muted/50"
              )}
            >
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className={cn(
                "flex items-center justify-center gap-2 py-3 px-2 md:px-4 rounded-xl border transition-all",
                activeTab === 'notifications' 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-card border-border hover:bg-muted/50"
              )}
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className={cn(
                "flex items-center justify-center gap-2 py-3 px-2 md:px-4 rounded-xl border transition-all",
                activeTab === 'security' 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-card border-border hover:bg-muted/50"
              )}
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger 
              value="billing" 
              className={cn(
                "flex items-center justify-center gap-2 py-3 px-2 md:px-4 rounded-xl border transition-all",
                activeTab === 'billing' 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-card border-border hover:bg-muted/50"
              )}
            >
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Billing</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8"
            >
              <div className="mb-6">
                <h2 className="font-display text-xl font-semibold mb-1">Profile Information</h2>
                <p className="text-sm text-muted-foreground">Update your personal info</p>
              </div>

              {/* Avatar and User Info */}
              <div className="flex items-center gap-4 mb-8">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-4 border-primary/20">
                    <AvatarImage 
                      src={profile.avatar_url} 
                      alt={profile.full_name} 
                      className="object-cover"
                    />
                    <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                      {getInitials(profile.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Camera className="h-3 w-3" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-lg">{profile.full_name || 'Admin User'}</h3>
                    <span className="px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded-full">
                      Admin
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-500">Active Account</span>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Display Name</Label>
                  <Input
                    id="full_name"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder="Enter your full name"
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted/50"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    placeholder="123 Main Street"
                    className="bg-background/50"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={profile.city}
                      onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                      placeholder="City"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      value={profile.postal_code}
                      onChange={(e) => setProfile({ ...profile, postal_code: e.target.value })}
                      placeholder="10001"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={profile.country}
                      onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                      placeholder="Country"
                      className="bg-background/50"
                    />
                  </div>
                </div>

                <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            </motion.div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8 relative overflow-hidden min-h-[400px]"
            >
              <div className="space-y-6">
                {/* Display Mode */}
                <div>
                  <div className="mb-6">
                    <h2 className="font-display text-xl font-semibold mb-1">Display Mode</h2>
                    <p className="text-sm text-muted-foreground">Choose your theme</p>
                  </div>

                  <div className="flex gap-4">
                    <button className="flex items-center gap-3 px-6 py-3 rounded-xl border border-border bg-background/50 hover:bg-muted/50 transition-colors">
                      <Sun className="h-5 w-5" />
                      <span>Light</span>
                    </button>
                    <button className="flex items-center gap-3 px-6 py-3 rounded-xl border-2 border-primary bg-primary/10">
                      <Moon className="h-5 w-5 text-primary" />
                      <span className="text-primary font-medium">Dark</span>
                    </button>
                  </div>
                </div>

                {/* Color Theme */}
                <div>
                  <div className="mb-6">
                    <h2 className="font-display text-xl font-semibold mb-1">Color Theme</h2>
                    <p className="text-sm text-muted-foreground">Choose a color</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {themeCards.map((theme) => (
                      <div 
                        key={theme.id}
                        className={cn(
                          "relative rounded-xl p-4 cursor-pointer transition-all",
                          theme.selected 
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-background" 
                            : "hover:scale-105"
                        )}
                        style={{ 
                          background: `linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[1]}, ${theme.colors[2]})` 
                        }}
                      >
                        <span className="text-sm font-medium text-white drop-shadow-md">{theme.name}</span>
                        <div className="flex gap-1 mt-2">
                          {theme.colors.map((color, i) => (
                            <div 
                              key={i} 
                              className="w-4 h-4 rounded-full border-2 border-white/30"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        {theme.selected && (
                          <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-white" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Coming Soon Overlay */}
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                <div className="text-center">
                  <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium mb-3">
                    Coming Soon
                  </span>
                  <h3 className="font-display text-xl font-semibold mb-2">Theme Customization</h3>
                  <p className="text-sm text-muted-foreground">Enhanced Notifications</p>
                  <div className="flex items-center justify-center gap-2 mt-3 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Next Update</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8 relative overflow-hidden min-h-[400px]"
            >
              <div className="mb-6">
                <h2 className="font-display text-xl font-semibold mb-1">Notification Preferences</h2>
                <p className="text-sm text-muted-foreground">Choose your notifications</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Email Notifications</h3>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">Order Updates</p>
                      <p className="text-sm text-muted-foreground">Receive emails about order status</p>
                    </div>
                    <Switch
                      checked={notifications.email_orders}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, email_orders: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">System Alerts</p>
                      <p className="text-sm text-muted-foreground">Get notified about system updates</p>
                    </div>
                    <Switch
                      checked={notifications.email_promotions}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, email_promotions: checked })}
                    />
                  </div>
                </div>

                <div className="border-t border-border pt-6 space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Push Notifications</h3>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">New Orders</p>
                      <p className="text-sm text-muted-foreground">Get push notifications for new orders</p>
                    </div>
                    <Switch
                      checked={notifications.push_orders}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, push_orders: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">Low Stock Alerts</p>
                      <p className="text-sm text-muted-foreground">Receive alerts when products are low</p>
                    </div>
                    <Switch
                      checked={notifications.push_promotions}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, push_promotions: checked })}
                    />
                  </div>
                </div>
              </div>

              {/* Coming Soon Overlay */}
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                <div className="text-center">
                  <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium mb-3">
                    Coming Soon
                  </span>
                  <h3 className="font-display text-xl font-semibold mb-2">Theme Customization</h3>
                  <p className="text-sm text-muted-foreground">Enhanced Notifications</p>
                  <div className="flex items-center justify-center gap-2 mt-3 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Next Update</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8 relative overflow-hidden min-h-[400px]"
            >
              <div className="space-y-6">
                <div>
                  <div className="mb-6">
                    <h2 className="font-display text-xl font-semibold mb-1">Password</h2>
                    <p className="text-sm text-muted-foreground">Manage your password</p>
                  </div>

                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => setPasswordDialogOpen(true)}
                  >
                    <Lock className="h-4 w-4" />
                    Change Password
                  </Button>
                </div>

                <div className="border-t border-border pt-6">
                  <div className="mb-6">
                    <h2 className="font-display text-xl font-semibold mb-1">Two-Factor Authentication</h2>
                    <p className="text-sm text-muted-foreground">Add extra security to your account</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Enable 2FA</p>
                      <p className="text-sm text-muted-foreground">Use an authenticator app</p>
                    </div>
                    <Switch disabled />
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <div className="mb-6">
                    <h2 className="font-display text-xl font-semibold text-destructive mb-1">Danger Zone</h2>
                    <p className="text-sm text-muted-foreground">Irreversible actions</p>
                  </div>

                  <Button variant="destructive" className="gap-2">
                    Delete Account
                  </Button>
                  <p className="text-xs text-muted-foreground mt-3">
                    This action cannot be undone. All your data will be permanently deleted.
                  </p>
                </div>
              </div>

              {/* Coming Soon Overlay */}
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                <div className="text-center">
                  <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium mb-3">
                    Coming Soon
                  </span>
                  <h3 className="font-display text-xl font-semibold mb-2">Theme Customization</h3>
                  <p className="text-sm text-muted-foreground">Enhanced Notifications</p>
                  <div className="flex items-center justify-center gap-2 mt-3 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Next Update</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8 relative overflow-hidden min-h-[400px]"
            >
              <div className="mb-8">
                <h2 className="font-display text-xl font-semibold mb-1">Subscription Plans</h2>
                <p className="text-sm text-muted-foreground">Choose the plan that fits your needs</p>
              </div>

              <div className="grid md:grid-cols-3 gap-4 md:gap-6">
                {/* Free Plan */}
                <div className="bg-background/50 border border-border rounded-2xl p-6 relative">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display text-lg font-semibold">Free Plan</h3>
                    <span className="text-xs bg-muted px-2 py-1 rounded-full">Current Plan</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Get started with basic features</p>
                  
                  <div className="mb-6">
                    <span className="text-3xl font-bold">$0</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <p className="text-sm font-medium text-muted-foreground">What&apos;s included:</p>
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Basic Access</p>
                        <p className="text-xs text-muted-foreground">Limited features</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Order Management</p>
                        <p className="text-xs text-muted-foreground">Manage orders</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Basic Analytics</p>
                        <p className="text-xs text-muted-foreground">Simple reports</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <X className="h-4 w-4 text-muted-foreground/50 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground/70">Priority Support</p>
                        <p className="text-xs text-muted-foreground/50">Not Available</p>
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full gap-2" disabled>
                    <Check className="h-4 w-4" />
                    Currently on Free Plan
                  </Button>
                </div>

                {/* Premium Plan */}
                <div className="bg-gradient-to-b from-amber-500/10 to-amber-500/5 border-2 border-amber-500/30 rounded-2xl p-6 relative">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-5 w-5 text-amber-500" />
                    <h3 className="font-display text-lg font-semibold text-amber-500">Premium Plan</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Unlimited access to all features</p>
                  
                  <div className="mb-6">
                    <span className="text-3xl font-bold">$49</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <p className="text-sm font-medium text-amber-500">What&apos;s included:</p>
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Full Access</p>
                        <p className="text-xs text-muted-foreground">All features unlocked</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Advanced Analytics</p>
                        <div className="flex items-center gap-1">
                          <Infinity className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Unlimited</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Priority Support</p>
                        <p className="text-xs text-muted-foreground">24/7 access</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Custom Branding</p>
                        <p className="text-xs text-muted-foreground">White-label options</p>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white">
                    <Crown className="h-4 w-4" />
                    Upgrade to Premium
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Enterprise Plan */}
                <div className="bg-gradient-to-b from-sky-500/10 to-sky-500/5 border border-sky-500/30 rounded-2xl p-6 relative">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-5 w-5 text-sky-400" />
                    <h3 className="font-display text-lg font-semibold text-sky-400">Enterprise Plan</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Complete solution for businesses</p>
                  
                  <div className="mb-6">
                    <span className="text-3xl font-bold">Custom</span>
                    <span className="text-muted-foreground"> Pricing</span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <p className="text-sm font-medium text-sky-400">All Premium Features Plus:</p>
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-sky-400 mt-0.5 shrink-0" />
                      <p className="text-sm font-medium">Dedicated Account Manager</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-sky-400 mt-0.5 shrink-0" />
                      <p className="text-sm font-medium">Custom Integrations</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-sky-400 mt-0.5 shrink-0" />
                      <p className="text-sm font-medium">Multi-team Access</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-sky-400 mt-0.5 shrink-0" />
                      <p className="text-sm font-medium">Priority Fulfillment</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-sky-400 mt-0.5 shrink-0" />
                      <p className="text-sm font-medium">Custom Reporting</p>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full gap-2 border-sky-500/50 text-sky-400 hover:bg-sky-500/10">
                    <Building2 className="h-4 w-4" />
                    Contact for Enterprise
                  </Button>
                </div>
              </div>

              {/* Coming Soon Overlay */}
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                <div className="text-center">
                  <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium mb-3">
                    Coming Soon
                  </span>
                  <h3 className="font-display text-xl font-semibold mb-2">Theme Customization</h3>
                  <p className="text-sm text-muted-foreground">Enhanced Notifications</p>
                  <div className="flex items-center justify-center gap-2 mt-3 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Next Update</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </DialogTitle>
            <DialogDescription>
              Enter your new password below. Make sure it's at least 6 characters.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Enter new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={changingPassword}>
              {changingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
