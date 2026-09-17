import { cn } from '../../lib/utils';

interface ProgressBarProps {
  value: number;        // 0–100
  color?: 'cyan' | 'green' | 'red' | 'amber' | 'purple' | 'gray';
  height?: 'sm' | 'md' | 'lg';
  className?: string;
  animated?: boolean;
  showLabel?: boolean;
}

const COLOR_MAP: Record<string, string> = {
  cyan: 'from-accent to-accent-light',
  green: 'from-success to-emerald-400',
  red: 'from-danger to-rose-400',
  amber: 'from-warn to-yellow-300',
  purple: 'from-purple to-violet-400',
  gray: 'from-muted to-slate-400',
};

const HEIGHT_MAP: Record<string, string> = {
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2',
};

export function ProgressBar({
  value,
  color = 'cyan',
  height = 'md',
  className,
  animated = false,
  showLabel = false,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'w-full rounded-full bg-white/5 overflow-hidden',
          HEIGHT_MAP[height],
        )}
      >
        <div
          className={cn(
            'h-full rounded-full bg-gradient-to-r transition-all duration-500',
            COLOR_MAP[color],
            animated && 'animate-pulse-slow',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-muted mt-0.5 block text-right">{pct.toFixed(1)}%</span>
      )}
    </div>
  );
}
