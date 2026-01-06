import { useState, useEffect, useRef } from 'react';
import { BetaLayout } from '@/components/layouts/BetaLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useColorTheme, colorThemes, ColorThemeId } from '@/contexts/ColorThemeContext';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useBetaAccess } from '@/hooks/useBetaAccess';

import { BackgroundSettings } from '@/components/settings/BackgroundSettings';
import { 
  User, Bell, Shield, Sparkles, Save, Loader2, Camera, Upload, Lock, Eye, EyeOff, 
  MapPin, Globe, Github, Twitter, Linkedin, Instagram, Mail, Bot, Briefcase, 
  MessageSquare, Users, Clock, Languages, Calendar, Heart, Target, Building2,
  CheckCircle, Palette, Sun, Moon, FlaskConical
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type MainTab = 'profile' | 'personalization' | 'team' | 'availability' | 'notifications' | 'privacy' | 'language' | 'calendar';
type PersonalizationSubTab = 'appearance' | 'ai-agent' | 'business-profile' | 'personal-data';

interface NotificationSetting {
  enabled: boolean;
  frequency: string;
}

interface NotificationSettings {
  bonus_credits: NotificationSetting;
  comments: NotificationSetting;
  join_requests: NotificationSetting;
  mentions: NotificationSetting;
  orders: NotificationSetting;
  promotions: NotificationSetting;
  system: NotificationSetting;
}

const defaultNotificationSettings: NotificationSettings = {
  bonus_credits: { enabled: true, frequency: 'instant' },
  comments: { enabled: true, frequency: 'instant' },
  join_requests: { enabled: true, frequency: 'instant' },
  mentions: { enabled: true, frequency: 'instant' },
  orders: { enabled: true, frequency: 'instant' },
  promotions: { enabled: false, frequency: 'daily' },
  system: { enabled: true, frequency: 'instant' },
};

export default function BetaSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { colorTheme, setColorTheme } = useColorTheme();
  const { language, setLanguage, t } = useLanguage();
  const { betaEnabled, isAdmin, toggleBetaAccess, loading: betaLoading } = useBetaAccess();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState<MainTab>('profile');
  const [personalizationSubTab, setPersonalizationSubTab] = useState<PersonalizationSubTab>('appearance');
  
  // Password dialog
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Profile state (from profiles table)
  const [profile, setProfile] = useState({
    full_name: '',
    avatar_url: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    postal_code: '',
  });

  // Extended profile (from user_settings table)
  const [extendedProfile, setExtendedProfile] = useState({
    display_name: '',
    location: '',
    default_start_page: 'automatic',
    website: '',
    github: '',
    twitter: '',
    linkedin: '',
    instagram: '',
  });
  
  // AI Agent personalization
  const [aiSettings, setAiSettings] = useState({
    conversation_tone: 'professional',
    language: 'en',
    response_length: 'medium',
  });
  
  // Business profile
  const [businessProfile, setBusinessProfile] = useState({
    bio: '',
    brand_name: '',
    industry: '',
    target_audience: '',
    usp: '',
    mission: '',
    outreach_tone: 'authentic',
  });
  
  // Personal data / Communication style
  const [personalData, setPersonalData] = useState({
    company: '',
    role: '',
    greeting_style: 'friendly',
    emoji_usage: 'rarely',
    text_length: 'medium',
    tone: 'friendly',
    cta_style: 'direct',
    personal_note: '',
  });
  
  // Notifications
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings);

  // Language - now using context, keeping local state for compatibility
  const [interfaceLanguage, setInterfaceLanguage] = useState<Language>(language);

  // Team
  const [uplineUserId, setUplineUserId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<{ id: string; full_name: string }[]>([]);

  useEffect(() => {
    if (user) {
      fetchAllSettings();
    }
  }, [user]);

  // Sync interface language with context when language changes
  useEffect(() => {
    setInterfaceLanguage(language);
  }, [language]);

  const fetchAllSettings = async () => {
    setLoading(true);
    try {
      // Fetch profile from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();
      
      if (profileError) throw profileError;
      
      if (profileData) {
        setProfile({
          full_name: profileData.full_name || '',
          avatar_url: profileData.avatar_url || '',
          phone: profileData.phone || '',
          address: profileData.address || '',
          city: profileData.city || '',
          country: profileData.country || '',
          postal_code: profileData.postal_code || '',
        });
      }

      // Fetch extended settings from user_settings table
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;

      if (settingsData) {
        setExtendedProfile({
          display_name: settingsData.display_name || profileData?.full_name || '',
          location: settingsData.location || '',
          default_start_page: settingsData.default_start_page || 'automatic',
          website: settingsData.website || '',
          github: settingsData.github || '',
          twitter: settingsData.twitter || '',
          linkedin: settingsData.linkedin || '',
          instagram: settingsData.instagram || '',
        });

        setAiSettings({
          conversation_tone: settingsData.ai_conversation_tone || 'professional',
          language: settingsData.ai_language || 'en',
          response_length: settingsData.ai_response_length || 'medium',
        });

        setBusinessProfile({
          bio: settingsData.business_bio || '',
          brand_name: settingsData.business_brand_name || '',
          industry: settingsData.business_industry || '',
          target_audience: settingsData.business_target_audience || '',
          usp: settingsData.business_usp || '',
          mission: settingsData.business_mission || '',
          outreach_tone: settingsData.business_outreach_tone || 'authentic',
        });

        setPersonalData({
          company: settingsData.personal_company || '',
          role: settingsData.personal_role || '',
          greeting_style: settingsData.personal_greeting_style || 'friendly',
          emoji_usage: settingsData.personal_emoji_usage || 'rarely',
          text_length: settingsData.personal_text_length || 'medium',
          tone: settingsData.personal_tone || 'friendly',
          cta_style: settingsData.personal_cta_style || 'direct',
          personal_note: settingsData.personal_note || '',
        });

        if (settingsData.notification_settings && typeof settingsData.notification_settings === 'object') {
          setNotificationSettings(settingsData.notification_settings as unknown as NotificationSettings);
        }

        setInterfaceLanguage((settingsData.interface_language as Language) || 'en');
        setUplineUserId(settingsData.upline_user_id || null);
      } else {
        // Set display name from profile if no settings exist
        setExtendedProfile(prev => ({ ...prev, display_name: profileData?.full_name || '' }));
      }

      // Fetch team members for upline selection
      const { data: members } = await supabase
        .from('profiles')
        .select('id, full_name')
        .neq('id', user?.id)
        .order('full_name');

      if (members) {
        setTeamMembers(members.filter(m => m.full_name));
      }

    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({ title: "Error", description: "Failed to load settings.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const upsertUserSettings = async (updates: Record<string, unknown>) => {
    const { data: existing } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', user?.id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user?.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('user_settings')
        .insert({ user_id: user?.id, ...updates });
      if (error) throw error;
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file type", description: "Please upload an image file.", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image smaller than 5MB.", variant: "destructive" });
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
      toast({ title: "Avatar updated", description: "Your profile picture has been updated." });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({ title: "Upload failed", description: "Failed to upload avatar.", variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingSection('profile');
    try {
      // Save to profiles table
      const { error: profileError } = await supabase
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
      
      if (profileError) throw profileError;

      // Save extended profile to user_settings
      await upsertUserSettings({
        display_name: extendedProfile.display_name,
        location: extendedProfile.location,
        default_start_page: extendedProfile.default_start_page,
        website: extendedProfile.website,
        github: extendedProfile.github,
        twitter: extendedProfile.twitter,
        linkedin: extendedProfile.linkedin,
        instagram: extendedProfile.instagram,
      });

      toast({ title: "Profile updated", description: "Your profile has been saved successfully." });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({ title: "Error", description: "Failed to save profile.", variant: "destructive" });
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveAiSettings = async () => {
    setSavingSection('ai');
    try {
      await upsertUserSettings({
        ai_conversation_tone: aiSettings.conversation_tone,
        ai_language: aiSettings.language,
        ai_response_length: aiSettings.response_length,
      });
      toast({ title: "AI settings saved", description: "Your AI preferences have been updated." });
    } catch (error) {
      console.error('Error saving AI settings:', error);
      toast({ title: "Error", description: "Failed to save AI settings.", variant: "destructive" });
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveBusinessProfile = async () => {
    setSavingSection('business');
    try {
      await upsertUserSettings({
        business_bio: businessProfile.bio,
        business_brand_name: businessProfile.brand_name,
        business_industry: businessProfile.industry,
        business_target_audience: businessProfile.target_audience,
        business_usp: businessProfile.usp,
        business_mission: businessProfile.mission,
        business_outreach_tone: businessProfile.outreach_tone,
      });
      toast({ title: "Business profile saved", description: "Your business profile has been updated." });
    } catch (error) {
      console.error('Error saving business profile:', error);
      toast({ title: "Error", description: "Failed to save business profile.", variant: "destructive" });
    } finally {
      setSavingSection(null);
    }
  };

  const handleSavePersonalData = async () => {
    setSavingSection('personal');
    try {
      await upsertUserSettings({
        personal_company: personalData.company,
        personal_role: personalData.role,
        personal_greeting_style: personalData.greeting_style,
        personal_emoji_usage: personalData.emoji_usage,
        personal_text_length: personalData.text_length,
        personal_tone: personalData.tone,
        personal_cta_style: personalData.cta_style,
        personal_note: personalData.personal_note,
      });
      toast({ title: "Personal data saved", description: "Your communication style has been updated." });
    } catch (error) {
      console.error('Error saving personal data:', error);
      toast({ title: "Error", description: "Failed to save personal data.", variant: "destructive" });
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveNotifications = async () => {
    setSavingSection('notifications');
    try {
      await upsertUserSettings({
        notification_settings: notificationSettings,
      });
      toast({ title: "Notifications saved", description: "Your notification preferences have been updated." });
    } catch (error) {
      console.error('Error saving notifications:', error);
      toast({ title: "Error", description: "Failed to save notifications.", variant: "destructive" });
    } finally {
      setSavingSection(null);
    }
  };

  const handleDisableAllNotifications = async () => {
    const disabled: NotificationSettings = {
      bonus_credits: { enabled: false, frequency: 'instant' },
      comments: { enabled: false, frequency: 'instant' },
      join_requests: { enabled: false, frequency: 'instant' },
      mentions: { enabled: false, frequency: 'instant' },
      orders: { enabled: false, frequency: 'instant' },
      promotions: { enabled: false, frequency: 'daily' },
      system: { enabled: false, frequency: 'instant' },
    };
    setNotificationSettings(disabled);
    setSavingSection('notifications');
    try {
      await upsertUserSettings({ notification_settings: disabled });
      toast({ title: "All notifications disabled", description: "You will no longer receive email notifications." });
    } catch (error) {
      console.error('Error disabling notifications:', error);
      toast({ title: "Error", description: "Failed to disable notifications.", variant: "destructive" });
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveLanguage = async () => {
    setSavingSection('language');
    try {
      // Update the global language context
      await setLanguage(interfaceLanguage);
      
      toast({ 
        title: t.success, 
        description: "Your language preference has been updated. The interface will now display in your selected language." 
      });
    } catch (error) {
      console.error('Error saving language:', error);
      toast({ title: t.error, description: "Failed to save language.", variant: "destructive" });
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveTeam = async () => {
    setSavingSection('team');
    try {
      await upsertUserSettings({
        upline_user_id: uplineUserId,
      });
      toast({ title: "Team settings saved", description: "Your upline has been updated." });
    } catch (error) {
      console.error('Error saving team settings:', error);
      toast({ title: "Error", description: "Failed to save team settings.", variant: "destructive" });
    } finally {
      setSavingSection(null);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordData.newPassword });
      if (error) throw error;
      toast({ title: "Password updated", description: "Your password has been changed." });
      setPasswordDialogOpen(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to change password.", variant: "destructive" });
    } finally {
      setChangingPassword(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || user?.email?.charAt(0).toUpperCase() || 'U';
  };

  const getEnabledNotificationCount = () => {
    return Object.values(notificationSettings).filter(s => s.enabled).length;
  };

  const mainTabs: { id: MainTab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: t.profile, icon: User },
    { id: 'personalization', label: t.personalization, icon: Sparkles },
    { id: 'team', label: t.team, icon: Users },
    { id: 'availability', label: t.availability, icon: Clock },
    { id: 'notifications', label: t.notifications, icon: Bell },
    { id: 'privacy', label: t.privacy, icon: Shield },
    { id: 'language', label: t.language, icon: Languages },
    { id: 'calendar', label: t.calendar, icon: Calendar },
  ];

  if (loading) {
    return (
      <BetaLayout variant="member">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </BetaLayout>
    );
  }

  return (
    <BetaLayout variant="member">
      <div className="max-w-5xl mx-auto">
        {/* Main Tabs Navigation - Horizontal scroll on mobile */}
        <div className="relative mb-6">
          <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            {mainTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all shrink-0",
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden xs:inline sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-4 sm:p-6">
              {/* Avatar Section */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="relative shrink-0">
                  <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-primary/20">
                    <AvatarImage src={profile.avatar_url} alt={profile.full_name} className="object-cover" />
                    <AvatarFallback className="text-xl sm:text-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                      {getInitials(profile.full_name)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="text-center sm:text-left">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
                  >
                    {uploadingAvatar ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    Upload Avatar
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">PNG, JPG, GIF up to 5MB</p>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </div>
              </div>

              {/* Profile Fields */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="font-semibold">Full Name</Label>
                  <Input
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder="Your full name"
                    className="bg-muted/50 border-border"
                  />
                  <p className="text-xs text-muted-foreground">For invoices and legal documents</p>
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold">Display Name</Label>
                  <Input
                    value={extendedProfile.display_name}
                    onChange={(e) => setExtendedProfile({ ...extendedProfile, display_name: e.target.value })}
                    placeholder="How you want to be called"
                    className="bg-muted/50 border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 font-semibold">
                    <MapPin className="h-4 w-4" /> Location
                  </Label>
                  <Input
                    value={extendedProfile.location}
                    onChange={(e) => setExtendedProfile({ ...extendedProfile, location: e.target.value })}
                    placeholder="Berlin, Germany"
                    className="bg-muted/50 border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 font-semibold">
                    <Building2 className="h-4 w-4" /> Default Start Page
                  </Label>
                  <Select value={extendedProfile.default_start_page} onValueChange={(v) => setExtendedProfile({ ...extendedProfile, default_start_page: v })}>
                    <SelectTrigger className="bg-muted/50 border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border z-50">
                      <SelectItem value="automatic">Automatic (Unity or Pipeline)</SelectItem>
                      <SelectItem value="dashboard">Dashboard</SelectItem>
                      <SelectItem value="ai-creator">AI Creator</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Where would you like to be redirected after login?</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 font-semibold">
                    <Globe className="h-4 w-4" /> Website
                  </Label>
                  <Input
                    value={extendedProfile.website}
                    onChange={(e) => setExtendedProfile({ ...extendedProfile, website: e.target.value })}
                    placeholder="https://your-website.com"
                    className="bg-muted/50 border-border"
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Social Links</h3>
                  
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Github className="h-4 w-4" /> GitHub
                    </Label>
                    <Input
                      value={extendedProfile.github}
                      onChange={(e) => setExtendedProfile({ ...extendedProfile, github: e.target.value })}
                      placeholder="https://github.com/username"
                      className="bg-muted/50 border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Twitter className="h-4 w-4" /> Twitter/X
                    </Label>
                    <Input
                      value={extendedProfile.twitter}
                      onChange={(e) => setExtendedProfile({ ...extendedProfile, twitter: e.target.value })}
                      placeholder="https://twitter.com/username"
                      className="bg-muted/50 border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4" /> LinkedIn
                    </Label>
                    <Input
                      value={extendedProfile.linkedin}
                      onChange={(e) => setExtendedProfile({ ...extendedProfile, linkedin: e.target.value })}
                      placeholder="https://linkedin.com/in/username"
                      className="bg-muted/50 border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Instagram className="h-4 w-4" /> Instagram
                    </Label>
                    <Input
                      value={extendedProfile.instagram}
                      onChange={(e) => setExtendedProfile({ ...extendedProfile, instagram: e.target.value })}
                      placeholder="https://instagram.com/username"
                      className="bg-muted/50 border-border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold">Email</Label>
                  <Input value={user?.email || ''} disabled className="bg-muted/30 border-border" />
                  <p className="text-xs text-muted-foreground">Email address cannot be changed</p>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={handleSaveProfile} disabled={savingSection === 'profile'} className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600">
                  {savingSection === 'profile' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Personalization Tab */}
        {activeTab === 'personalization' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Sub-tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setPersonalizationSubTab('appearance')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                  personalizationSubTab === 'appearance'
                    ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Palette className="h-4 w-4" /> Appearance
              </button>
              <button
                onClick={() => setPersonalizationSubTab('ai-agent')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                  personalizationSubTab === 'ai-agent'
                    ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Bot className="h-4 w-4" /> AI Agent
              </button>
              <button
                onClick={() => setPersonalizationSubTab('business-profile')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                  personalizationSubTab === 'business-profile'
                    ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Briefcase className="h-4 w-4" /> Business Profile
              </button>
              <button
                onClick={() => setPersonalizationSubTab('personal-data')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                  personalizationSubTab === 'personal-data'
                    ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <MessageSquare className="h-4 w-4" /> Personal Data
              </button>
            </div>

            {/* Appearance Settings */}
            {personalizationSubTab === 'appearance' && (
              <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 space-y-8">
                {/* Display Mode */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Sun className="h-5 w-5 text-pink-400" />
                    <h2 className="font-semibold text-lg">Display Mode</h2>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Choose your preferred theme</p>

                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={() => setTheme('light')}
                      className={cn(
                        "flex items-center gap-3 px-6 py-3 rounded-xl border transition-colors",
                        theme === 'light' 
                          ? "border-2 border-primary bg-primary/10" 
                          : "border-border bg-background/50 hover:bg-muted/50"
                      )}
                    >
                      <Sun className={cn("h-5 w-5", theme === 'light' && "text-primary")} />
                      <span className={cn(theme === 'light' && "text-primary font-medium")}>Light</span>
                    </button>
                    <button 
                      onClick={() => setTheme('dark')}
                      className={cn(
                        "flex items-center gap-3 px-6 py-3 rounded-xl border transition-colors",
                        theme === 'dark' 
                          ? "border-2 border-primary bg-primary/10" 
                          : "border-border bg-background/50 hover:bg-muted/50"
                      )}
                    >
                      <Moon className={cn("h-5 w-5", theme === 'dark' && "text-primary")} />
                      <span className={cn(theme === 'dark' && "text-primary font-medium")}>Dark</span>
                    </button>
                    <button 
                      onClick={() => setTheme('system')}
                      className={cn(
                        "flex items-center gap-3 px-6 py-3 rounded-xl border transition-colors",
                        theme === 'system' 
                          ? "border-2 border-primary bg-primary/10" 
                          : "border-border bg-background/50 hover:bg-muted/50"
                      )}
                    >
                      <Globe className={cn("h-5 w-5", theme === 'system' && "text-primary")} />
                      <span className={cn(theme === 'system' && "text-primary font-medium")}>System</span>
                    </button>
                  </div>
                </div>

                {/* Color Theme */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Palette className="h-5 w-5 text-pink-400" />
                    <h2 className="font-semibold text-lg">Color Theme</h2>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Choose your accent color</p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {colorThemes.map((themeCard) => (
                      <div 
                        key={themeCard.id}
                        className={cn(
                          "relative rounded-xl p-4 cursor-pointer transition-all",
                          colorTheme === themeCard.id 
                            ? "ring-2 ring-white ring-offset-2 ring-offset-background scale-105" 
                            : "hover:scale-105"
                        )}
                        style={{ 
                          background: `linear-gradient(135deg, ${themeCard.colors[0]}, ${themeCard.colors[1]}, ${themeCard.colors[2]})` 
                        }}
                        onClick={() => setColorTheme(themeCard.id)}
                      >
                        <span className="text-sm font-medium text-white drop-shadow-md">{themeCard.name}</span>
                        <div className="flex gap-1 mt-2">
                          {themeCard.colors.map((color, i) => (
                            <div 
                              key={i} 
                              className="w-4 h-4 rounded-full border-2 border-white/30"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        {colorTheme === themeCard.id && (
                          <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-white" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Background Settings */}
                <div>
                  <BackgroundSettings />
                </div>
              </div>
            )}

            {/* AI Agent Settings */}
            {personalizationSubTab === 'ai-agent' && (
              <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Bot className="h-5 w-5 text-pink-400" />
                  <h2 className="font-semibold text-lg">AI Chat Personalization</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Customize your AI agent to your needs. These settings affect how the AI communicates with you.
                </p>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" /> Conversation Tone
                    </Label>
                    <Select value={aiSettings.conversation_tone} onValueChange={(v) => setAiSettings({ ...aiSettings, conversation_tone: v })}>
                      <SelectTrigger className="bg-muted/50 border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border z-50">
                        <SelectItem value="professional">Professional - Factual and business-oriented</SelectItem>
                        <SelectItem value="friendly">Friendly - Warm and approachable</SelectItem>
                        <SelectItem value="casual">Casual - Relaxed and informal</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Choose how the AI should speak to you</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Languages className="h-4 w-4" /> Language
                    </Label>
                    <Select value={aiSettings.language} onValueChange={(v) => setAiSettings({ ...aiSettings, language: v })}>
                      <SelectTrigger className="bg-muted/50 border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border z-50">
                        <SelectItem value="en">🇺🇸 English</SelectItem>
                        <SelectItem value="de">🇩🇪 German</SelectItem>
                        <SelectItem value="el">🇬🇷 Greek</SelectItem>
                        <SelectItem value="sv">🇸🇪 Swedish</SelectItem>
                        <SelectItem value="es">🇪🇸 Spanish</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Language for the AI and the entire app (synchronized)</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" /> Response Length
                    </Label>
                    <Select value={aiSettings.response_length} onValueChange={(v) => setAiSettings({ ...aiSettings, response_length: v })}>
                      <SelectTrigger className="bg-muted/50 border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border z-50">
                        <SelectItem value="short">Short - Concise answers</SelectItem>
                        <SelectItem value="medium">Medium - Balanced answers</SelectItem>
                        <SelectItem value="detailed">Detailed - Comprehensive answers</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">How detailed should the AI respond?</p>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/30 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Preview</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {aiSettings.conversation_tone === 'professional' && "Good day! How can I help you today?"}
                      {aiSettings.conversation_tone === 'friendly' && "Hey there! What can I do for you? 😊"}
                      {aiSettings.conversation_tone === 'casual' && "Hi! What's up?"}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button onClick={handleSaveAiSettings} disabled={savingSection === 'ai'} className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600">
                    {savingSection === 'ai' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Settings
                  </Button>
                </div>
              </div>
            )}

            {/* Business Profile */}
            {personalizationSubTab === 'business-profile' && (
              <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Briefcase className="h-5 w-5 text-pink-400" />
                  <h2 className="font-semibold text-lg">Business Profile</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  This information is used for personalized outreach messages
                </p>

                <div className="p-4 rounded-xl bg-pink-500/10 border border-pink-500/20 mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-pink-400" />
                    <span className="font-medium text-pink-400">Why is this important?</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    The AI uses your business profile to generate authentic first contact messages that create real connections and match your brand.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" /> Bio
                    </Label>
                    <Textarea
                      value={businessProfile.bio}
                      onChange={(e) => setBusinessProfile({ ...businessProfile, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      className="bg-muted/50 border-border min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" /> Business / Brand Name
                    </Label>
                    <Input
                      value={businessProfile.brand_name}
                      onChange={(e) => setBusinessProfile({ ...businessProfile, brand_name: e.target.value })}
                      placeholder="e.g. Creativable"
                      className="bg-muted/50 border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Target className="h-4 w-4" /> Niche / Industry
                    </Label>
                    <Input
                      value={businessProfile.industry}
                      onChange={(e) => setBusinessProfile({ ...businessProfile, industry: e.target.value })}
                      placeholder="e.g. Network Marketing, Personal Branding, Coaching"
                      className="bg-muted/50 border-border"
                    />
                    <p className="text-xs text-muted-foreground">What areas are you active in?</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Users className="h-4 w-4" /> Target Audience
                    </Label>
                    <Input
                      value={businessProfile.target_audience}
                      onChange={(e) => setBusinessProfile({ ...businessProfile, target_audience: e.target.value })}
                      placeholder="e.g. Ambitious networkers looking for tools, coaches who want to grow"
                      className="bg-muted/50 border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" /> What makes you special? (USP)
                    </Label>
                    <Textarea
                      value={businessProfile.usp}
                      onChange={(e) => setBusinessProfile({ ...businessProfile, usp: e.target.value })}
                      placeholder="e.g. AI-powered CRM for authentic growth without spam methods"
                      className="bg-muted/50 border-border"
                    />
                    <p className="text-xs text-muted-foreground">Your unique value for potential partners</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Heart className="h-4 w-4" /> Personal Mission
                    </Label>
                    <Textarea
                      value={businessProfile.mission}
                      onChange={(e) => setBusinessProfile({ ...businessProfile, mission: e.target.value })}
                      placeholder="e.g. Helping people build real partnerships and grow together"
                      className="bg-muted/50 border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" /> Outreach Tone
                    </Label>
                    <Select value={businessProfile.outreach_tone} onValueChange={(v) => setBusinessProfile({ ...businessProfile, outreach_tone: v })}>
                      <SelectTrigger className="bg-muted/50 border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border z-50">
                        <SelectItem value="authentic">Authentic & Casual</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="energetic">Energetic & Motivating</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">How should your first contact messages sound?</p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button onClick={handleSaveBusinessProfile} disabled={savingSection === 'business'} className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600">
                    {savingSection === 'business' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Business Profile
                  </Button>
                </div>
              </div>
            )}

            {/* Personal Data */}
            {personalizationSubTab === 'personal-data' && (
              <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
                <div className="p-4 rounded-xl bg-pink-500/10 border border-pink-500/20 mb-6">
                  <p className="text-sm">
                    Your personal communication style is used by the AI and invitation creation to generate messages that sound authentic and 100% like written by you.
                  </p>
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="h-5 w-5 text-pink-400" />
                  <h2 className="font-semibold text-lg">Personal Data</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-6">This information will be used in generated messages</p>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Your Company / Brand</Label>
                    <Input
                      value={personalData.company}
                      onChange={(e) => setPersonalData({ ...personalData, company: e.target.value })}
                      placeholder="e.g. Creativable GmbH"
                      className="bg-muted/50 border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Your Role</Label>
                    <Input
                      value={personalData.role}
                      onChange={(e) => setPersonalData({ ...personalData, role: e.target.value })}
                      placeholder="e.g. Coach, Consultant, Network Marketer"
                      className="bg-muted/50 border-border"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="font-semibold">Greeting Style</Label>
                    <p className="text-xs text-muted-foreground">How do you usually greet contacts?</p>
                    <RadioGroup value={personalData.greeting_style} onValueChange={(v) => setPersonalData({ ...personalData, greeting_style: v })}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="formal" id="formal" />
                        <Label htmlFor="formal">Formal (e.g. "Dear")</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="friendly" id="friendly" />
                        <Label htmlFor="friendly">Friendly-Professional (e.g. "Hello", "Good day")</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="casual" id="casual" />
                        <Label htmlFor="casual">Casual (e.g. "Hi", "Hey")</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <Label className="font-semibold">Emoji Usage</Label>
                    <p className="text-xs text-muted-foreground">Do you use emojis in your communication?</p>
                    <RadioGroup value={personalData.emoji_usage} onValueChange={(v) => setPersonalData({ ...personalData, emoji_usage: v })}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="never" id="never" />
                        <Label htmlFor="never">Never</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="rarely" id="rarely" />
                        <Label htmlFor="rarely">Rarely (1-2 per message)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="moderate" id="moderate" />
                        <Label htmlFor="moderate">Moderate (3-5 per message)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="frequent" id="frequent" />
                        <Label htmlFor="frequent">Frequent (5+ per message)</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <Label className="font-semibold">Text Length</Label>
                    <p className="text-xs text-muted-foreground">How long are your messages typically?</p>
                    <RadioGroup value={personalData.text_length} onValueChange={(v) => setPersonalData({ ...personalData, text_length: v })}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="short" id="short" />
                        <Label htmlFor="short">Short and concise (50-100 words)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="medium" id="medium" />
                        <Label htmlFor="medium">Medium (100-200 words)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="detailed" id="detailed" />
                        <Label htmlFor="detailed">Detailed (200+ words)</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <Label className="font-semibold">Tone</Label>
                    <p className="text-xs text-muted-foreground">Which tone fits you best?</p>
                    <RadioGroup value={personalData.tone} onValueChange={(v) => setPersonalData({ ...personalData, tone: v })}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="professional" id="tone-professional" />
                        <Label htmlFor="tone-professional">Professional and factual</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="friendly" id="tone-friendly" />
                        <Label htmlFor="tone-friendly">Friendly and warm</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="energetic" id="tone-energetic" />
                        <Label htmlFor="tone-energetic">Energetic and motivating</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="calm" id="tone-calm" />
                        <Label htmlFor="tone-calm">Calm and composed</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <Label className="font-semibold">Call-to-Action Style</Label>
                    <p className="text-xs text-muted-foreground">How do you make requests and invitations?</p>
                    <RadioGroup value={personalData.cta_style} onValueChange={(v) => setPersonalData({ ...personalData, cta_style: v })}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="direct" id="cta-direct" />
                        <Label htmlFor="cta-direct">Direct (e.g. "Let's talk on Monday")</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="soft" id="cta-soft" />
                        <Label htmlFor="cta-soft">Soft (e.g. "Would you have time for a conversation?")</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="urgent" id="cta-urgent" />
                        <Label htmlFor="cta-urgent">Urgent (e.g. "Only few spots left!")</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold">Personal Note (Optional)</Label>
                    <p className="text-xs text-muted-foreground">Are there specific phrases or sentences you frequently use?</p>
                    <Textarea
                      value={personalData.personal_note}
                      onChange={(e) => setPersonalData({ ...personalData, personal_note: e.target.value })}
                      placeholder="e.g. Looking forward to hearing from you! or Let's get started together!"
                      className="bg-muted/50 border-border"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button onClick={handleSavePersonalData} disabled={savingSection === 'personal'} className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600">
                    {savingSection === 'personal' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Communication Style
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 relative">
              {/* Coming Soon Overlay */}
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-2xl z-10 flex flex-col items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Coming Soon</h3>
                  <p className="text-muted-foreground max-w-sm">Team settings will be available in a future update.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5" />
                <h2 className="font-semibold text-lg">Upline</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">Select your upline from the team list</p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Upline</Label>
                  <Select value={uplineUserId || 'none'} onValueChange={(v) => setUplineUserId(v === 'none' ? null : v)}>
                    <SelectTrigger className="bg-muted/50 border-border">
                      <SelectValue placeholder="Select upline" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border z-50">
                      <SelectItem value="none">No upline selected</SelectItem>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Your upline will be notified about new appointments</p>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={handleSaveTeam} disabled={savingSection === 'team'} className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600">
                  {savingSection === 'team' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 relative">
              {/* Coming Soon Overlay */}
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-2xl z-10 flex flex-col items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
                    <Bell className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Coming Soon</h3>
                  <p className="text-muted-foreground max-w-sm">Notification settings will be available in a future update.</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Mail className="h-5 w-5" />
                    <h2 className="font-semibold text-lg">Email Notifications</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">Manage when and how you receive email notifications</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleDisableAllNotifications} disabled={savingSection === 'notifications'}>
                  <Bell className="h-4 w-4 mr-2" /> Disable all
                </Button>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 mb-6">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">You currently have <strong>{getEnabledNotificationCount()} of 7</strong> notification types enabled</span>
              </div>

              <div className="space-y-6">
                {(Object.entries(notificationSettings) as [keyof NotificationSettings, NotificationSetting][]).map(([key, value]) => (
                  <div key={key} className="flex items-start justify-between py-4 border-b border-border last:border-0">
                    <div className="flex-1">
                      <h3 className="font-medium capitalize">{key.replace('_', ' ')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {key === 'bonus_credits' && 'Notification when you receive bonus credits from an admin'}
                        {key === 'comments' && 'Notification when someone replies to your post'}
                        {key === 'join_requests' && 'Notification about new join requests (for team admins only)'}
                        {key === 'mentions' && 'Notification when you are mentioned in a post or comment'}
                        {key === 'orders' && 'Notification about order status updates'}
                        {key === 'promotions' && 'Notification about promotions and special offers'}
                        {key === 'system' && 'Important system notifications'}
                      </p>
                      <div className="mt-2">
                        <Label className="text-xs text-muted-foreground">Frequency</Label>
                        <Select 
                          value={value.frequency} 
                          onValueChange={(v) => setNotificationSettings({
                            ...notificationSettings,
                            [key]: { ...value, frequency: v }
                          })}
                        >
                          <SelectTrigger className="w-32 h-8 text-xs bg-muted/50 border-border mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border z-50">
                            <SelectItem value="instant">Instant</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Switch
                      checked={value.enabled}
                      onCheckedChange={(checked) => setNotificationSettings({
                        ...notificationSettings,
                        [key]: { ...value, enabled: checked }
                      })}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={handleSaveNotifications} disabled={savingSection === 'notifications'} className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600">
                  {savingSection === 'notifications' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Notifications
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Beta Features Section */}
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <FlaskConical className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-lg">Beta Features</h2>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium flex items-center gap-2">
                        Enable Beta Features
                        {isAdmin && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Admin - Always Enabled</span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Get early access to new features before they're released to everyone. Beta features may be unstable or change without notice.
                      </p>
                    </div>
                    <Switch
                      checked={isAdmin || betaEnabled}
                      onCheckedChange={async (checked) => {
                        const result = await toggleBetaAccess(checked);
                        if (result?.success) {
                          toast({ 
                            title: checked ? "Beta features enabled" : "Beta features disabled",
                            description: checked 
                              ? "You now have access to beta features." 
                              : "You've opted out of beta features."
                          });
                        }
                      }}
                      disabled={isAdmin || betaLoading}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="h-5 w-5" />
                <h2 className="font-semibold text-lg">Privacy & Security</h2>
              </div>

              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Change Password</h3>
                      <p className="text-sm text-muted-foreground">Update your account password</p>
                    </div>
                    <Button variant="outline" onClick={() => setPasswordDialogOpen(true)}>
                      <Lock className="h-4 w-4 mr-2" /> Change
                    </Button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Two-Factor Authentication</h3>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                    </div>
                    <Button variant="outline" disabled>Coming Soon</Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Language Tab */}
        {activeTab === 'language' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Languages className="h-5 w-5" />
                <h2 className="font-semibold text-lg">{t.language} {t.settings}</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t.interfaceLanguage}</Label>
                  <Select value={interfaceLanguage} onValueChange={(value) => setInterfaceLanguage(value as Language)}>
                    <SelectTrigger className="bg-muted/50 border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border z-50">
                      <SelectItem value="en">🇺🇸 English</SelectItem>
                      <SelectItem value="de">🇩🇪 Deutsch (German)</SelectItem>
                      <SelectItem value="el">🇬🇷 Ελληνικά (Greek)</SelectItem>
                      <SelectItem value="sv">🇸🇪 Svenska (Swedish)</SelectItem>
                      <SelectItem value="es">🇪🇸 Español (Spanish)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{t.languageDescription}</p>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={handleSaveLanguage} disabled={savingSection === 'language'} className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600">
                  {savingSection === 'language' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  {t.save} {t.language}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Availability Tab */}
        {activeTab === 'availability' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 relative min-h-[300px]">
              {/* Coming Soon Overlay */}
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-2xl z-10 flex flex-col items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
                    <Clock className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Coming Soon</h3>
                  <p className="text-muted-foreground max-w-sm">Availability settings will be available in a future update.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <Clock className="h-5 w-5" />
                <h2 className="font-semibold text-lg">Availability</h2>
              </div>
              <p className="text-muted-foreground">Set your working hours and availability for appointments.</p>
            </div>
          </motion.div>
        )}

        {/* Calendar Sync Tab */}
        {activeTab === 'calendar' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 relative min-h-[300px]">
              {/* Coming Soon Overlay */}
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-2xl z-10 flex flex-col items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
                    <Calendar className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Coming Soon</h3>
                  <p className="text-muted-foreground max-w-sm">Calendar sync will be available in a future update.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <Calendar className="h-5 w-5" />
                <h2 className="font-semibold text-lg">Calendar Sync</h2>
              </div>
              <p className="text-muted-foreground">Connect your Google Calendar or Outlook to sync appointments.</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Enter your new password below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleChangePassword} disabled={changingPassword}>
              {changingPassword ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BetaLayout>
  );
}
