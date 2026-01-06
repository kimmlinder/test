import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';
import { MapPin, Phone, ArrowDown, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const Contact = () => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    captcha: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.captcha !== '4') {
      toast({
        title: "Captcha incorrect",
        description: "Please solve the math problem correctly.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Message sent!",
      description: "We'll get back to you as soon as possible.",
    });
    setFormData({ name: '', email: '', message: '', captcha: '' });
  };

  const copyEmail = () => {
    navigator.clipboard.writeText('pixen@pixency.co');
    setCopied(true);
    toast({
      title: "Email copied!",
      description: "pixen@pixency.co has been copied to your clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollToForm = () => {
    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
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
            Reach Out
          </p>
          <h1 className="font-display text-7xl md:text-9xl font-medium mb-6">
            contact
          </h1>
          <div className="font-body text-lg text-muted-foreground max-w-xl mx-auto">
            <p>Don't let your vision wait</p>
            <p className="font-display italic">Let's bring it to life</p>
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
            onClick={scrollToForm}
            className="flex items-center gap-3 font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="w-10 h-10 rounded-full border border-foreground/20 flex items-center justify-center">
              <ArrowDown className="h-4 w-4" />
            </div>
            <span>Scroll to Explore</span>
          </button>
          <span className="font-body text-sm text-muted-foreground">
            pixen@pixency.co
          </span>
        </motion.div>
      </section>

      {/* Contact Form Section */}
      <main id="contact-form" className="pb-24">
        <div className="mx-auto max-w-3xl px-6 lg:px-12">
          {/* Let's Talk */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-5xl md:text-6xl font-medium">Let's Talk</h2>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            onSubmit={handleSubmit}
            className="space-y-8"
          >
            <div>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-0 py-4 border-b border-border bg-transparent font-body text-lg focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                placeholder="What's Your Name"
                required
              />
            </div>
            <div>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-0 py-4 border-b border-border bg-transparent font-body text-lg focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                placeholder="Your Email"
                required
              />
            </div>
            <div>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                className="w-full px-0 py-4 border-b border-border bg-transparent font-body text-lg focus:outline-none focus:border-primary transition-colors resize-none placeholder:text-muted-foreground"
                placeholder="Tell Us About Your Project"
                required
              />
            </div>
            
            {/* Captcha */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 font-body text-lg">
                <span>1</span>
                <span>+</span>
                <span>3</span>
                <span>=</span>
              </div>
              <input
                type="text"
                value={formData.captcha}
                onChange={(e) => setFormData({ ...formData, captcha: e.target.value })}
                className="w-20 px-4 py-2 border border-border bg-transparent font-body text-lg focus:outline-none focus:border-primary transition-colors text-center rounded-lg"
                required
              />
              <span className="font-body text-sm text-muted-foreground">* Captcha Validation</span>
            </div>

            <button
              type="submit"
              className="font-body text-sm border border-foreground px-8 py-4 rounded-full hover:bg-foreground hover:text-background transition-all"
            >
              Send Mail
            </button>
          </motion.form>
        </div>

        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-32 border-t border-border"
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-12 py-16">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border border-foreground/20 flex items-center justify-center mb-4">
                  <MapPin className="h-5 w-5" />
                </div>
                <h6 className="font-display text-lg font-medium">Larnaca, Larnaka, Cyprus</h6>
                <p className="font-body text-sm text-muted-foreground">Address</p>
              </div>
              
              <div className="flex flex-col items-center">
                <p className="font-body text-2xl text-muted-foreground">. . .</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border border-foreground/20 flex items-center justify-center mb-4">
                  <Phone className="h-5 w-5" />
                </div>
                <h6 className="font-display text-lg font-medium">TBA</h6>
                <p className="font-body text-sm text-muted-foreground">Phone</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Copy Email Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="py-24 text-center"
        >
          <p className="font-display text-lg italic text-muted-foreground mb-4">Ready to work together?</p>
          <button 
            onClick={copyEmail}
            className="group inline-flex items-center gap-3 font-display text-4xl md:text-6xl font-medium hover:text-primary transition-colors"
          >
            <span>pixen@pixency.co</span>
            {copied ? (
              <Check className="h-8 w-8 text-primary" />
            ) : (
              <Copy className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
