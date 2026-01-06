import { ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import hero1 from '@/assets/hero-1.jpg';
import hero2 from '@/assets/hero-2.jpg';
import hero3 from '@/assets/hero-3.jpg';
import hero4 from '@/assets/hero-4.jpg';

const defaultHeroImages = [hero1, hero2, hero3, hero4];

interface HomepageSettings {
  hero_media_type: 'images' | 'video';
  hero_video_url: string | null;
  hero_images: string[];
}

export function HeroSection() {
  const [activeImage, setActiveImage] = useState(0);
  const [settings, setSettings] = useState<HomepageSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('homepage_settings')
        .select('hero_media_type, hero_video_url, hero_images')
        .single();
      
      if (data) {
        setSettings(data as HomepageSettings);
      }
    } catch (error) {
      console.error('Error fetching homepage settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use database images if available, otherwise fallback to defaults
  const heroImages = settings?.hero_images && settings.hero_images.length > 0 
    ? settings.hero_images 
    : defaultHeroImages;
  
  const isVideoMode = settings?.hero_media_type === 'video' && settings?.hero_video_url;

  useEffect(() => {
    if (isVideoMode) return;
    
    const interval = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages.length, isVideoMode]);

  const scrollToContent = () => {
    document.getElementById('intro-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Extract YouTube video ID
  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&loop=1&playlist=${match[1]}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`;
    }
    return url;
  };

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      {/* Background Media */}
      <div className="absolute inset-0 z-0">
        {isVideoMode ? (
          <div className="absolute inset-0">
            <iframe
              src={getYouTubeEmbedUrl(settings.hero_video_url!)}
              className="absolute w-[300%] h-[300%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-30"
              allow="autoplay; encrypted-media"
              allowFullScreen
              title="Hero background video"
            />
          </div>
        ) : (
          heroImages.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: activeImage === index ? 0.3 : 0 }}
              transition={{ duration: 1.2 }}
              className="absolute inset-0"
            >
              <img
                src={image}
                alt="Creative work"
                className="w-full h-full object-cover"
              />
            </motion.div>
          ))
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12 pt-32 pb-16">
        <div className="text-center">
          {/* Welcome Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-3 mb-8"
          >
            <span className="text-sm text-muted-foreground font-body uppercase tracking-wider">Welcome</span>
            <span className="w-12 h-px bg-border" />
            <span className="text-sm text-muted-foreground font-body">Est. 2025</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-display text-8xl md:text-9xl lg:text-[12rem] font-medium tracking-tight mb-8"
          >
            pixency
          </motion.h1>

          {/* Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="max-w-xl mx-auto"
          >
            <p className="font-body text-lg text-muted-foreground">
              Bringing brands to life through
            </p>
            <p className="font-display text-2xl italic text-foreground mt-1">
              creative web solutions
            </p>
          </motion.div>
        </div>
      </div>

      {/* Hero Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="absolute bottom-0 left-0 right-0 z-10 border-t border-border/50"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="flex items-center justify-between py-6">
            <button 
              onClick={scrollToContent}
              className="flex items-center gap-3 group font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="w-10 h-10 rounded-full border border-foreground/20 flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-all">
                <ArrowDown className="h-4 w-4" />
              </span>
              <span>Scroll to Explore</span>
            </button>
            <span className="font-body text-sm text-muted-foreground">
              Featured Projects
            </span>
          </div>
        </div>
      </motion.div>

      {/* Slide Indicators - Only show for images */}
      {!isVideoMode && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveImage(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                activeImage === index ? 'bg-primary w-8' : 'bg-foreground/30'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
