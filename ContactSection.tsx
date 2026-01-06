import { motion } from 'framer-motion';
import { MapPin, Phone, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

export function ContactSection() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('pixen@pixency.co');
    setCopied(true);
    toast({
      title: "Email copied!",
      description: "pixen@pixency.co has been copied to your clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-32 lg:py-40 border-t border-border">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        {/* Contact Info */}
        <div className="grid md:grid-cols-3 gap-12 mb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-full border border-foreground/20 flex items-center justify-center">
              <MapPin className="h-6 w-6" />
            </div>
            <h4 className="font-display text-xl font-medium mb-2">
              Larnaca, Larnaka, Cyprus
            </h4>
            <p className="font-body text-sm text-muted-foreground">Address</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-center flex items-center justify-center"
          >
            <span className="font-display text-4xl text-muted-foreground">. . .</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-full border border-foreground/20 flex items-center justify-center">
              <Phone className="h-6 w-6" />
            </div>
            <h4 className="font-display text-xl font-medium mb-2">TBA</h4>
            <p className="font-body text-sm text-muted-foreground">Phone</p>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="font-display text-xl italic text-muted-foreground mb-8">
            Ready to work together?
          </p>
          <button
            onClick={handleCopyEmail}
            className="group relative inline-flex items-center gap-4 font-display text-5xl md:text-7xl lg:text-8xl font-medium hover:text-primary transition-colors"
          >
            <span>pixen@pixency.co</span>
            {copied ? (
              <Check className="h-10 w-10 text-primary" />
            ) : (
              <Copy className="h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>
          
          <div className="mt-12">
            <Link 
              to="/contact"
              className="inline-block font-body text-sm border border-foreground px-8 py-4 rounded-full hover:bg-foreground hover:text-background transition-all"
            >
              Get in Touch
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
