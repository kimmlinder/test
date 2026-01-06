import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Column {
  key: string;
  label: string;
  className?: string;
  hideOnMobile?: boolean;
}

interface ResponsiveTableProps {
  columns: Column[];
  data: any[];
  renderRow: (item: any, index: number) => ReactNode;
  renderMobileCard: (item: any, index: number) => ReactNode;
  emptyMessage?: string;
  className?: string;
}

export function ResponsiveTable({
  columns,
  data,
  renderRow,
  renderMobileCard,
  emptyMessage = 'No items found',
  className,
}: ResponsiveTableProps) {
  return (
    <div className={cn("bg-card border border-border rounded-2xl overflow-hidden", className)}>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-secondary/50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "text-left px-6 py-4 font-body text-sm font-medium text-muted-foreground",
                    col.hideOnMobile && "hidden lg:table-cell",
                    col.className
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((item, index) => renderRow(item, index))}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-border">
        {data.map((item, index) => renderMobileCard(item, index))}
        {data.length === 0 && (
          <div className="px-6 py-12 text-center text-muted-foreground">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}
