import { motion } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  Package, 
  Truck, 
  Home,
  XCircle,
  Eye,
  ThumbsUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineStep {
  status: string;
  label: string;
  timestamp?: string;
  message?: string;
}

interface OrderTimelineProps {
  currentStatus: string;
  timeline?: TimelineStep[];
  className?: string;
}

const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-amber-500', label: 'Pending' },
  accepted: { icon: CheckCircle, color: 'text-blue-500', label: 'Accepted' },
  in_progress: { icon: Package, color: 'text-purple-500', label: 'In Progress' },
  preview_sent: { icon: Eye, color: 'text-cyan-500', label: 'Preview Sent' },
  confirmed: { icon: ThumbsUp, color: 'text-emerald-500', label: 'Confirmed' },
  processing: { icon: Package, color: 'text-indigo-500', label: 'Processing' },
  shipped: { icon: Truck, color: 'text-blue-500', label: 'Shipped' },
  delivered: { icon: Home, color: 'text-green-500', label: 'Delivered' },
  cancelled: { icon: XCircle, color: 'text-destructive', label: 'Cancelled' }
};

const defaultSteps = ['pending', 'accepted', 'in_progress', 'processing', 'shipped', 'delivered'];

export function OrderTimeline({ currentStatus, timeline, className }: OrderTimelineProps) {
  const currentIndex = defaultSteps.indexOf(currentStatus);
  const isCancelled = currentStatus === 'cancelled';

  return (
    <div className={cn('relative', className)}>
      <div className="flex items-center justify-between">
        {defaultSteps.map((status, index) => {
          const config = statusConfig[status];
          const Icon = config.icon;
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div key={status} className="flex flex-col items-center relative flex-1">
              {/* Connector line */}
              {index < defaultSteps.length - 1 && (
                <div className="absolute top-5 left-1/2 w-full h-0.5 bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: isCompleted ? '100%' : '0%' }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="h-full bg-primary"
                  />
                </div>
              )}
              
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1, type: 'spring' }}
                className={cn(
                  'relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                  isCompleted && 'bg-primary border-primary',
                  isCurrent && 'bg-primary/20 border-primary',
                  isPending && 'bg-muted border-muted-foreground/20',
                  isCancelled && index >= currentIndex && 'bg-destructive/20 border-destructive'
                )}
              >
                <Icon className={cn(
                  'h-5 w-5',
                  isCompleted && 'text-primary-foreground',
                  isCurrent && config.color,
                  isPending && 'text-muted-foreground/50'
                )} />
              </motion.div>
              
              {/* Label */}
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.2 }}
                className={cn(
                  'mt-2 text-xs font-body text-center',
                  isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}
              >
                {config.label}
              </motion.span>
            </div>
          );
        })}
      </div>

      {/* Timeline details */}
      {timeline && timeline.length > 0 && (
        <div className="mt-8 space-y-3">
          {timeline.map((step, index) => {
            const config = statusConfig[step.status] || statusConfig.pending;
            const Icon = config.icon;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 p-3 bg-secondary/30 rounded-xl"
              >
                <div className={cn('p-2 rounded-lg', `${config.color.replace('text-', 'bg-')}/20`)}>
                  <Icon className={cn('h-4 w-4', config.color)} />
                </div>
                <div className="flex-1">
                  <p className="font-body text-sm font-medium">{step.label}</p>
                  {step.message && (
                    <p className="text-muted-foreground text-xs">{step.message}</p>
                  )}
                </div>
                {step.timestamp && (
                  <span className="text-muted-foreground text-xs">
                    {new Date(step.timestamp).toLocaleDateString()}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
