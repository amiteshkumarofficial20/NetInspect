import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className, hover = false, padding = 'md' }: CardProps) {
  const padClass = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }[padding];

  return (
    <div
      className={cn(
        'ni-card',
        padClass,
        hover && 'transition-shadow duration-200 hover:shadow-card-hover cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  );
}
