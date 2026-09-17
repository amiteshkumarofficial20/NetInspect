import type { Flow } from '../../types';
import { AppIcon } from '../../lib/appIcons';
import { StatusBadge } from '../ui/Badge';
import { formatTime } from '../../lib/api';
import { cn } from '../../lib/utils';

interface SecurityEventsPanelProps {
  blockedFlows: Flow[];
  analysisTime: Date | null;
  isLoading: boolean;
  isLight: boolean;
  onViewAll?: () => void;
}

export function SecurityEventsPanel({
  blockedFlows,
  analysisTime,
  isLoading,
  isLight,
  onViewAll,
}: SecurityEventsPanelProps) {
  const timeStr = analysisTime ? formatTime(analysisTime) : '—';

  const th = cn(
    'text-left text-[10px] font-semibold uppercase tracking-wide pb-2 whitespace-nowrap',
    isLight ? 'text-gray-400' : 'text-muted',
  );
  const td = cn('py-2 text-xs font-mono whitespace-nowrap', isLight ? 'text-gray-700' : 'text-white/80');

  return (
    <div className="ni-card p-4 flex flex-col gap-3 overflow-hidden">
      <div className="flex items-center justify-between">
        <h3 className={cn('font-semibold text-sm', isLight ? 'text-gray-900' : 'text-white')}>
          Security Events
        </h3>
        <button onClick={onViewAll} className="text-xs text-accent-light hover:underline">
          View All →
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      ) : blockedFlows.length === 0 ? (
        /* Empty state — matches Image 3 reference */
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className={cn('text-xl mb-1 opacity-30')}>◎</div>
          <p className={cn('text-xs', isLight ? 'text-gray-400' : 'text-muted')}>
            No blocked flows detected.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full min-w-[480px]">
            <thead>
              <tr className={cn('border-b', isLight ? 'border-gray-100' : 'border-white/5')}>
                <th className={th}>Time</th>
                <th className={th}>Source</th>
                <th className={th}>Destination</th>
                <th className={th}>App</th>
                <th className={cn(th, 'text-right')}>Status</th>
              </tr>
            </thead>
            <tbody>
              {blockedFlows.slice(0, 6).map((flow, i) => (
                <tr
                  key={i}
                  className={cn(
                    'table-row-hover border-b',
                    isLight ? 'border-gray-50' : 'border-white/[0.03]',
                  )}
                >
                  <td className={cn(td, 'pr-2 text-[10px]')}>{timeStr}</td>
                  <td className={cn(td, 'text-[10px]')}>{flow.sourceIp}</td>
                  <td className={cn(td, 'text-[10px]')}>{flow.destinationIp}</td>
                  <td className={td}>
                    <div className="flex items-center gap-1.5">
                      <AppIcon name={flow.application} size={12} />
                      <span className="text-[10px]">{flow.application}</span>
                    </div>
                  </td>
                  <td className="py-2 text-right whitespace-nowrap">
                    <StatusBadge blocked={flow.blocked} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}