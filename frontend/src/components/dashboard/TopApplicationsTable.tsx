import type { AppEntry } from '../../types';
import { AppIcon } from '../../lib/appIcons';
import { formatNumber, formatBytes } from '../../lib/api';
import { SkeletonRow } from '../ui/SkeletonRow';
import { cn } from '../../lib/utils';

interface TopApplicationsTableProps {
  applications: AppEntry[];
  isLoading: boolean;
  isLight: boolean;
  onViewAll?: () => void;
  searchQuery?: string;
}

export function TopApplicationsTable({
  applications,
  isLoading,
  isLight,
  onViewAll,
  searchQuery = '',
}: TopApplicationsTableProps) {
  const filtered = searchQuery
    ? applications.filter((a) =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : applications;

  const rows = filtered.slice(0, 5);

  const th = cn('text-left text-[10px] font-semibold uppercase tracking-wide pb-2',
    isLight ? 'text-gray-400' : 'text-muted');
  const td = cn('py-2 text-xs', isLight ? 'text-gray-700' : 'text-white/80');
  const muted = cn('text-xs', isLight ? 'text-gray-400' : 'text-muted');

  return (
    <div className="ni-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className={cn('font-semibold text-sm', isLight ? 'text-gray-900' : 'text-white')}>
          Top Applications
        </h3>
        <button onClick={onViewAll} className="text-xs text-accent-light hover:underline">
          View All →
        </button>
      </div>

      <table className="w-full">
        <thead>
          <tr className={cn('border-b', isLight ? 'border-gray-100' : 'border-white/5')}>
            <th className={cn(th, 'w-6')}>#</th>
            <th className={th}>Application</th>
            <th className={cn(th, 'text-right')}>Packets</th>
            <th className={cn(th, 'text-right')}>Bytes</th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={4}>
                    <SkeletonRow cols={4} />
                  </td>
                </tr>
              ))
            : rows.length === 0
            ? (
              <tr>
                <td colSpan={4} className="py-6 text-center">
                  <span className={muted}>No data yet</span>
                </td>
              </tr>
            )
            : rows.map((app, i) => (
              <tr
                key={app.name}
                className={cn(
                  'table-row-hover border-b',
                  isLight ? 'border-gray-50' : 'border-white/[0.03]',
                )}
              >
                <td className={cn(td, 'pr-2 text-muted')}>{filtered.indexOf(app) + 1}</td>
                <td className={td}>
                  <div className="flex items-center gap-2">
                    <AppIcon name={app.name} size={14} />
                    <span className="font-medium">{app.name}</span>
                  </div>
                </td>
                <td className={cn(td, 'text-right font-mono tabular-nums')}>
                  {formatNumber(app.packets)}
                </td>
                <td className={cn(td, 'text-right font-mono tabular-nums', muted)}>
                  {app.bytes != null ? formatBytes(app.bytes) : '—'}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
