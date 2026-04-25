import { Inbox } from 'lucide-react';
import React from 'react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = 'No data found',
  description = 'Nothing to display here yet.',
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-slate-600">
        {icon ?? <Inbox className="h-12 w-12" />}
      </div>
      <p className="text-base font-medium text-slate-300">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}
