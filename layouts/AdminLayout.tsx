import { ReactNode } from 'react';
import { BetaLayout } from '@/components/layouts/BetaLayout';

interface AdminLayoutProps {
  children: ReactNode;
  showBreadcrumbs?: boolean;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <BetaLayout variant="admin">
      {children}
    </BetaLayout>
  );
}
