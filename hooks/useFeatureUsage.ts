import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type FeatureType = 'ai_creation' | 'mockup_generation' | 'custom_orders' | 'brand_assets';

interface DailyUsageData {
  usage_date: string;
  total_usage: number;
}

const FEATURE_LIMITS: Record<FeatureType, number> = {
  ai_creation: 10,
  mockup_generation: 5,
  custom_orders: 3,
  brand_assets: 10,
};

const PREMIUM_LIMITS: Record<FeatureType, number> = {
  ai_creation: 999999,
  mockup_generation: 999999,
  custom_orders: 999999,
  brand_assets: 999999,
};

const FEATURE_NAMES: Record<FeatureType, string> = {
  ai_creation: 'AI Media Creation',
  mockup_generation: 'Mockup Generation',
  custom_orders: 'Custom Orders',
  brand_assets: 'Brand Assets',
};

export function useFeatureUsage() {
  const { user } = useAuth();
  const [usageData, setUsageData] = useState<Record<string, number>>({});
  const [dailyUsage, setDailyUsage] = useState<DailyUsageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  const fetchUsage = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // Check subscription status
      const { data: subData } = await supabase
        .from('user_subscriptions')
        .select('plan_type, status')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setIsPremium(subData?.plan_type === 'premium' && subData?.status === 'active');

      // Get current month's start date
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Fetch usage data for the current month
      const { data, error } = await supabase
        .from('feature_usage')
        .select('feature_type, usage_count, usage_date')
        .eq('user_id', user.id)
        .gte('usage_date', monthStart.toISOString().split('T')[0]);

      if (error) throw error;

      // Aggregate by feature type
      const aggregated: Record<string, number> = {};
      (data || []).forEach((row) => {
        if (!aggregated[row.feature_type]) {
          aggregated[row.feature_type] = 0;
        }
        aggregated[row.feature_type] += row.usage_count;
      });

      setUsageData(aggregated);

      // Get last 7 days of data
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 6);
      
      const dailyData: Record<string, number> = {};
      (data || []).forEach((row) => {
        if (new Date(row.usage_date) >= weekAgo) {
          if (!dailyData[row.usage_date]) {
            dailyData[row.usage_date] = 0;
          }
          dailyData[row.usage_date] += row.usage_count;
        }
      });

      // Fill in missing days with 0
      const dailyArray: DailyUsageData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyArray.push({
          usage_date: dateStr,
          total_usage: dailyData[dateStr] || 0,
        });
      }
      
      setDailyUsage(dailyArray);
    } catch (error) {
      console.error('Error fetching feature usage:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const trackUsage = useCallback(async (featureType: FeatureType): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase.rpc('increment_feature_usage', {
        p_user_id: user.id,
        p_feature_type: featureType,
      });

      if (error) throw error;

      // Update local state immediately
      setUsageData(prev => ({
        ...prev,
        [featureType]: (prev[featureType] || 0) + 1,
      }));

      return true;
    } catch (error) {
      console.error('Error tracking feature usage:', error);
      return false;
    }
  }, [user]);

  const getUsage = useCallback((featureType: FeatureType) => usageData[featureType] || 0, [usageData]);
  
  const getLimit = useCallback((featureType: FeatureType) => {
    return isPremium ? PREMIUM_LIMITS[featureType] : FEATURE_LIMITS[featureType];
  }, [isPremium]);
  
  const getDisplayLimit = useCallback((featureType: FeatureType) => {
    return isPremium ? '∞' : FEATURE_LIMITS[featureType].toString();
  }, [isPremium]);
  
  const getFeatureName = useCallback((featureType: FeatureType) => FEATURE_NAMES[featureType], []);
  
  const isAtLimit = useCallback((featureType: FeatureType) => {
    if (isPremium) return false;
    return getUsage(featureType) >= getLimit(featureType);
  }, [getUsage, getLimit, isPremium]);
  
  const getRemainingUses = useCallback((featureType: FeatureType) => {
    if (isPremium) return 999999;
    return Math.max(0, getLimit(featureType) - getUsage(featureType));
  }, [getUsage, getLimit, isPremium]);

  const canUseFeature = useCallback((featureType: FeatureType): { allowed: boolean; message?: string } => {
    if (isPremium) return { allowed: true };
    
    const remaining = getRemainingUses(featureType);
    if (remaining <= 0) {
      return {
        allowed: false,
        message: `You've reached your monthly limit for ${FEATURE_NAMES[featureType]}. Upgrade to Premium for unlimited access.`,
      };
    }
    return { allowed: true };
  }, [getRemainingUses, isPremium]);

  return {
    usageData,
    dailyUsage,
    isLoading,
    isPremium,
    trackUsage,
    getUsage,
    getLimit,
    getDisplayLimit,
    getFeatureName,
    isAtLimit,
    getRemainingUses,
    canUseFeature,
    refetch: fetchUsage,
    limits: FEATURE_LIMITS,
  };
}
