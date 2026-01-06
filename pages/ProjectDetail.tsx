import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { OptimizedImage } from '@/components/OptimizedImage';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface Project {
  id: string;
  title: string;
  slug: string;
  category: string;
  description: string | null;
  challenge: string | null;
  solution: string | null;
  client: string | null;
  year: string | null;
  services: string[] | null;
  image_url: string | null;
  gallery_images: string[] | null;
  gallery_display_type: string | null;
}

const ProjectDetail = () => {
  const { id } = useParams(); // This is actually the slug
  const [project, setProject] = useState<Project | null>(null);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    setLoading(true);
    try {
      // Fetch all published projects for navigation
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      setAllProjects(projectsData || []);

      // Find current project by slug
      const currentProject = projectsData?.find(p => p.slug === id);
      
      if (!currentProject) {
        setNotFound(true);
        return;
      }

      setProject(currentProject);
    } catch (error) {
      console.error('Error fetching project:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !project) {
    return <Navigate to="/portfolio" replace />;
  }

  const currentIndex = allProjects.findIndex(p => p.slug === id);
  const prevProject = allProjects[currentIndex - 1];
  const nextProject = allProjects[currentIndex + 1] || allProjects[0];

  const allMedia = [
    project.image_url,
    ...(project.gallery_images || [])
  ].filter(Boolean) as string[];

  const isVideo = (url: string) => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pb-24">
        {/* Hero Section with overlaid content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="relative h-screen w-full"
        >
          {/* Hero Image */}
          {allMedia[0] && (
            isVideo(allMedia[0]) ? (
              <video
                src={allMedia[0]}
                controls
                preload="metadata"
                className="w-full h-full object-cover"
              />
            ) : (
              <OptimizedImage
                src={allMedia[0]}
                alt={project.title}
                className="w-full h-full"
                priority
              />
            )
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent pointer-events-none" />
          
          {/* Project Info - Positioned at bottom with blur */}
          <div className="absolute bottom-0 left-0 right-0 z-10">
            <div className="mx-auto max-w-7xl px-6 lg:px-12 pb-12 pt-8 backdrop-blur-sm bg-background/10 rounded-t-3xl">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="grid lg:grid-cols-2 gap-8 lg:gap-16"
              >
                <div>
                  <p className="font-body text-primary mb-4 capitalize">{project.category}</p>
                  <h1 className="font-display text-5xl md:text-7xl font-medium mb-6">
                    {project.title}
                  </h1>
                  {project.description && (
                    <p className="font-body text-lg text-muted-foreground">
                      {project.description}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-8">
                  {project.client && (
                    <div>
                      <p className="font-body text-sm text-muted-foreground mb-2">Client</p>
                      <p className="font-display text-lg font-medium">{project.client}</p>
                    </div>
                  )}
                  {project.year && (
                    <div>
                      <p className="font-body text-sm text-muted-foreground mb-2">Year</p>
                      <p className="font-display text-lg font-medium">{project.year}</p>
                    </div>
                  )}
                  {project.services && project.services.length > 0 && (
                    <div className="col-span-2">
                      <p className="font-body text-sm text-muted-foreground mb-2">Services</p>
                      <div className="flex flex-wrap gap-2">
                        {project.services.map((service) => (
                          <span
                            key={service}
                            className="font-body text-sm px-4 py-1 rounded-full border border-border"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        <div className="mx-auto max-w-7xl px-6 lg:px-12 mt-16">

          {/* Challenge & Solution */}
          {(project.challenge || project.solution) && (
            <div className="grid lg:grid-cols-2 gap-16 mb-24">
              {project.challenge && (
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <h2 className="font-display text-2xl font-medium mb-4">The Challenge</h2>
                  <p className="font-body text-muted-foreground">{project.challenge}</p>
                </motion.div>
              )}
              {project.solution && (
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="font-display text-2xl font-medium mb-4">The Solution</h2>
                  <p className="font-body text-muted-foreground">{project.solution}</p>
                </motion.div>
              )}
            </div>
          )}

          {/* Gallery */}
          {allMedia.length > 1 && (
            project.gallery_display_type === 'carousel' ? (
              <div className="mb-24">
                <Carousel className="w-full">
                  <CarouselContent>
                    {allMedia.slice(1).map((media, index) => (
                      <CarouselItem key={index}>
                        {isVideo(media) ? (
                          <video
                            src={media}
                            controls
                            preload="metadata"
                            className="w-full rounded-3xl"
                          />
                        ) : (
                          <OptimizedImage
                            src={media}
                            alt={`${project.title} - ${index + 2}`}
                            className="w-full rounded-3xl aspect-video"
                          />
                        )}
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-4" />
                  <CarouselNext className="right-4" />
                </Carousel>
              </div>
            ) : (
              <div className="space-y-8 mb-24">
                {allMedia.slice(1).map((media, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {isVideo(media) ? (
                      <video
                        src={media}
                        controls
                        preload="metadata"
                        className="w-full rounded-3xl"
                      />
                    ) : (
                      <OptimizedImage
                        src={media}
                        alt={`${project.title} - ${index + 2}`}
                        className="w-full rounded-3xl aspect-video"
                      />
                    )}
                  </motion.div>
                ))}
              </div>
            )
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-12 border-t border-border">
            {prevProject ? (
              <Link
                to={`/project/${prevProject.slug}`}
                className="group flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center group-hover:bg-foreground group-hover:text-background group-hover:border-foreground transition-all">
                  <ArrowLeft className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-body text-sm text-muted-foreground">Previous</p>
                  <p className="font-display text-lg font-medium group-hover:text-primary transition-colors">
                    {prevProject.title}
                  </p>
                </div>
              </Link>
            ) : (
              <div />
            )}
            {nextProject && nextProject.slug !== project.slug && (
              <Link
                to={`/project/${nextProject.slug}`}
                className="group flex items-center gap-4 text-right"
              >
                <div>
                  <p className="font-body text-sm text-muted-foreground">Next</p>
                  <p className="font-display text-lg font-medium group-hover:text-primary transition-colors">
                    {nextProject.title}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center group-hover:bg-foreground group-hover:text-background group-hover:border-foreground transition-all">
                  <ArrowRight className="h-5 w-5" />
                </div>
              </Link>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProjectDetail;