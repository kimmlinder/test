import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { ProgressRing } from './ProgressRing';
import { AnimatedCounter } from './AnimatedCounter';
import { 
  Award, 
  Star, 
  Zap, 
  ShoppingBag, 
  Heart,
  Crown,
  Gift,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GamificationCardProps {
  userId: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: typeof Award;
  color: string;
  earned: boolean;
}

interface LevelInfo {
  level: number;
  name: string;
  progress: number;
  pointsToNext: number;
  totalPoints: number;
}

export function GamificationCard({ userId }: GamificationCardProps) {
  const [levelInfo, setLevelInfo] = useState<LevelInfo>({
    level: 1,
    name: 'Newcomer',
    progress: 0,
    pointsToNext: 100,
    totalPoints: 0
  });
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateGamification();
  }, [userId]);

  const calculateGamification = async () => {
    try {
      // Fetch user's orders and wishlist to calculate points
      const [ordersRes, wishlistRes] = await Promise.all([
        supabase
          .from('orders')
          .select('total_amount, status')
          .eq('user_id', userId)
          .neq('status', 'cancelled'),
        supabase
          .from('wishlist')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
      ]);

      const orders = ordersRes.data || [];
      const wishlistCount = wishlistRes.count || 0;

      // Calculate points: $1 = 10 points, each order = 50 bonus points
      const spendingPoints = orders.reduce((sum, o) => sum + Number(o.total_amount) * 10, 0);
      const orderBonusPoints = orders.length * 50;
      const wishlistPoints = wishlistCount * 5;
      const totalPoints = Math.floor(spendingPoints + orderBonusPoints + wishlistPoints);

      // Calculate level
      const levels = [
        { min: 0, name: 'Newcomer' },
        { min: 100, name: 'Explorer' },
        { min: 500, name: 'Shopper' },
        { min: 1500, name: 'Regular' },
        { min: 5000, name: 'VIP' },
        { min: 10000, name: 'Elite' },
        { min: 25000, name: 'Legend' }
      ];

      let currentLevel = 1;
      let levelName = 'Newcomer';
      let nextThreshold = 100;

      for (let i = levels.length - 1; i >= 0; i--) {
        if (totalPoints >= levels[i].min) {
          currentLevel = i + 1;
          levelName = levels[i].name;
          nextThreshold = levels[i + 1]?.min || levels[i].min;
          break;
        }
      }

      const prevThreshold = levels[currentLevel - 1]?.min || 0;
      const progress = nextThreshold > prevThreshold 
        ? ((totalPoints - prevThreshold) / (nextThreshold - prevThreshold)) * 100
        : 100;

      setLevelInfo({
        level: currentLevel,
        name: levelName,
        progress: Math.min(progress, 100),
        pointsToNext: Math.max(0, nextThreshold - totalPoints),
        totalPoints
      });

      // Calculate badges
      const earnedBadges: Badge[] = [
        {
          id: 'first-order',
          name: 'First Step',
          description: 'Place your first order',
          icon: ShoppingBag,
          color: 'text-blue-500 bg-blue-500/20',
          earned: orders.length >= 1
        },
        {
          id: 'five-orders',
          name: 'Loyal Customer',
          description: 'Complete 5 orders',
          icon: Star,
          color: 'text-amber-500 bg-amber-500/20',
          earned: orders.length >= 5
        },
        {
          id: 'big-spender',
          name: 'Big Spender',
          description: 'Spend over $500',
          icon: Crown,
          color: 'text-purple-500 bg-purple-500/20',
          earned: spendingPoints >= 5000
        },
        {
          id: 'wishlist-pro',
          name: 'Wishlist Pro',
          description: 'Add 10 items to wishlist',
          icon: Heart,
          color: 'text-pink-500 bg-pink-500/20',
          earned: wishlistCount >= 10
        },
        {
          id: 'speed-shopper',
          name: 'Speed Shopper',
          description: 'Place 3 orders in a month',
          icon: Zap,
          color: 'text-cyan-500 bg-cyan-500/20',
          earned: checkMonthlyOrders(orders, 3)
        },
        {
          id: 'vip-status',
          name: 'VIP Status',
          description: 'Reach VIP level',
          icon: Gift,
          color: 'text-green-500 bg-green-500/20',
          earned: currentLevel >= 5
        }
      ];

      setBadges(earnedBadges);
    } catch (error) {
      console.error('Error calculating gamification:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkMonthlyOrders = (orders: { status: string }[], required: number): boolean => {
    // Simplified check - in real app would check actual dates
    return orders.length >= required;
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-3xl p-8 animate-pulse">
        <div className="h-32 bg-muted rounded-xl" />
      </div>
    );
  }

  const earnedCount = badges.filter(b => b.earned).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-3xl p-8"
    >
      {/* Level Progress */}
      <div className="flex items-center gap-6 mb-8">
        <ProgressRing 
          progress={levelInfo.progress} 
          size={100} 
          strokeWidth={8}
          color="hsl(var(--primary))"
        >
          <div className="text-center">
            <span className="font-display text-2xl font-bold">{levelInfo.level}</span>
          </div>
        </ProgressRing>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Award className="h-5 w-5 text-primary" />
            <span className="font-display text-xl font-medium">{levelInfo.name}</span>
          </div>
          <p className="text-muted-foreground text-sm font-body mb-2">
            <AnimatedCounter value={levelInfo.totalPoints} className="font-medium text-foreground" /> points
          </p>
          <div className="w-full bg-muted rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${levelInfo.progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-primary rounded-full"
            />
          </div>
          <p className="text-muted-foreground text-xs mt-1">
            {levelInfo.pointsToNext > 0 
              ? `${levelInfo.pointsToNext} points to next level`
              : 'Max level reached!'
            }
          </p>
        </div>
      </div>

      {/* Badges */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-medium">Badges</h3>
          <span className="text-muted-foreground text-sm">{earnedCount}/{badges.length} earned</span>
        </div>
        
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            
            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, type: 'spring' }}
                className={cn(
                  'relative flex flex-col items-center p-4 rounded-2xl transition-all group cursor-pointer',
                  badge.earned 
                    ? 'bg-secondary hover:bg-secondary/80' 
                    : 'bg-muted/30 opacity-50'
                )}
                title={badge.description}
              >
                <div className={cn(
                  'p-3 rounded-xl mb-2 transition-transform group-hover:scale-110',
                  badge.earned ? badge.color : 'bg-muted text-muted-foreground'
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-body text-center leading-tight">
                  {badge.name}
                </span>
                {!badge.earned && (
                  <Target className="absolute top-2 right-2 h-3 w-3 text-muted-foreground" />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
