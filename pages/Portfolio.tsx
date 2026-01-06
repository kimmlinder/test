import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDown, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Project {
  id: string;
  title: string;
  slug: string;
  category: string;
  image_url: string | null;
  year: string | null;
  description: string | null;
}

const Portfolio = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all projects');
  const [categories, setCategories] = useState<string[]>(['all projects']);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, slug, category, image_url, year, description')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProjects(data || []);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data?.map(p => p.category) || [])];
      setCategories(['all projects', ...uniqueCategories]);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = activeCategory === 'all projects' 
    ? projects 
    : projects.filter(p => p.category === activeCategory);

  const scrollToProjects = () => {
    document.getElementById('projects-grid')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col justify-center items-center text-center pt-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="px-6"
        >
          <p className="font-body text-sm text-muted-foreground uppercase tracking-wider mb-4">
            Designs
          </p>
          <h1 className="font-display text-7xl md:text-9xl font-medium mb-6">
            projects
          </h1>
          <div className="font-body text-lg text-muted-foreground max-w-xl mx-auto">
            <p>Designing digital experiences that</p>
            <p className="font-display italic">leave a lasting impression</p>
          </div>
        </motion.div>

        {/* Hero Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="absolute bottom-12 left-0 right-0 px-6 lg:px-12 flex items-center justify-between max-w-7xl mx-auto w-full"
        >
          <button 
            onClick={scrollToProjects}
            className="flex items-center gap-3 font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="w-10 h-10 rounded-full border border-foreground/20 flex items-center justify-center">
              <ArrowDown className="h-4 w-4" />
            </div>
            <span>Scroll to Explore</span>
          </button>
          <span className="font-body text-sm text-muted-foreground">
            All Projects
          </span>
        </motion.div>
      </section>

      {/* Projects Section */}
      <main id="projects-grid" className="pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          {/* Category Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-wrap justify-center gap-4 mb-16 pt-16 border-t border-border"
          >
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`font-body text-sm px-6 py-2 transition-all ${
                  activeCategory === category
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {category}
              </button>
            ))}
          </motion.div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              No projects found.
            </div>
          ) : (
            /* Projects Grid */
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
              {filteredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  layout
                >
                  <Link to={`/project/${project.slug}`} className="group block">
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-secondary">
                      {project.image_url ? (
                        <img
                          src={project.image_url}
                          alt={project.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No image
                        </div>
                      )}
                      <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-50 group-hover:scale-100">
                          <ArrowUpRight className="h-6 w-6 text-primary-foreground" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-display text-2xl font-medium mb-2 group-hover:text-primary transition-colors">
                          {project.title}
                        </h3>
                        <p className="font-body text-sm text-muted-foreground capitalize">{project.category}</p>
                      </div>
                      <span className="font-body text-sm text-muted-foreground">{project.year || ''}</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Portfolio;