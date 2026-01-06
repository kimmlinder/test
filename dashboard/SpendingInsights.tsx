import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { AnimatedCounter } from './AnimatedCounter';
import { ProgressRing } from './ProgressRing';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag,
  Calendar,
  DollarSign
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface SpendingInsightsProps {
  userId: string;
}

interface MonthlySpending {
  month: string;
  amount: number;
}

export function SpendingInsights({ userId }: SpendingInsightsProps) {
  const [totalSpent, setTotalSpent] = useState(0);
  const [monthlyData, setMonthlyData] = useState<MonthlySpending[]>([]);
  const [orderCount, setOrderCount] = useState(0);
  const [averageOrder, setAverageOrder] = useState(0);
  const [trend, setTrend] = useState<'up' | 'down' | 'neutral'>('neutral');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpendingData();
  }, [userId]);

  const fetchSpendingData = async () => {
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, created_at, status')
        .eq('user_id', userId)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: true });

      if (!orders || orders.length === 0) {
        setLoading(false);
        return;
      }

      // Calculate totals
      const total = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
      setTotalSpent(total);
      setOrderCount(orders.length);
      setAverageOrder(total / orders.length);

      // Group by month
      const monthlyMap = new Map<string, number>();
      orders.forEach(order => {
        const date = new Date(order.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short' });
        monthlyMap.set(monthLabel, (monthlyMap.get(monthLabel) || 0) + Number(order.total_amount));
      });

      const monthlyArray = Array.from(monthlyMap.entries()).map(([month, amount]) => ({
        month,
        amount
      }));
      setMonthlyData(monthlyArray);

      // Calculate trend (compare last 2 months)
      if (monthlyArray.length >= 2) {
        const lastMonth = monthlyArray[monthlyArray.length - 1].amount;
        const previousMonth = monthlyArray[monthlyArray.length - 2].amount;
        setTrend(lastMonth > previousMonth ? 'up' : lastMonth < previousMonth ? 'down' : 'neutral');
      }
    } catch (error) {
      console.error('Error fetching spending data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-2xl" />
        ))}
      </div>
    );
  }

  if (orderCount === 0) {
    return (
      <div className="text-center py-12 bg-secondary/30 rounded-3xl">
        <DollarSign className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <p className="text-muted-foreground font-body">No spending data yet</p>
        <p className="text-muted-foreground/60 text-sm">Start shopping to see insights</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-500/20 to-green-600/5 border border-border/50 rounded-2xl p-5"
        >
          <DollarSign className="h-6 w-6 text-green-500 mb-2" />
          <AnimatedCounter
            value={totalSpent}
            prefix="$"
            decimals={2}
            className="font-display text-2xl font-medium block"
          />
          <p className="text-muted-foreground text-xs mt-1">Total Spent</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-border/50 rounded-2xl p-5"
        >
          <ShoppingBag className="h-6 w-6 text-blue-500 mb-2" />
          <AnimatedCounter
            value={orderCount}
            className="font-display text-2xl font-medium block"
          />
          <p className="text-muted-foreground text-xs mt-1">Total Orders</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500/20 to-purple-600/5 border border-border/50 rounded-2xl p-5"
        >
          <Calendar className="h-6 w-6 text-purple-500 mb-2" />
          <AnimatedCounter
            value={averageOrder}
            prefix="$"
            decimals={2}
            className="font-display text-2xl font-medium block"
          />
          <p className="text-muted-foreground text-xs mt-1">Avg. Order</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-border/50 rounded-2xl p-5 flex items-center gap-4"
        >
          <div className="flex-1">
            {trend === 'up' ? (
              <TrendingUp className="h-6 w-6 text-green-500 mb-2" />
            ) : trend === 'down' ? (
              <TrendingDown className="h-6 w-6 text-red-500 mb-2" />
            ) : (
              <TrendingUp className="h-6 w-6 text-amber-500 mb-2" />
            )}
            <p className="font-display text-sm font-medium">
              {trend === 'up' ? 'Increasing' : trend === 'down' ? 'Decreasing' : 'Stable'}
            </p>
            <p className="text-muted-foreground text-xs mt-1">Monthly Trend</p>
          </div>
        </motion.div>
      </div>

      {/* Spending chart */}
      {monthlyData.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <h3 className="font-display text-lg font-medium mb-4">Spending Over Time</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  hide 
                  domain={['dataMin - 10', 'dataMax + 10']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    padding: '8px 12px'
                  }}
                  formatter={(value: number) => [`€${value.toFixed(2)}`, 'Spent']}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#spendingGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
    </div>
  );
}
