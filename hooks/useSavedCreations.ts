import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SavedCreation {
  id: string;
  creation_type: string;
  title: string;
  content: string | null;
  image_url: string | null;
  metadata: Record<string, any>;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export function useSavedCreations(type?: string) {
  const { user } = useAuth();
  const [creations, setCreations] = useState<SavedCreation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCreations = useCallback(async () => {
    if (!user) {
      setCreations([]);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('ai_creations' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (type) {
        query = query.eq('creation_type', type);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCreations((data as unknown as SavedCreation[]) || []);
    } catch (error) {
      console.error('Error fetching creations:', error);
      setCreations([]);
    } finally {
      setLoading(false);
    }
  }, [user, type]);

  useEffect(() => {
    fetchCreations();
  }, [fetchCreations]);

  const saveCreation = async (creation: {
    creation_type: string;
    title: string;
    content?: string;
    image_url?: string;
    metadata?: Record<string, any>;
  }) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { data, error } = await supabase
        .from('ai_creations' as any)
        .insert({
          user_id: user.id,
          ...creation,
        } as any)
        .select()
        .single();

      if (error) throw error;
      
      setCreations(prev => [data as unknown as SavedCreation, ...prev]);
      return { success: true, data: data as unknown as SavedCreation };
    } catch (error) {
      console.error('Error saving creation:', error);
      return { success: false, error };
    }
  };

  const toggleFavorite = async (id: string) => {
    const creation = creations.find(c => c.id === id);
    if (!creation) return { success: false };

    try {
      const { error } = await supabase
        .from('ai_creations' as any)
        .update({ is_favorite: !creation.is_favorite } as any)
        .eq('id', id);

      if (error) throw error;
      
      setCreations(prev => prev.map(c => 
        c.id === id ? { ...c, is_favorite: !c.is_favorite } : c
      ));
      return { success: true };
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return { success: false, error };
    }
  };

  const deleteCreation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ai_creations' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setCreations(prev => prev.filter(c => c.id !== id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting creation:', error);
      return { success: false, error };
    }
  };

  return {
    creations,
    loading,
    saveCreation,
    toggleFavorite,
    deleteCreation,
    refetch: fetchCreations,
  };
}
