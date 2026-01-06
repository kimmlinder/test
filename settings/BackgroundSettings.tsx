import { useState, useRef } from 'react';
import { useBackground, backgroundPresets, animatedBackgrounds, BackgroundType } from '@/contexts/BackgroundContext';
import { cn } from '@/lib/utils';
import { CheckCircle, Upload, Image, Sparkles, Palette, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function BackgroundSettings() {
  const { backgroundType, backgroundValue, customImageUrl, setBackground, setCustomImage } = useBackground();
  const [activeCategory, setActiveCategory] = useState<'static' | 'custom' | 'animated'>('static');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/background-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setCustomImage(publicUrl);
      toast({
        title: "Background uploaded",
        description: "Your custom background has been set.",
      });
    } catch (error) {
      console.error('Error uploading background:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload background. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveCustomBackground = () => {
    setCustomImage(null);
    setBackground('gradient', 'default');
    toast({
      title: "Background removed",
      description: "Custom background has been removed.",
    });
  };

  const categories = [
    { id: 'static' as const, label: 'Static', icon: Palette },
    { id: 'custom' as const, label: 'Custom', icon: Image },
    { id: 'animated' as const, label: 'Animated', icon: Sparkles },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="font-display text-xl font-semibold mb-1">Background</h2>
        <p className="text-sm text-muted-foreground">Customize your background style</p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all",
              activeCategory === cat.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background/50 border-border hover:bg-muted/50"
            )}
          >
            <cat.icon className="h-4 w-4" />
            <span className="text-sm font-medium">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Static Presets */}
      {activeCategory === 'static' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {backgroundPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setBackground(preset.type, preset.value)}
              className={cn(
                "relative aspect-video rounded-xl overflow-hidden transition-all",
                backgroundType === preset.type && backgroundValue === preset.value
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105"
                  : "hover:scale-105"
              )}
            >
              <div 
                className="absolute inset-0"
                style={{ background: preset.preview }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute bottom-2 left-3 text-sm font-medium text-white">
                {preset.name}
              </span>
              {backgroundType === preset.type && backgroundValue === preset.value && (
                <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-white" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Custom Upload */}
      {activeCategory === 'custom' && (
        <div className="space-y-4">
          {/* Current custom background */}
          {customImageUrl && backgroundType === 'custom' && (
            <div className="relative">
              <div className="aspect-video rounded-xl overflow-hidden border border-border">
                <img 
                  src={customImageUrl} 
                  alt="Custom background" 
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={handleRemoveCustomBackground}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-2 left-3 px-2 py-1 rounded bg-black/60 text-white text-sm">
                Current Background
              </div>
            </div>
          )}

          {/* Upload area */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative aspect-video rounded-xl border-2 border-dashed border-border cursor-pointer transition-all hover:border-primary/50 hover:bg-muted/20",
              "flex flex-col items-center justify-center gap-3"
            )}
          >
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium">Click to upload</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                </div>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}

      {/* Animated Backgrounds */}
      {activeCategory === 'animated' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {animatedBackgrounds.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setBackground(preset.type, preset.value)}
              className={cn(
                "relative aspect-video rounded-xl overflow-hidden transition-all",
                backgroundType === preset.type && backgroundValue === preset.value
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105"
                  : "hover:scale-105"
              )}
            >
              <div 
                className="absolute inset-0"
                style={{ background: preset.preview }}
              />
              {/* Animated indicator */}
              <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 text-white text-xs">
                <Sparkles className="h-3 w-3" />
                <span>Live</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute bottom-2 left-3 text-sm font-medium text-white">
                {preset.name}
              </span>
              {backgroundType === preset.type && backgroundValue === preset.value && (
                <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-white" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
