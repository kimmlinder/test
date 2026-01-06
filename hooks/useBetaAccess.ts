import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

export function useBetaAccess() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [betaEnabled, setBetaEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchBetaStatus = useCallback(async () => {
    if (!user) {
      setBetaEnabled(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('beta_features_enabled')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setBetaEnabled(data?.beta_features_enabled ?? false);
    } catch (error) {
      console.error('Error fetching beta status:', error);
      setBetaEnabled(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBetaStatus();
  }, [fetchBetaStatus]);

  const toggleBetaAccess = async (enabled: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          beta_features_enabled: enabled,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
      setBetaEnabled(enabled);
      return { success: true };
    } catch (error) {
      console.error('Error updating beta status:', error);
      return { success: false, error };
    }
  };

  // Admins always have beta access, regular users need to opt-in
  const hasBetaAccess = isAdmin || betaEnabled;

  return {
    hasBetaAccess,
    betaEnabled,
    isAdmin,
    loading,
    toggleBetaAccess,
    refetch: fetchBetaStatus
  };
}
