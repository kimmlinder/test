import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ColorThemeProvider } from "@/contexts/ColorThemeContext";
import { BackgroundProvider } from "@/contexts/BackgroundContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

import Index from "./pages/Index";
import Highlights from "./pages/Highlights";
import Portfolio from "./pages/Portfolio";
import Playground from "./pages/Playground";
import About from "./pages/About";
import Resources from "./pages/Resources";
import Blog from "./pages/Blog";
import Shop from "./pages/Shop";
import Contact from "./pages/Contact";
import ProjectDetail from "./pages/ProjectDetail";
import Auth from "./pages/Auth";
import Checkout from "./pages/Checkout";
import PaymentConfirmation from "./pages/PaymentConfirmation";
import Order from "./pages/Order";
import CustomOrder from "./pages/CustomOrder";
import MemberDashboard from "./pages/member/MemberDashboard";
import MemberShop from "./pages/member/MemberShop";
import MemberOrders from "./pages/member/MemberOrders";
import MemberOrderDetail from "./pages/member/MemberOrderDetail";
import MemberWishlist from "./pages/member/MemberWishlist";
import MemberNotifications from "./pages/member/MemberNotifications";
import MemberSettings from "./pages/member/MemberSettings";
import MemberAICreator from "./pages/member/MemberAICreator";
import MemberFeatures from "./pages/member/MemberFeatures";
import MemberScenePlans from "./pages/member/MemberScenePlans";
import BetaPlayground from "./pages/member/BetaPlayground";
import BetaSettings from "./pages/member/BetaSettings";
import CinemaStudio from "./pages/member/CinemaStudio";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminBlog from "./pages/admin/AdminBlog";
import AdminProjects from "./pages/admin/AdminProjects";
import AdminTeam from "./pages/admin/AdminTeam";
import AdminAgencySettings from "./pages/admin/AdminAgencySettings";
import AdminHomepage from "./pages/admin/AdminHomepage";
import AdminHighlights from "./pages/admin/AdminHighlights";
import AdminPaymentSettings from "./pages/admin/AdminPaymentSettings";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminNewsletter from "./pages/admin/AdminNewsletter";
import AdminPlayground from "./pages/admin/AdminPlayground";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";
import AdminPageUpdate from "./pages/admin/AdminPageUpdate";
import AdminBetaFeedback from "./pages/admin/AdminBetaFeedback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ColorThemeProvider>
        <BackgroundProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthProvider>
                <LanguageProvider>
                  <CartProvider>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/highlights" element={<Highlights />} />
                    <Route path="/portfolio" element={<Portfolio />} />
                    <Route path="/playground" element={<Playground />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/resources" element={<Resources />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/project/:id" element={<ProjectDetail />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/payment-confirmation" element={<PaymentConfirmation />} />
                    <Route path="/order" element={<Order />} />
                    <Route path="/custom-order" element={<CustomOrder />} />
                    <Route path="/member" element={<MemberDashboard />} />
                    <Route path="/member/shop" element={<MemberShop />} />
                    <Route path="/member/orders" element={<MemberOrders />} />
                    <Route path="/member/orders/:id" element={<MemberOrderDetail />} />
                    <Route path="/member/wishlist" element={<MemberWishlist />} />
                    <Route path="/member/notifications" element={<MemberNotifications />} />
                    <Route path="/member/settings" element={<MemberSettings />} />
                    <Route path="/member/ai-creator" element={<MemberAICreator />} />
                    <Route path="/member/features" element={<MemberFeatures />} />
                    <Route path="/member/scene-plans" element={<MemberScenePlans />} />
                    <Route path="/member/beta-playground" element={<BetaPlayground />} />
                    <Route path="/member/beta-settings" element={<BetaSettings />} />
                    <Route path="/member/cinema-studio" element={<CinemaStudio />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/page-update" element={<AdminPageUpdate />} />
                    <Route path="/admin/users" element={<AdminUsers />} />
                    <Route path="/admin/orders" element={<AdminOrders />} />
                    <Route path="/admin/payment-settings" element={<AdminPaymentSettings />} />
                    <Route path="/admin/settings" element={<AdminSettings />} />
                    <Route path="/admin/newsletter" element={<AdminNewsletter />} />
                    <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
                    <Route path="/admin/beta-feedback" element={<AdminBetaFeedback />} />
                    {/* Redirect old routes to Page Update */}
                    <Route path="/admin/homepage" element={<AdminPageUpdate />} />
                    <Route path="/admin/highlights" element={<AdminPageUpdate />} />
                    <Route path="/admin/playground" element={<AdminPageUpdate />} />
                    <Route path="/admin/products" element={<AdminPageUpdate />} />
                    <Route path="/admin/categories" element={<AdminPageUpdate />} />
                    <Route path="/admin/blog" element={<AdminPageUpdate />} />
                    <Route path="/admin/projects" element={<AdminPageUpdate />} />
                    <Route path="/admin/team" element={<AdminPageUpdate />} />
                    <Route path="/admin/agency-settings" element={<AdminPageUpdate />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  </CartProvider>
                </LanguageProvider>
              </AuthProvider>
            </BrowserRouter>
        </BackgroundProvider>
      </ColorThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
