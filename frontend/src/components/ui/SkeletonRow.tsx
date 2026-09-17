import { cn } from '../../lib/utils';

interface SkeletonRowProps {
  cols?: number;
  className?: string;
}

/** Single skeleton row for table loading states */
export function SkeletonRow({ cols = 5, className }: SkeletonRowProps) {
  return (
    <div className={cn('flex gap-3 px-4 py-2.5 items-center', className)}>
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-3 rounded flex-1"
          style={{ maxWidth: i === 0 ? '24px' : undefined, opacity: 1 - i * 0.1 }}
        />
      ))}
    </div>
  );
}

/** 4-state skeleton block (for cards, charts, etc.) */
export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-lg', className)} />;
}

/** Shimmer placeholder for a stat card value */
export function SkeletonStat() {
  return (
    <div className="space-y-2">
      <SkeletonBlock className="h-8 w-24" />
      <SkeletonBlock className="h-3 w-16" />
    </div>
  );
}
