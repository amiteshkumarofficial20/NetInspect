import type { DomainCount } from '../../types';
import { formatNumber } from '../../lib/api';
import { SkeletonRow } from '../ui/SkeletonRow';
import { cn } from '../../lib/utils';

interface TopDomainsTableProps {
  domains: DomainCount[];
  isLoading: boolean;
  isLight: boolean;
  onViewAll?: () => void;
  searchQuery?: string;
}

export function TopDomainsTable({
  domains,
  isLoading,
  isLight,
  onViewAll,
  searchQuery = '',
}: TopDomainsTableProps) {
  const filtered = searchQuery
    ? domains.filter((d) =>
        d.domain.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : domains;

  const rows = filtered.slice(0, 5);

  const th = cn('text-left text-[10px] font-semibold uppercase tracking-wide pb-2',
    isLight ? 'text-gray-400' : 'text-muted');
  const td = cn('py-2 text-xs', isLight ? 'text-gray-700' : 'text-white/80');
  const muted = cn('text-xs', isLight ? 'text-gray-400' : 'text-muted');

  return (
    <div className="ni-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className={cn('font-semibold text-sm', isLight ? 'text-gray-900' : 'text-white')}>
          Top Domains / SNI
        </h3>
      </div>

      <table className="w-full">
        <thead>
          <tr className={cn('border-b', isLight ? 'border-gray-100' : 'border-white/5')}>
            <th className={cn(th, 'w-6')}>#</th>
            <th className={th}>Domain</th>
            <th className={cn(th, 'text-right')}>Packets</th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={3}><SkeletonRow cols={3} /></td></tr>
              ))
            : rows.length === 0
            ? (
              <tr>
                <td colSpan={3} className="py-6 text-center">
                  <span className={muted}>No domain data</span>
                </td>
              </tr>
            )
            : rows.map((d, i) => (
              <tr
                key={d.domain + i}
                className={cn('table-row-hover border-b', isLight ? 'border-gray-50' : 'border-white/[0.03]')}
              >
                <td className={cn(td, 'pr-2 text-muted')}>{i + 1}</td>
                <td className={td}>
                  <span className="font-mono text-[11px]">{d.domain || '—'}</span>
                </td>
                <td className={cn(td, 'text-right font-mono tabular-nums')}>
                  {formatNumber(d.packets)}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
