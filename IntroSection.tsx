import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function IntroSection() {
  return (
    <section id="intro-section" className="py-32 lg:py-40">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          {/* Left - Large Title */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="font-display text-5xl md:text-6xl lg:text-7xl font-medium leading-tight">
              We're a{' '}
              <span className="text-primary italic">creative</span>{' '}
              agency
            </h2>
          </motion.div>

          {/* Right - Description */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8"
          >
            <p className="font-body text-xl text-muted-foreground leading-relaxed">
              We specialize in media-centric social strategies that boost brand presence, 
              engage audiences, and drive measurable results across digital platforms.
            </p>
            <Link 
              to="/about"
              className="group inline-flex items-center gap-4 font-body text-sm hover:text-primary transition-colors"
            >
              <span>Read More</span>
              <span className="w-10 h-10 rounded-full border border-foreground/20 flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-primary-foreground transition-all">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
