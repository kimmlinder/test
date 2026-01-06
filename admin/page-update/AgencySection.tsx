import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import TeamSection from './TeamSection';

interface AgencySettings {
  id: string;
  hero_subtitle: string;
  hero_title: string;
  hero_tagline: string;
  hero_tagline_accent: string;
  established_year: string;
  story_title: string;
  story_content: string;
  story_image_url: string | null;
  agency_description: string;
  team_section_title: string;
}

const AgencySection = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AgencySettings | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('agency_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          id: data.id,
          hero_subtitle: data.hero_subtitle || '',
          hero_title: data.hero_title || '',
          hero_tagline: data.hero_tagline || '',
          hero_tagline_accent: data.hero_tagline_accent || '',
          established_year: data.established_year || '',
          story_title: data.story_title || '',
          story_content: data.story_content || '',
          story_image_url: data.story_image_url,
          agency_description: data.agency_description || '',
          team_section_title: data.team_section_title || 'Meet the Team',
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('agency_settings')
        .update({
          hero_subtitle: settings.hero_subtitle,
          hero_title: settings.hero_title,
          hero_tagline: settings.hero_tagline,
          hero_tagline_accent: settings.hero_tagline_accent,
          established_year: settings.established_year,
          story_title: settings.story_title,
          story_content: settings.story_content,
          story_image_url: settings.story_image_url,
          agency_description: settings.agency_description,
          team_section_title: settings.team_section_title,
        })
        .eq('id', settings.id);

      if (error) throw error;
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No agency settings found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-medium">Agency Settings</h2>
          <p className="text-sm text-muted-foreground">Configure your about page content</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Hero Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hero Section</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="hero_subtitle">Subtitle</Label>
                <Input
                  id="hero_subtitle"
                  value={settings.hero_subtitle}
                  onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
                  placeholder="e.g., Who We Are"
                />
              </div>
              <div>
                <Label htmlFor="hero_title">Title</Label>
                <Input
                  id="hero_title"
                  value={settings.hero_title}
                  onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
                  placeholder="e.g., About"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="hero_tagline">Tagline</Label>
              <Input
                id="hero_tagline"
                value={settings.hero_tagline}
                onChange={(e) => setSettings({ ...settings, hero_tagline: e.target.value })}
                placeholder="Main tagline text"
              />
            </div>
            <div>
              <Label htmlFor="hero_tagline_accent">Tagline Accent</Label>
              <Input
                id="hero_tagline_accent"
                value={settings.hero_tagline_accent}
                onChange={(e) => setSettings({ ...settings, hero_tagline_accent: e.target.value })}
                placeholder="Accent text for tagline"
              />
            </div>
          </CardContent>
        </Card>

        {/* Story Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Our Story</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="story_title">Story Title</Label>
                <Input
                  id="story_title"
                  value={settings.story_title}
                  onChange={(e) => setSettings({ ...settings, story_title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="established_year">Established Year</Label>
                <Input
                  id="established_year"
                  value={settings.established_year}
                  onChange={(e) => setSettings({ ...settings, established_year: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="story_content">Story Content</Label>
              <Textarea
                id="story_content"
                value={settings.story_content}
                onChange={(e) => setSettings({ ...settings, story_content: e.target.value })}
                rows={6}
              />
            </div>
            <div>
              <Label>Story Image</Label>
              <div className="mt-2">
                <ImageUpload
                  value={settings.story_image_url || ''}
                  onChange={(url) => setSettings({ ...settings, story_image_url: url })}
                  bucket="product-images"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* General */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="agency_description">Agency Description</Label>
              <Textarea
                id="agency_description"
                value={settings.agency_description}
                onChange={(e) => setSettings({ ...settings, agency_description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="team_section_title">Team Section Title</Label>
              <Input
                id="team_section_title"
                value={settings.team_section_title}
                onChange={(e) => setSettings({ ...settings, team_section_title: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Section */}
      <Separator className="my-8" />
      <TeamSection />
    </div>
  );
};

export default AgencySection;
