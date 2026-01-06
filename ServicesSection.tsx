import { motion } from 'framer-motion';
import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const services = [
  { name: 'branding', description: 'Make them remember you forever', cta: 'Stand out' },
  { name: 'web design', description: 'Convert visitors into customers', cta: 'Get results' },
  { name: 'motion', description: 'Stop the scroll, capture attention', cta: 'Go viral' },
  { name: 'development', description: 'Build what others can\'t imagine', cta: 'Launch now' },
  { name: 'marketing', description: 'Dominate your market space', cta: 'Scale up' },
];

export function ServicesSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="py-32 lg:py-40 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
      
      <div className="mx-auto max-w-7xl px-6 lg:px-12 relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <p className="font-body text-primary text-sm uppercase tracking-widest mb-4">
            Our Expertise
          </p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-medium mb-6">
            What can we do <span className="italic text-primary">for you?</span>
          </h2>
          <p className="font-body text-xl text-muted-foreground max-w-2xl mx-auto">
            Stop waiting. Start winning. Let's build something extraordinary together.
          </p>
        </motion.div>

        {/* Services List */}
        <div className="space-y-0 border-t border-border">
          {services.map((service, index) => (
            <motion.div
              key={service.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="group relative border-b border-border py-10 cursor-pointer"
            >
              <div className="flex items-center justify-between gap-8">
                <div className="flex items-center gap-8 flex-1">
                  <span className="font-body text-sm text-primary w-8">
                    0{index + 1}
                  </span>
                  <h3 className={`font-display text-5xl md:text-7xl lg:text-8xl font-medium tracking-tight transition-all duration-300 ${
                    hoveredIndex === index ? 'text-primary translate-x-4' : ''
                  }`}>
                    {service.name}
                  </h3>
                </div>
                
                <div className="hidden md:flex items-center gap-8">
                  <motion.p 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ 
                      opacity: hoveredIndex === index ? 1 : 0,
                      x: hoveredIndex === index ? 0 : -20
                    }}
                    transition={{ duration: 0.3 }}
                    className="font-body text-lg text-foreground max-w-xs text-right"
                  >
                    {service.description}
                  </motion.p>
                  
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: hoveredIndex === index ? 1 : 0,
                      opacity: hoveredIndex === index ? 1 : 0
                    }}
                    transition={{ duration: 0.3 }}
                    className="w-14 h-14 rounded-full bg-primary flex items-center justify-center flex-shrink-0"
                  >
                    <ArrowUpRight className="h-6 w-6 text-primary-foreground" />
                  </motion.div>
                </div>
              </div>
              
              {/* Hover line indicator */}
              <motion.div 
                className="absolute bottom-0 left-0 h-[2px] bg-primary"
                initial={{ width: 0 }}
                animate={{ width: hoveredIndex === index ? '100%' : 0 }}
                transition={{ duration: 0.4 }}
              />
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <p className="font-display text-2xl italic text-muted-foreground mb-8">
            Ready to transform your brand?
          </p>
          <Link 
            to="/contact"
            className="inline-flex items-center gap-4 bg-primary text-primary-foreground font-body text-sm px-10 py-5 rounded-full hover:bg-primary/90 transition-all hover:scale-105"
          >
            <span>Let's Talk Now</span>
            <ArrowUpRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
