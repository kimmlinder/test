import { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ArrowDown, Clock, Loader2, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { YouTubeEmbed } from '@/components/YouTubeEmbed';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import hero1 from '@/assets/hero-1.jpg';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  image_url: string | null;
  youtube_url: string | null;
  author_name: string | null;
  published_at: string | null;
  created_at: string;
}

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const heroRef = useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.3]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, content, image_url, youtube_url, author_name, published_at, created_at')
        .eq('published', true)
        .order('published_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const featuredPost = posts[0];
  const otherPosts = posts.slice(1);

  const scrollToContent = () => {
    document.getElementById('blog-content')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section ref={heroRef} className="min-h-screen flex flex-col justify-center items-center text-center pt-20 relative overflow-hidden">
        {/* Background Image with Parallax */}
        <motion.div 
          className="absolute inset-0 z-0"
          style={{ y }}
        >
          <motion.img
            src={hero1}
            alt="Blog hero"
            className="w-full h-full object-cover scale-110"
            style={{ opacity }}
          />
          <div className="absolute inset-0 bg-background/70" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="px-6 relative z-10"
        >
          <p className="font-body text-sm text-muted-foreground uppercase tracking-wider mb-4">
            Stories & Insights
          </p>
          <h1 className="font-display text-7xl md:text-9xl font-medium mb-6">
            blog
          </h1>
          <div className="font-body text-lg text-muted-foreground max-w-xl mx-auto">
            <p>Insights, tutorials, and behind-the-scenes</p>
            <p className="font-display italic">looks at our creative process</p>
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
            Latest Articles
          </span>
        </motion.div>
      </section>

      {/* Blog Content */}
      <main id="blog-content" className="pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">No blog posts yet. Check back soon!</p>
            </div>
          ) : (
            <>
              {/* Featured Post */}
              {featuredPost && (
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="mb-24 pt-16 border-t border-border"
                >
                  <div className="group block cursor-pointer" onClick={() => setSelectedPost(featuredPost)}>
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                      {featuredPost.youtube_url ? (
                        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-secondary">
                          <img
                            src={`https://img.youtube.com/vi/${featuredPost.youtube_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)?.[1]}/maxresdefault.jpg`}
                            alt={featuredPost.title}
                            className="w-full h-full object-cover img-zoom"
                          />
                          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors flex items-center justify-center">
                            <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center">
                              <Play className="h-8 w-8 text-primary-foreground ml-1" fill="currentColor" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                          <img
                            src={featuredPost.image_url || hero1}
                            alt={featuredPost.title}
                            className="w-full h-full object-cover img-zoom"
                          />
                          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-4 mb-6">
                          <span className="font-body text-sm text-muted-foreground flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            5 min read
                          </span>
                        </div>
                        <h2 className="font-display text-4xl md:text-5xl font-medium mb-6 group-hover:text-primary transition-colors leading-tight">
                          {featuredPost.title}
                        </h2>
                        <p className="font-body text-lg text-muted-foreground mb-8">
                          {featuredPost.excerpt || 'Read more about this article...'}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="font-body text-sm text-muted-foreground">
                            {formatDate(featuredPost.published_at || featuredPost.created_at)}
                          </span>
                          <span className="flex items-center gap-3 font-body text-sm group-hover:text-primary transition-colors">
                            Read Article 
                            <div className="w-10 h-10 rounded-full border border-foreground/20 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all">
                              <ArrowRight className="h-4 w-4 group-hover:text-primary-foreground transition-colors" />
                            </div>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Other Posts */}
              {otherPosts.length > 0 && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {otherPosts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                    >
                      <div className="group block cursor-pointer" onClick={() => setSelectedPost(post)}>
                        {post.youtube_url ? (
                          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-secondary">
                            <img
                              src={`https://img.youtube.com/vi/${post.youtube_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)?.[1]}/maxresdefault.jpg`}
                              alt={post.title}
                              className="w-full h-full object-cover img-zoom"
                            />
                            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors flex items-center justify-center">
                              <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center">
                                <Play className="h-6 w-6 text-primary-foreground ml-1" fill="currentColor" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-6">
                            <img
                              src={post.image_url || hero1}
                              alt={post.title}
                              className="w-full h-full object-cover img-zoom"
                            />
                            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors" />
                          </div>
                        )}
                        <div className="flex items-center gap-4 mb-4">
                          <span className="font-body text-sm text-muted-foreground">
                            {formatDate(post.published_at || post.created_at)}
                          </span>
                          <span className="font-body text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            5 min read
                          </span>
                        </div>
                        <h3 className="font-display text-2xl font-medium mb-3 group-hover:text-primary transition-colors leading-tight">
                          {post.title}
                        </h3>
                        <p className="font-body text-muted-foreground line-clamp-2">
                          {post.excerpt || 'Read more about this article...'}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />

      {/* Article Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedPost && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl md:text-3xl font-medium leading-tight">
                  {selectedPost.title}
                </DialogTitle>
                <div className="flex items-center gap-4 pt-2">
                  <span className="font-body text-sm text-muted-foreground">
                    {formatDate(selectedPost.published_at || selectedPost.created_at)}
                  </span>
                  {selectedPost.author_name && (
                    <span className="font-body text-sm text-muted-foreground">
                      by {selectedPost.author_name}
                    </span>
                  )}
                </div>
              </DialogHeader>
              <div className="mt-6 space-y-6">
                {selectedPost.youtube_url ? (
                  <YouTubeEmbed url={selectedPost.youtube_url} />
                ) : (
                  <div className="aspect-video rounded-xl overflow-hidden">
                    <img
                      src={selectedPost.image_url || hero1}
                      alt={selectedPost.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="font-body text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {selectedPost.content}
                </div>

                {/* Related Posts */}
                {posts.filter(p => p.id !== selectedPost.id).length > 0 && (
                  <div className="pt-8 border-t border-border">
                    <h3 className="font-display text-xl font-medium mb-6">Related Articles</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {posts
                        .filter(p => p.id !== selectedPost.id)
                        .slice(0, 2)
                        .map((post) => (
                          <div
                            key={post.id}
                            className="group cursor-pointer flex gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                            onClick={() => setSelectedPost(post)}
                          >
                            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                              {post.youtube_url ? (
                                <img
                                  src={`https://img.youtube.com/vi/${post.youtube_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)?.[1]}/mqdefault.jpg`}
                                  alt={post.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <img
                                  src={post.image_url || hero1}
                                  alt={post.title}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-display text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                                {post.title}
                              </h4>
                              <span className="font-body text-xs text-muted-foreground mt-1 block">
                                {formatDate(post.published_at || post.created_at)}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Blog;
