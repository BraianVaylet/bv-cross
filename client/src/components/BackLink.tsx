import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon } from './Icons';

export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 rounded-lg text-sm font-medium text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
    >
      <ChevronLeftIcon className="h-4 w-4" />
      {children}
    </Link>
  );
}
