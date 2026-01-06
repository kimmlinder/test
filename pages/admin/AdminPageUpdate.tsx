import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { 
  Loader2, 
  Home,
  Sparkles,
  LayoutGrid,
  Package,
  FolderOpen,
  FileText,
  Briefcase,
  Building2
} from 'lucide-react';

// Import section components
import HomepageSection from '@/components/admin/page-update/HomepageSection';
import HighlightsSection from '@/components/admin/page-update/HighlightsSection';
import PlaygroundSection from '@/components/admin/page-update/PlaygroundSection';
import ProductsSection from '@/components/admin/page-update/ProductsSection';
import CategoriesSection from '@/components/admin/page-update/CategoriesSection';
import BlogSection from '@/components/admin/page-update/BlogSection';
import ProjectsSection from '@/components/admin/page-update/ProjectsSection';
import AgencySection from '@/components/admin/page-update/AgencySection';

const tabs = [
  { id: 'homepage', label: 'Homepage', icon: Home },
  { id: 'highlights', label: 'Highlights', icon: Sparkles },
  { id: 'playground', label: 'Playground', icon: LayoutGrid },
  { id: 'projects', label: 'Projects', icon: Briefcase },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'categories', label: 'Categories', icon: FolderOpen },
  { id: 'blog', label: 'Blog', icon: FileText },
  { id: 'agency', label: 'Agency', icon: Building2 },
];

export default function AdminPageUpdate() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [activeTab, setActiveTab] = useState('homepage');

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/member" replace />;
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground">
            Page Update
          </h1>
          <p className="text-muted-foreground font-body mt-1">
            Manage all your website content from one place
          </p>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Scrollable Tab List */}
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 mb-6">
            <TabsList className="inline-flex h-auto p-1 bg-muted/50 rounded-xl gap-1 min-w-max">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                    activeTab === tab.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <TabsContent value="homepage" className="mt-0">
              <HomepageSection />
            </TabsContent>
            <TabsContent value="highlights" className="mt-0">
              <HighlightsSection />
            </TabsContent>
            <TabsContent value="playground" className="mt-0">
              <PlaygroundSection />
            </TabsContent>
            <TabsContent value="projects" className="mt-0">
              <ProjectsSection />
            </TabsContent>
            <TabsContent value="products" className="mt-0">
              <ProductsSection />
            </TabsContent>
            <TabsContent value="categories" className="mt-0">
              <CategoriesSection />
            </TabsContent>
            <TabsContent value="blog" className="mt-0">
              <BlogSection />
            </TabsContent>
            <TabsContent value="agency" className="mt-0">
              <AgencySection />
            </TabsContent>
          </motion.div>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
