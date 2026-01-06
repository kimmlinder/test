import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBetaAccess } from '@/hooks/useBetaAccess';
import { BetaLayout } from '@/components/layouts/BetaLayout';
import { CinemaStudio as CinemaStudioComponent } from '@/components/beta/CinemaStudio';
import { Skeleton } from '@/components/ui/skeleton';

export default function CinemaStudioPage() {
  const { user, loading: authLoading } = useAuth();
  const { hasBetaAccess, loading: betaLoading } = useBetaAccess();

  if (authLoading || betaLoading) {
    return (
      <BetaLayout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-6" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </BetaLayout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!hasBetaAccess) {
    return <Navigate to="/member" replace />;
  }

  return (
    <BetaLayout>
      <CinemaStudioComponent />
    </BetaLayout>
  );
}
