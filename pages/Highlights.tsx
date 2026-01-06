import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import hero1 from '@/assets/hero-1.jpg';
import hero2 from '@/assets/hero-2.jpg';
import hero3 from '@/assets/hero-3.jpg';
import hero4 from '@/assets/hero-4.jpg';

// Default images for highlights without uploaded images
const defaultImages: Record<number, string> = {
  0: hero1,
  1: hero2,
  2: hero3,
  3: hero4,
};

// Fallback highlights if none in database
const fallbackHighlights = [
  { id: '1', title: 'Drone', category: 'Video and Photography', image_url: hero1, link_url: '/portfolio' },
  { id: '2', title: 'Obiimy Cyprus', category: 'Events', image_url: hero2, link_url: '/portfolio' },
  { id: '3', title: 'Photoshoot', category: 'Photography', image_url: hero3, link_url: '/portfolio' },
  { id: '4', title: 'Hyperlapse', category: 'Video', image_url: hero4, link_url: '/portfolio' },
];

const Highlights = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);
  const touchStartY = useRef(0);

  const { data: dbHighlights } = useQuery({
    queryKey: ['highlights'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('highlights')
        .select('*')
        .eq('published', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Use database highlights with fallback images, or static fallback if no db records
  const highlights = dbHighlights && dbHighlights.length > 0 
    ? dbHighlights.map((h, index) => ({
        ...h,
        image_url: h.image_url || defaultImages[index] || hero1
      }))
    : fallbackHighlights;

  const goToNext = useCallback(() => {
    setActiveSlide((prev) => (prev === highlights.length - 1 ? 0 : prev + 1));
  }, [highlights.length]);

  const goToPrev = useCallback(() => {
    setActiveSlide((prev) => (prev === 0 ? highlights.length - 1 : prev - 1));
  }, [highlights.length]);

  // Mouse wheel handler
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      if (isScrolling.current) return;
      isScrolling.current = true;

      if (e.deltaY > 0) {
        goToNext();
      } else {
        goToPrev();
      }

      setTimeout(() => {
        isScrolling.current = false;
      }, 800);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [goToNext, goToPrev]);

  // Touch swipe handler
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isScrolling.current) return;
      
      const touchEndY = e.changedTouches[0].clientY;
      const deltaY = touchStartY.current - touchEndY;
      
      if (Math.abs(deltaY) > 50) {
        isScrolling.current = true;
        
        if (deltaY > 0) {
          goToNext();
        } else {
          goToPrev();
        }

        setTimeout(() => {
          isScrolling.current = false;
        }, 800);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    return () => {
      if (container) {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [goToNext, goToPrev]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main ref={containerRef} className="relative h-screen overflow-hidden touch-none">
        {/* Full-screen slider */}
        <div className="absolute inset-0">
          {highlights.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: activeSlide === index ? 1 : 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              <img
                src={project.image_url}
                alt={project.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
            </motion.div>
          ))}
        </div>

        {/* Slide content */}
        <div className="relative z-10 h-full flex flex-col justify-end pb-32 px-6 lg:px-12">
          <motion.div
            key={activeSlide}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-7xl mx-auto w-full"
          >
            <Link to={highlights[activeSlide].link_url || '/portfolio'} className="group inline-block">
              <div className="flex items-center gap-4 mb-4">
                <span className="font-body text-sm text-muted-foreground uppercase tracking-wider">
                  {highlights[activeSlide].category}
                </span>
              </div>
              <h2 className="font-display text-6xl md:text-8xl font-medium mb-6 group-hover:text-primary transition-colors">
                {highlights[activeSlide].title}
              </h2>
              <div className="flex items-center gap-3 font-body text-sm">
                <span className="text-muted-foreground">View Project</span>
                <div className="w-10 h-10 rounded-full border border-foreground/20 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all">
                  <ArrowUpRight className="h-4 w-4 group-hover:text-primary-foreground transition-colors" />
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Slide indicators */}
          <div className="absolute bottom-12 right-6 lg:right-12 flex flex-col gap-3">
            {highlights.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  activeSlide === index 
                    ? 'bg-primary h-8' 
                    : 'bg-foreground/30 hover:bg-foreground/50'
                }`}
              />
            ))}
          </div>

          {/* Navigation arrows */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-8">
            <button
              onClick={() => setActiveSlide((prev) => (prev === 0 ? highlights.length - 1 : prev - 1))}
              className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Prev
            </button>
            <span className="font-body text-sm text-muted-foreground">
              {String(activeSlide + 1).padStart(2, '0')} / {String(highlights.length).padStart(2, '0')}
            </span>
            <button
              onClick={() => setActiveSlide((prev) => (prev === highlights.length - 1 ? 0 : prev + 1))}
              className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Highlights;
