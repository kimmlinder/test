import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';
import { Users, Award, Globe, Heart, ArrowDown, Loader2, Star, Zap, Target, Lightbulb, Rocket, Shield, LucideIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import hero2 from '@/assets/hero-2.jpg';
import hero3 from '@/assets/hero-3.jpg';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  image_url: string | null;
}

interface Stat {
  number: string;
  label: string;
}

interface ValueItem {
  icon: string;
  title: string;
  description: string;
}

interface AgencySettings {
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
  values: ValueItem[];
  team_section_title: string;
}

const defaultSettings: AgencySettings = {
  hero_subtitle: 'Who We Are',
  hero_title: 'about',
  hero_tagline: 'Creative agency bringing brands to life',
  hero_tagline_accent: 'through innovation and storytelling',
  established_year: '2025',
  story_title: 'Our Story',
  story_content: `Founded in 2025, PixenCy was born from a passion for creating meaningful digital experiences. We started as a small team of creatives with a shared vision: to help brands tell their stories in the most compelling way possible.

Today, we've grown into a full-service creative agency, offering everything from brand strategy and identity design to video production and web development. Our team brings together diverse talents and perspectives, united by our commitment to excellence.

We believe that great design has the power to transform businesses, inspire audiences, and create lasting connections. That's why we approach every project with curiosity, creativity, and care.`,
  story_image_url: null,
  agency_description: 'We are a creative agency based in Larnaca, Cyprus, dedicated to bringing brands to life through innovative design, compelling storytelling, and strategic thinking.',
  stats: [
    { number: '50+', label: 'Projects Completed' },
    { number: '30+', label: 'Happy Clients' },
    { number: '5', label: 'Years Experience' },
    { number: '10+', label: 'Team Members' },
  ],
  values: [
    { icon: 'Users', title: 'Collaboration', description: 'We believe the best work comes from true partnership with our clients.' },
    { icon: 'Award', title: 'Excellence', description: 'We strive for perfection in every pixel, every frame, every detail.' },
    { icon: 'Globe', title: 'Innovation', description: 'We push boundaries and embrace new technologies and techniques.' },
    { icon: 'Heart', title: 'Passion', description: 'We love what we do, and it shows in every project we deliver.' },
  ],
  team_section_title: 'Meet the Team',
};

// Fallback team members if none in database
const fallbackTeam: TeamMember[] = [
  { id: '1', name: 'Alex Petrov', role: 'Creative Director', bio: null, image_url: hero3 },
  { id: '2', name: 'Maria Costa', role: 'Lead Designer', bio: null, image_url: hero2 },
  { id: '3', name: 'David Kim', role: 'Motion Designer', bio: null, image_url: hero3 },
  { id: '4', name: 'Sophie Lane', role: 'Brand Strategist', bio: null, image_url: hero2 },
];

const iconMap: Record<string, LucideIcon> = {
  Users, Award, Globe, Heart, Star, Zap, Target, Lightbulb, Rocket, Shield,
};

const isVideo = (url: string) => {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
  return videoExtensions.some(ext => url.toLowerCase().includes(ext));
};

const About = () => {
  const [settings, setSettings] = useState<AgencySettings>(defaultSettings);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTeam, setLoadingTeam] = useState(true);

  useEffect(() => {
    fetchSettings();
    fetchTeamMembers();
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
          hero_subtitle: data.hero_subtitle || defaultSettings.hero_subtitle,
          hero_title: data.hero_title || defaultSettings.hero_title,
          hero_tagline: data.hero_tagline || defaultSettings.hero_tagline,
          hero_tagline_accent: data.hero_tagline_accent || defaultSettings.hero_tagline_accent,
          established_year: data.established_year || defaultSettings.established_year,
          story_title: data.story_title || defaultSettings.story_title,
          story_content: data.story_content || defaultSettings.story_content,
          story_image_url: data.story_image_url,
          agency_description: data.agency_description || defaultSettings.agency_description,
          stats: (data.stats as unknown as Stat[]) || defaultSettings.stats,
          values: (data.values as unknown as ValueItem[]) || defaultSettings.values,
          team_section_title: data.team_section_title || defaultSettings.team_section_title,
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('id, name, role, bio, image_url')
        .eq('published', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setTeamMembers(data && data.length > 0 ? data : fallbackTeam);
    } catch (error) {
      console.error('Error fetching team:', error);
      setTeamMembers(fallbackTeam);
    } finally {
      setLoadingTeam(false);
    }
  };

  const scrollToContent = () => {
    document.getElementById('about-content')?.scrollIntoView({ behavior: 'smooth' });
  };

  const storyParagraphs = settings.story_content.split('\n\n').filter(p => p.trim());

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col justify-center items-center text-center pt-20 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={hero2}
            alt="About hero"
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
            {settings.hero_subtitle}
          </p>
          <h1 className="font-display text-7xl md:text-9xl font-medium mb-6">
            {settings.hero_title}
          </h1>
          <div className="font-body text-lg text-muted-foreground max-w-xl mx-auto">
            <p>{settings.hero_tagline}</p>
            <p className="font-display italic">{settings.hero_tagline_accent}</p>
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
            onClick={scrollToContent}
            className="flex items-center gap-3 font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="w-10 h-10 rounded-full border border-foreground/20 flex items-center justify-center">
              <ArrowDown className="h-4 w-4" />
            </div>
            <span>Scroll to Explore</span>
          </button>
          <span className="font-body text-sm text-muted-foreground">
            Est. {settings.established_year}
          </span>
        </motion.div>
      </section>

      <main id="about-content" className="pb-24">
        {/* Stats Section */}
        <section className="mx-auto max-w-7xl px-6 lg:px-12 py-24 border-t border-border">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <p className="font-body text-lg text-muted-foreground max-w-3xl mx-auto">
              {settings.agency_description}
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {settings.stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="font-display text-5xl md:text-6xl font-medium text-primary mb-2">
                  {stat.number}
                </div>
                <p className="font-body text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Story Section */}
        <section className="bg-card py-24 mb-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="font-display text-4xl md:text-5xl font-medium mb-6">
                  {settings.story_title}
                </h2>
                <div className="space-y-4 font-body text-muted-foreground">
                  {storyParagraphs.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative"
              >
                {settings.story_image_url ? (
                  isVideo(settings.story_image_url) ? (
                    <video
                      src={settings.story_image_url}
                      controls
                      className="w-full rounded-3xl"
                    />
                  ) : (
                    <img
                      src={settings.story_image_url}
                      alt="Our team at work"
                      className="w-full rounded-3xl"
                    />
                  )
                ) : (
                  <img
                    src={hero2}
                    alt="Our team at work"
                    className="w-full rounded-3xl"
                  />
                )}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="mx-auto max-w-7xl px-6 lg:px-12 mb-24">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-4xl md:text-5xl font-medium text-center mb-16"
          >
            Our Values
          </motion.h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {settings.values.map((value, index) => {
              const IconComponent = iconMap[value.icon] || Heart;
              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <IconComponent className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-medium mb-3">{value.title}</h3>
                  <p className="font-body text-sm text-muted-foreground">{value.description}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Team Section */}
        <section className="mx-auto max-w-7xl px-6 lg:px-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-4xl md:text-5xl font-medium text-center mb-16"
          >
            {settings.team_section_title}
          </motion.h2>
          {loadingTeam ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {teamMembers.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center group"
                >
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-4">
                    {member.image_url ? (
                      isVideo(member.image_url) ? (
                        <video
                          src={member.image_url}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          playsInline
                          onMouseEnter={(e) => e.currentTarget.play()}
                          onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                        />
                      ) : (
                        <img
                          src={member.image_url}
                          alt={member.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      )
                    ) : (
                      <div className="w-full h-full bg-secondary flex items-center justify-center">
                        <Users className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-display text-xl font-medium mb-1">{member.name}</h3>
                  <p className="font-body text-sm text-muted-foreground mb-2">{member.role}</p>
                  {member.bio && (
                    <p className="font-body text-xs text-muted-foreground/80 line-clamp-3">{member.bio}</p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;