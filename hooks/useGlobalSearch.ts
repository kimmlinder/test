import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  type: 'product' | 'order' | 'project' | 'user' | 'blog' | 'scene_plan';
  id: string;
  title: string;
  description?: string;
  url: string;
}

export function useGlobalSearch(query: string) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const searchResults: SearchResult[] = [];

    try {
      // Search products
      const { data: products } = await supabase
        .from('products')
        .select('id, name, description')
        .ilike('name', `%${searchQuery}%`)
        .limit(5);

      if (products) {
        searchResults.push(...products.map(p => ({
          type: 'product' as const,
          id: p.id,
          title: p.name,
          description: p.description || undefined,
          url: '/member/shop'
        })));
      }

      // Search orders
      const { data: orders } = await supabase
        .from('orders')
        .select('id, status, customer_name')
        .or(`id.ilike.%${searchQuery}%,customer_name.ilike.%${searchQuery}%`)
        .limit(5);

      if (orders) {
        searchResults.push(...orders.map(o => ({
          type: 'order' as const,
          id: o.id,
          title: `Order ${o.id.slice(0, 8)}...`,
          description: o.customer_name || o.status,
          url: `/member/orders/${o.id}`
        })));
      }

      // Search projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id, title, description, slug')
        .ilike('title', `%${searchQuery}%`)
        .limit(5);

      if (projects) {
        searchResults.push(...projects.map(p => ({
          type: 'project' as const,
          id: p.id,
          title: p.title,
          description: p.description || undefined,
          url: `/project/${p.slug}`
        })));
      }

      // Search blog posts
      const { data: posts } = await supabase
        .from('blog_posts')
        .select('id, title, excerpt, slug')
        .ilike('title', `%${searchQuery}%`)
        .eq('published', true)
        .limit(5);

      if (posts) {
        searchResults.push(...posts.map(p => ({
          type: 'blog' as const,
          id: p.id,
          title: p.title,
          description: p.excerpt || undefined,
          url: `/blog#${p.slug}`
        })));
      }

      // Search scene plans
      const { data: scenePlans } = await supabase
        .from('scene_plans')
        .select('id, project_name, video_description')
        .ilike('project_name', `%${searchQuery}%`)
        .limit(5);

      if (scenePlans) {
        searchResults.push(...scenePlans.map(s => ({
          type: 'scene_plan' as const,
          id: s.id,
          title: s.project_name,
          description: s.video_description || undefined,
          url: '/member/scene-plans'
        })));
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, search]);

  return { results, loading };
}
