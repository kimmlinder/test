import { ReactNode } from 'react';
import { BetaLayout } from '@/components/layouts/BetaLayout';

interface MemberLayoutProps {
  children: ReactNode;
  showBreadcrumbs?: boolean;
}

export function MemberLayout({ children }: MemberLayoutProps) {
  return (
    <BetaLayout variant="member">
      {children}
    </BetaLayout>
  );
}
