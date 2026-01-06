import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';
import { Download, ExternalLink, FileText, Video, Image as ImageIcon, Palette, ArrowDown } from 'lucide-react';
import hero3 from '@/assets/hero-3.jpg';
import {
  generateBrandGuidelines,
  generateColorPalette,
  generateProjectBriefTemplate,
  generateCreativeProcessGuide,
  generateCompanyOverview,
} from '@/utils/resourcePdfGenerator';

type ResourceItem = {
  title: string;
  description: string;
  icon: typeof Palette;
  type: 'download' | 'link' | 'generate';
  href?: string;
  generator?: () => void;
};

const resources: { category: string; items: ResourceItem[] }[] = [
  {
    category: 'Brand Assets',
    items: [
      { title: 'Logo Package', description: 'SVG, PNG, and EPS formats', icon: Palette, type: 'download', href: '/assets/logo-package.zip' },
      { title: 'Brand Guidelines', description: 'Complete brand usage guide', icon: FileText, type: 'generate', generator: generateBrandGuidelines },
      { title: 'Color Palette', description: 'Primary and secondary colors', icon: Palette, type: 'generate', generator: generateColorPalette },
    ],
  },
  {
    category: 'Media Kit',
    items: [
      { title: 'Press Photos', description: 'High-resolution team photos', icon: ImageIcon, type: 'download', href: '/assets/press-photos.zip' },
      { title: 'Company Overview', description: 'About PixenCy presentation', icon: FileText, type: 'generate', generator: generateCompanyOverview },
      { title: 'Showreel', description: 'Our latest work compilation', icon: Video, type: 'link', href: 'https://youtube.com' },
    ],
  },
  {
    category: 'Tools & Templates',
    items: [
      { title: 'Figma UI Kit', description: 'Design system components', icon: Palette, type: 'link', href: 'https://figma.com' },
      { title: 'Project Brief Template', description: 'Start your project right', icon: FileText, type: 'generate', generator: generateProjectBriefTemplate },
      { title: 'Creative Process Guide', description: 'How we work with clients', icon: FileText, type: 'generate', generator: generateCreativeProcessGuide },
    ],
  },
];

const handleResourceClick = (item: ResourceItem) => {
  if (item.type === 'generate' && item.generator) {
    item.generator();
  } else if (item.type === 'link' && item.href) {
    window.open(item.href, '_blank', 'noopener,noreferrer');
  } else if (item.type === 'download' && item.href) {
    const link = document.createElement('a');
    link.href = item.href;
    link.download = item.href.split('/').pop() || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

const Resources = () => {
  const scrollToContent = () => {
    document.getElementById('resources-content')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col justify-center items-center text-center pt-20 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={hero3}
            alt="Resources hero"
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
            Downloads
          </p>
          <h1 className="font-display text-7xl md:text-9xl font-medium mb-6">
            resources
          </h1>
          <div className="font-body text-lg text-muted-foreground max-w-xl mx-auto">
            <p>Brand assets, media kits, and tools</p>
            <p className="font-display italic">for collaborating with us</p>
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
            Downloads & Assets
          </span>
        </motion.div>
      </section>

      <main id="resources-content" className="pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-12 pt-16 border-t border-border">

          {/* Resources Grid */}
          <div className="space-y-16">
            {resources.map((section, sectionIndex) => (
              <motion.div
                key={section.category}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: sectionIndex * 0.1 }}
              >
                <h2 className="font-display text-2xl font-medium mb-8 pb-4 border-b border-border">
                  {section.category}
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {section.items.map((item, index) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: (sectionIndex * 0.1) + (index * 0.05) }}
                      onClick={() => handleResourceClick(item)}
                      className="group p-6 rounded-2xl border border-border hover:border-primary transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                          <item.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
                        </div>
                        {item.type === 'download' ? (
                          <Download className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        ) : (
                          <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        )}
                      </div>
                      <h3 className="font-display text-lg font-medium mb-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="font-body text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-24 text-center p-12 rounded-3xl bg-card"
          >
            <h2 className="font-display text-3xl font-medium mb-4">
              Need something specific?
            </h2>
            <p className="font-body text-muted-foreground mb-8 max-w-lg mx-auto">
              If you need custom assets or have specific requirements, feel free to reach out to us.
            </p>
            <button className="font-body text-sm border border-foreground px-8 py-3 rounded-full hover:bg-foreground hover:text-background transition-all">
              Contact Us
            </button>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Resources;
