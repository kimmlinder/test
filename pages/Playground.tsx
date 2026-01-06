import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Playground = () => {
  const { data: archiveItems = [], isLoading } = useQuery({
    queryKey: ['playground-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('published', true)
        .eq('show_in_playground', true)
        .order('playground_order', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Fixed Hero */}
      <section className="h-screen flex items-center justify-center sticky top-0">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="font-display text-7xl md:text-9xl font-medium"
        >
          archive
        </motion.h1>
      </section>

      {/* Archive Gallery */}
      <main className="relative z-10 bg-background pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : archiveItems.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No archive items yet.</p>
            </div>
          ) : (
            <div className="space-y-32">
              {archiveItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 80 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8 }}
                  className={`flex flex-col ${
                    item.playground_align === 'left' ? 'items-start' : 
                    item.playground_align === 'right' ? 'items-end' : 
                    'items-center'
                  }`}
                >
                  <Link to={`/project/${item.slug}`} className="group block">
                    <div className={`relative overflow-hidden rounded-2xl mb-6 ${
                      item.playground_scale === 'large' ? 'w-[80vw] max-w-4xl' :
                      item.playground_scale === 'medium' ? 'w-[60vw] max-w-2xl' :
                      'w-[40vw] max-w-xl'
                    }`}>
                      <div className="aspect-[4/3]">
                        <img
                          src={item.image_url || '/placeholder.svg'}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>
                      <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-50 group-hover:scale-100">
                          <ArrowUpRight className="h-8 w-8 text-primary-foreground" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <span className="font-body text-sm text-muted-foreground">{item.year || ''}</span>
                      <h3 className="font-display text-3xl font-medium group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      {item.category && (
                        <span className="font-body text-sm text-muted-foreground">{item.category}</span>
                      )}
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

export default Playground;