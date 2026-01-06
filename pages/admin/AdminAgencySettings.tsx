import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { toast } from 'sonner';
import { Loader2, Save, Plus, Trash2 } from 'lucide-react';

interface Stat {
  number: string;
  label: string;
}

interface Value {
  icon: string;
  title: string;
  description: string;
}

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
  stats: Stat[];
  values: Value[];
  team_section_title: string;
}

const iconOptions = ['Users', 'Award', 'Globe', 'Heart', 'Star', 'Zap', 'Target', 'Lightbulb', 'Rocket', 'Shield'];

export default function AdminAgencySettings() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AgencySettings | null>(null);

  useEffect(() => {
    if (isAdmin) {
      fetchSettings();
    }
  }, [isAdmin]);

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
          ...data,
          stats: (data.stats as unknown as Stat[]) || [],
          values: (data.values as unknown as Value[]) || [],
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
          stats: JSON.parse(JSON.stringify(settings.stats)),
          values: JSON.parse(JSON.stringify(settings.values)),
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

  const updateField = (field: keyof AgencySettings, value: string | null) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const updateStat = (index: number, field: keyof Stat, value: string) => {
    if (!settings) return;
    const newStats = [...settings.stats];
    newStats[index] = { ...newStats[index], [field]: value };
    setSettings({ ...settings, stats: newStats });
  };

  const addStat = () => {
    if (!settings) return;
    setSettings({
      ...settings,
      stats: [...settings.stats, { number: '0', label: 'New Stat' }],
    });
  };

  const removeStat = (index: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      stats: settings.stats.filter((_, i) => i !== index),
    });
  };

  const updateValue = (index: number, field: keyof Value, value: string) => {
    if (!settings) return;
    const newValues = [...settings.values];
    newValues[index] = { ...newValues[index], [field]: value };
    setSettings({ ...settings, values: newValues });
  };

  const addValue = () => {
    if (!settings) return;
    setSettings({
      ...settings,
      values: [...settings.values, { icon: 'Star', title: 'New Value', description: 'Description here' }],
    });
  };

  const removeValue = (index: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      values: settings.values.filter((_, i) => i !== index),
    });
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/member" replace />;
  }

  if (!settings) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">No settings found</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-medium mb-2">Agency Settings</h1>
            <p className="text-muted-foreground">Edit your About page content</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>

        <Tabs defaultValue="hero" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="story">Story</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="values">Values</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          {/* Hero Section */}
          <TabsContent value="hero">
            <Card>
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
                <CardDescription>The main banner on the About page</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Subtitle (small text above title)</Label>
                  <Input
                    value={settings.hero_subtitle}
                    onChange={(e) => updateField('hero_subtitle', e.target.value)}
                    placeholder="Who We Are"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Title (large text)</Label>
                  <Input
                    value={settings.hero_title}
                    onChange={(e) => updateField('hero_title', e.target.value)}
                    placeholder="about"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tagline</Label>
                  <Input
                    value={settings.hero_tagline}
                    onChange={(e) => updateField('hero_tagline', e.target.value)}
                    placeholder="Creative agency bringing brands to life"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tagline Accent (italic text)</Label>
                  <Input
                    value={settings.hero_tagline_accent}
                    onChange={(e) => updateField('hero_tagline_accent', e.target.value)}
                    placeholder="through innovation and storytelling"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Established Year</Label>
                  <Input
                    value={settings.established_year}
                    onChange={(e) => updateField('established_year', e.target.value)}
                    placeholder="2025"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Agency Description (shown below hero)</Label>
                  <Textarea
                    value={settings.agency_description}
                    onChange={(e) => updateField('agency_description', e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Story Section */}
          <TabsContent value="story">
            <Card>
              <CardHeader>
                <CardTitle>Our Story Section</CardTitle>
                <CardDescription>The story section with text and image</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Section Title</Label>
                  <Input
                    value={settings.story_title}
                    onChange={(e) => updateField('story_title', e.target.value)}
                    placeholder="Our Story"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Story Content</Label>
                  <Textarea
                    value={settings.story_content}
                    onChange={(e) => updateField('story_content', e.target.value)}
                    rows={10}
                    placeholder="Your agency story..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Use double line breaks to create paragraphs
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Story Image</Label>
                  <ImageUpload
                    value={settings.story_image_url || ''}
                    onChange={(url) => updateField('story_image_url', url || null)}
                    acceptVideo
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats Section */}
          <TabsContent value="stats">
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
                <CardDescription>Key numbers displayed on the About page</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.stats.map((stat, index) => (
                  <div key={index} className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                      <Label>Number</Label>
                      <Input
                        value={stat.number}
                        onChange={(e) => updateStat(index, 'number', e.target.value)}
                        placeholder="50+"
                      />
                    </div>
                    <div className="flex-[2] space-y-2">
                      <Label>Label</Label>
                      <Input
                        value={stat.label}
                        onChange={(e) => updateStat(index, 'label', e.target.value)}
                        placeholder="Projects Completed"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeStat(index)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addStat} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Stat
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Values Section */}
          <TabsContent value="values">
            <Card>
              <CardHeader>
                <CardTitle>Our Values</CardTitle>
                <CardDescription>Core values displayed with icons</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {settings.values.map((value, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Value {index + 1}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeValue(index)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Icon</Label>
                        <select
                          value={value.icon}
                          onChange={(e) => updateValue(index, 'icon', e.target.value)}
                          className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        >
                          {iconOptions.map((icon) => (
                            <option key={icon} value={icon}>
                              {icon}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={value.title}
                          onChange={(e) => updateValue(index, 'title', e.target.value)}
                          placeholder="Collaboration"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={value.description}
                        onChange={(e) => updateValue(index, 'description', e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={addValue} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Value
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Section */}
          <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle>Team Section</CardTitle>
                <CardDescription>Settings for the Meet the Team section</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Section Title</Label>
                  <Input
                    value={settings.team_section_title}
                    onChange={(e) => updateField('team_section_title', e.target.value)}
                    placeholder="Meet the Team"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  To manage individual team members, go to{' '}
                  <a href="/admin/team" className="text-primary hover:underline">
                    Manage Team
                  </a>
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}