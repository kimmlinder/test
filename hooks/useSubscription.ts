import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'free' | 'premium';
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  payment_reference: string | null;
  payment_method: string | null;
  amount: number | null;
  started_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setIsPremium(false);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      setSubscription(data as Subscription | null);
      setIsPremium(data?.plan_type === 'premium' && data?.status === 'active');
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const createPendingSubscription = async () => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      // Check if subscription already exists
      const { data: existing } = await supabase
        .from('user_subscriptions')
        .select('id, status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // If already pending or active, don't create new
        if (existing.status === 'pending' || existing.status === 'active') {
          return { data: existing, error: null };
        }
      }

      const { data, error } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          plan_type: 'premium',
          status: 'pending',
          payment_method: 'revolut',
          amount: 29,
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;

      setSubscription(data as Subscription);
      return { data, error: null };
    } catch (error) {
      console.error('Error creating subscription:', error);
      return { data: null, error };
    }
  };

  const hasPendingPayment = subscription?.status === 'pending';

  return {
    subscription,
    isLoading,
    isPremium,
    hasPendingPayment,
    createPendingSubscription,
    refetch: fetchSubscription,
  };
}
