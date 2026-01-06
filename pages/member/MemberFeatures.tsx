import { useState } from 'react';
import { motion } from 'framer-motion';
import { MemberLayout } from '@/components/member/MemberLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Wand2, 
  Image as ImageIcon, 
  FileText, 
  Palette, 
  Crown,
  Sparkles,
  Check,
  Infinity,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFeatureUsage, FeatureType } from '@/hooks/useFeatureUsage';
import { useLanguage } from '@/contexts/LanguageContext';
import { UpgradeDialog } from '@/components/member/UpgradeDialog';

interface FeatureConfig {
  id: FeatureType;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MemberFeatures() {
  const [timeRange, setTimeRange] = useState('week');
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const { usageData, dailyUsage, isLoading, getUsage, getLimit, refetch } = useFeatureUsage();
  const { t } = useLanguage();

  const featureConfigs = [
    {
      id: 'ai_creation' as FeatureType,
      name: t.aiMediaCreation,
      description: t.generateBriefs,
      icon: Wand2,
      color: 'text-amber-500',
    },
    {
      id: 'mockup_generation' as FeatureType,
      name: t.mockupGeneration,
      description: t.createMockups,
      icon: ImageIcon,
      color: 'text-emerald-500',
    },
    {
      id: 'custom_orders' as FeatureType,
      name: t.customOrders,
      description: t.submitRequests,
      icon: FileText,
      color: 'text-blue-500',
    },
    {
      id: 'brand_assets' as FeatureType,
      name: t.brandAssets,
      description: t.storeManageFiles,
      icon: Palette,
      color: 'text-purple-500',
    },
  ];

  const premiumFeature = {
    name: t.prioritySupport,
    description: t.dedicatedSupport,
    icon: Crown,
    benefits: [
      t.dedicatedManager,
      t.priorityQueue,
      t.responseGuarantee,
      t.exclusiveAccess,
      t.unlimitedRevisions,
    ],
  };

  const plans = [
    { name: t.aiMediaCreation, free: `10 ${t.perMonth}`, premium: t.unlimited },
    { name: t.mockupGeneration, free: `5 ${t.perMonth}`, premium: t.unlimited },
    { name: t.customOrders, free: `3 ${t.perMonth}`, premium: t.unlimited },
    { name: t.brandAssets, free: `10 ${t.files}`, premium: t.unlimited },
    { name: t.prioritySupport, free: '—', premium: t.included },
  ];

  const getProgressColor = (used: number, limit: number) => {
    const percentage = (used / limit) * 100;
    if (percentage >= 80) return 'bg-destructive';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-primary';
  };

  // Get max usage for chart scaling
  const maxDailyUsage = Math.max(...dailyUsage.map(d => d.total_usage), 1);

  return (
    <MemberLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="space-y-2">
            <h1 className="font-display text-3xl font-medium">
              {t.featureUsage}
            </h1>
            <p className="text-muted-foreground">
              {t.monitorUsage}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            {t.refresh}
          </Button>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Feature Usage Cards */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              {featureConfigs.map((feature, index) => {
                const used = getUsage(feature.id);
                const limit = getLimit(feature.id);
                const percentage = (used / limit) * 100;
                
                return (
                  <motion.div
                    key={feature.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="p-5 bg-card/50 border-border/50 hover:border-border transition-colors h-full">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                          "bg-gradient-to-br from-muted to-muted/50"
                        )}>
                          <feature.icon className={cn("w-6 h-6", feature.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={cn("font-medium mb-1", feature.color)}>
                            {feature.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          {isLoading ? (
                            <Skeleton className="h-4 w-20" />
                          ) : (
                            <>
                              <span className="text-muted-foreground">
                                {used} of {limit}
                              </span>
                              <span className={cn(
                                "text-xs font-medium",
                                percentage >= 80 ? "text-destructive" : 
                                percentage >= 50 ? "text-amber-500" : "text-muted-foreground"
                              )}>
                                {Math.round(percentage)}%
                              </span>
                            </>
                          )}
                        </div>
                        {isLoading ? (
                          <Skeleton className="h-2 w-full" />
                        ) : (
                          <Progress 
                            value={percentage} 
                            className="h-2"
                          />
                        )}
                        <Button 
                          className="w-full mt-3 bg-amber-500 hover:bg-amber-600 text-black gap-2"
                          size="sm"
                          onClick={() => setShowUpgradeDialog(true)}
                        >
                          <Crown className="w-4 h-4" />
                          {t.upgradeToPremium}
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Usage History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="p-6 bg-card/50 border-border/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{t.usageHistory}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t.trackUsageTime}
                      </p>
                    </div>
                  </div>
                  
                  <Tabs value={timeRange} onValueChange={setTimeRange}>
                    <TabsList className="bg-muted/50">
                      <TabsTrigger value="week" className="text-xs">7 Days</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Chart */}
                <div className="h-48 flex items-end justify-around gap-2 pt-8 border-t border-border/50">
                  {isLoading ? (
                    Array.from({ length: 7 }).map((_, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <Skeleton className="w-full h-20" />
                        <Skeleton className="h-4 w-8" />
                      </div>
                    ))
                  ) : (
                    dailyUsage.map((day, i) => {
                      const height = maxDailyUsage > 0 
                        ? (day.total_usage / maxDailyUsage) * 100 
                        : 0;
                      const date = new Date(day.usage_date);
                      const dayName = dayNames[date.getDay()];
                      
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                          <div className="w-full h-32 flex items-end">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${Math.max(height, 5)}%` }}
                              transition={{ delay: i * 0.1, duration: 0.5 }}
                              className={cn(
                                "w-full rounded-t-md transition-colors",
                                day.total_usage > 0 
                                  ? "bg-gradient-to-t from-primary to-primary/60" 
                                  : "bg-muted/50"
                              )}
                              title={`${day.total_usage} uses`}
                            />
                          </div>
                          <div className="text-center">
                            <span className="text-xs text-muted-foreground block">
                              {dayName}
                            </span>
                            {day.total_usage > 0 && (
                              <span className="text-xs font-medium text-primary">
                                {day.total_usage}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Total this month */}
                <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t.totalUsesMonth}</span>
                  <span className="text-lg font-display font-medium text-primary">
                    {isLoading ? (
                      <Skeleton className="h-6 w-8" />
                    ) : (
                      Object.values(usageData).reduce((a, b) => a + b, 0)
                    )}
                  </span>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Premium Feature Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6 bg-gradient-to-br from-card to-card/80 border-amber-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <premiumFeature.icon className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">{premiumFeature.name}</h3>
                    <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-xs">
                      {t.premiumOnly}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {t.notAvailableFree}
                </p>

                <div className="space-y-1 mb-4">
                  <p className="text-sm font-medium text-amber-500">{t.whatsIncluded}</p>
                  <ul className="space-y-2 mt-3">
                    {premiumFeature.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button 
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black gap-2"
                  onClick={() => setShowUpgradeDialog(true)}
                >
                  <Crown className="w-4 h-4" />
                  {t.upgradeToPremium}
                </Button>
              </Card>
            </motion.div>

            {/* Subscription Plans */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-6 bg-card/50 border-border/50">
                <h3 className="font-medium mb-1">{t.subscriptionPlans}</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {t.choosePlan}
                </p>

                {/* Plan Headers */}
                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <div />
                  <span className="text-sm font-medium text-muted-foreground">{t.free}</span>
                  <span className="text-sm font-medium text-amber-500">{t.premium}</span>
                </div>

                {/* Plan Features */}
                <div className="space-y-3">
                  {plans.map((plan, i) => (
                    <div key={i} className="grid grid-cols-3 gap-2 items-center text-sm py-2 border-t border-border/50 first:border-0">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground truncate">{plan.name}</span>
                      </div>
                      <span className="text-center text-muted-foreground text-xs">
                        {plan.free}
                      </span>
                      <div className="flex items-center justify-center gap-1 text-amber-500 text-xs">
                        {plan.premium === t.unlimited && <Infinity className="w-4 h-4" />}
                        {plan.premium}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Upgrade Dialog */}
      <UpgradeDialog 
        open={showUpgradeDialog} 
        onOpenChange={setShowUpgradeDialog} 
      />
    </MemberLayout>
  );
}
