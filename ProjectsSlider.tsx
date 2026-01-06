import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import hero1 from '@/assets/hero-1.jpg';
import hero2 from '@/assets/hero-2.jpg';
import hero3 from '@/assets/hero-3.jpg';
import hero4 from '@/assets/hero-4.jpg';

interface Project {
  id: string;
  title: string;
  category: string;
  image_url: string | null;
  year: string | null;
  slug: string;
}

const defaultProjects = [
  {
    id: '1',
    title: 'Drone',
    category: 'Video and Photography',
    image_url: hero1,
    year: '2025',
    slug: '1',
  },
  {
    id: '2',
    title: 'Obiimy Cyprus',
    category: 'Events',
    image_url: hero2,
    year: '2025',
    slug: '2',
  },
  {
    id: '3',
    title: 'Photoshoot',
    category: 'Photography',
    image_url: hero3,
    year: '2025',
    slug: '3',
  },
  {
    id: '4',
    title: 'Hyperlapse',
    category: 'Video',
    image_url: hero4,
    year: '2025',
    slug: '4',
  },
];

export function ProjectsSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [projects, setProjects] = useState<Project[]>(defaultProjects);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProjects();
  }, []);

  const fetchFeaturedProjects = async () => {
    try {
      // First get the featured project IDs from homepage settings
      const { data: settings } = await supabase
        .from('homepage_settings')
        .select('featured_project_ids')
        .single();

      if (settings?.featured_project_ids && settings.featured_project_ids.length > 0) {
        // Fetch the actual projects
        const { data: projectsData } = await supabase
          .from('projects')
          .select('id, title, category, image_url, year, slug')
          .in('id', settings.featured_project_ids)
          .eq('published', true);

        if (projectsData && projectsData.length > 0) {
          // Sort by the order in featured_project_ids
          const sortedProjects = settings.featured_project_ids
            .map((id: string) => projectsData.find(p => p.id === id))
            .filter(Boolean) as Project[];
          
          if (sortedProjects.length > 0) {
            setProjects(sortedProjects);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching featured projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeProject = projects[activeIndex];

  if (!activeProject) return null;

  return (
    <section className="py-32 lg:py-40 bg-card/50">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="font-body text-sm text-muted-foreground uppercase tracking-wider mb-4">
            Selected Work
          </p>
          <h2 className="font-display text-5xl md:text-6xl font-medium">
            Featured Projects
          </h2>
        </motion.div>

        {/* Main Image */}
        <div className="relative aspect-[16/9] rounded-3xl overflow-hidden mb-8">
          <AnimatePresence mode="wait">
            <motion.img
              key={activeProject.id}
              src={activeProject.image_url || ''}
              alt={activeProject.title}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6 }}
              className="w-full h-full object-cover"
            />
          </AnimatePresence>
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
          
          {/* Project Info */}
          <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeProject.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <span className="font-body text-sm text-background/70 uppercase tracking-wider mb-2 block">
                  {activeProject.category}
                </span>
                <h3 className="font-display text-5xl md:text-6xl text-background font-medium">
                  {activeProject.title}
                </h3>
              </motion.div>
            </AnimatePresence>
            
            <div className="flex items-center gap-6">
              <span className="font-body text-background/70">{activeProject.year || '2025'}</span>
              <Link 
                to={`/project/${activeProject.slug}`}
                className="w-16 h-16 rounded-full bg-primary flex items-center justify-center hover:scale-110 transition-transform"
              >
                <ArrowUpRight className="h-6 w-6 text-primary-foreground" />
              </Link>
            </div>
          </div>

          {/* Counter */}
          <div className="absolute top-8 right-8 flex items-center gap-2 text-background">
            <span className="font-display text-4xl">
              {String(activeIndex + 1).padStart(2, '0')}
            </span>
            <span className="text-background/50">/</span>
            <span className="font-body text-background/50">
              {String(projects.length).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Thumbnails */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {projects.map((project, index) => (
            <button
              key={project.id}
              onClick={() => setActiveIndex(index)}
              className={`group relative aspect-[4/3] rounded-2xl overflow-hidden transition-all duration-300 ${
                index === activeIndex ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
              }`}
            >
              <img
                src={project.image_url || ''}
                alt={project.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors flex items-center justify-center">
                <span className="font-body text-sm text-background opacity-0 group-hover:opacity-100 transition-opacity">
                  {project.title}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* View All Button */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="font-body text-muted-foreground mb-6">
            Continue exploring our work collection
          </p>
          <Link 
            to="/portfolio"
            className="inline-block font-body text-sm border border-foreground px-8 py-4 rounded-full hover:bg-foreground hover:text-background transition-all"
          >
            All Projects
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
