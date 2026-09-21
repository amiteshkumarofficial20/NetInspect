import { useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Flow } from '../../types';
import { AppIcon } from '../../lib/appIcons';
import { StatusBadge, ProtocolBadge, ClassifiedBadge } from '../ui/Badge';
import { formatNumber, formatBytes, formatTime } from '../../lib/api';
import { cn } from '../../lib/utils';

interface RecentFlowsTableProps {
  flows: Flow[];
  analysisTime: Date | null;
  isLoading: boolean;
  isLight: boolean;
  searchQuery: string;
  onClearSearch: () => void;
  onViewAll?: () => void;
}

const COLS = [
  { key: 'time',     label: 'Time',        width: 72 },
  { key: 'src',      label: 'Source IP',   width: 110 },
  { key: 'dst',      label: 'Destination', width: 130 },
  { key: 'sport',    label: 'Src Port',    width: 72 },
  { key: 'dport',    label: 'Dst Port',    width: 72 },
  { key: 'app',      label: 'Application', width: 110 },
  { key: 'proto',    label: 'Protocol',    width: 72 },
  { key: 'domain',   label: 'Domain / SNI',width: 130 },
  { key: 'packets',  label: 'Packets',     width: 72 },
  { key: 'bytes',    label: 'Bytes',       width: 80 },
  { key: 'blocked',  label: 'Blocked',     width: 80 },
  { key: 'class',    label: 'Classified',  width: 80 },
];

const ROW_HEIGHT = 36;

export function RecentFlowsTable({
  flows,
  analysisTime,
  isLoading,
  isLight,
  searchQuery,
  onClearSearch,
  onViewAll,
}: RecentFlowsTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const timeStr = analysisTime ? formatTime(analysisTime) : '—';
  const isFiltered = searchQuery.trim().length > 0;

  // ── @tanstack/react-virtual ────────────────────────────────────────────────
  const rowVirtualizer = useVirtualizer({
    count: flows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  const th = cn(
    'text-left text-[10px] font-semibold uppercase tracking-wide flex-shrink-0',
    isLight ? 'text-gray-400' : 'text-muted',
  );

  return (
    <div className="ni-card flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 border-b border-white/5">
        <h3 className={cn('font-semibold text-sm', isLight ? 'text-gray-900' : 'text-white')}>
          Recent Flows
          {flows.length > 0 && (
            <span className={cn('ml-2 text-xs font-normal', isLight ? 'text-gray-400' : 'text-muted')}>
              ({formatNumber(flows.length)} total)
            </span>
          )}
        </h3>
        {isFiltered && (
          <button
            onClick={onClearSearch}
            className="text-xs text-accent-light hover:underline transition-colors"
          >
            Clear Search →
          </button>
        )}
      </div>

      {/* Column headers */}
      <div
        className={cn(
          'flex items-center gap-2 px-4 py-2 border-b flex-shrink-0',
          isLight ? 'border-gray-100' : 'border-white/5',
        )}
      >
        {COLS.map((col) => (
          <span
            key={col.key}
            className={th}
            style={{ minWidth: col.width, maxWidth: col.width }}
          >
            {col.label}
          </span>
        ))}
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-7 h-7 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      ) : flows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="text-2xl opacity-20 mb-2">∿</div>
          <p className={cn('text-sm', isLight ? 'text-gray-400' : 'text-muted')}>
            {isFiltered ? 'No flows match your search.' : 'Upload a PCAP to see flows.'}
          </p>
          {isFiltered && (
            <button
              onClick={onClearSearch}
              className="mt-2 text-xs text-accent-light hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        /* Virtualized list */
        <div
          ref={parentRef}
          className="overflow-auto"
          style={{ height: 280 }}
        >
          <div
            style={{
              height: rowVirtualizer.getTotalSize(),
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const flow = flows[virtualRow.index];
              const isHover = hoveredRow === virtualRow.index;
              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: ROW_HEIGHT,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className={cn(
                    'flex items-center gap-2 px-4 border-b transition-colors cursor-default',
                    isLight ? 'border-gray-50' : 'border-white/[0.03]',
                    isHover
                      ? isLight ? 'bg-gray-50' : 'bg-white/[0.03]'
                      : '',
                  )}
                  onMouseEnter={() => setHoveredRow(virtualRow.index)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  {/* Time */}
                  <span
                    className={cn('text-[11px] font-mono flex-shrink-0', isLight ? 'text-gray-500' : 'text-muted')}
                    style={{ minWidth: COLS[0].width, maxWidth: COLS[0].width }}
                  >
                    {timeStr}
                  </span>

                  {/* Source IP */}
                  <span
                    className="text-[11px] font-mono flex-shrink-0 truncate"
                    style={{ minWidth: COLS[1].width, maxWidth: COLS[1].width }}
                  >
                    {flow.sourceIp}
                  </span>

                  {/* Destination */}
                  <span
                    className={cn('text-[11px] font-mono flex-shrink-0 truncate', isLight ? 'text-gray-600' : 'text-white/70')}
                    style={{ minWidth: COLS[2].width, maxWidth: COLS[2].width }}
                  >
                    {flow.destinationIp}
                  </span>

                  {/* Src Port */}
                  <span
                    className={cn('text-[11px] font-mono flex-shrink-0 text-center', isLight ? 'text-gray-500' : 'text-muted')}
                    style={{ minWidth: COLS[3].width, maxWidth: COLS[3].width }}
                  >
                    {flow.sourcePort}
                  </span>

                  {/* Dst Port */}
                  <span
                    className={cn('text-[11px] font-mono flex-shrink-0 text-center', isLight ? 'text-gray-500' : 'text-muted')}
                    style={{ minWidth: COLS[4].width, maxWidth: COLS[4].width }}
                  >
                    {flow.destinationPort}
                  </span>

                  {/* Application */}
                  <div
                    className="flex items-center gap-1.5 flex-shrink-0"
                    style={{ minWidth: COLS[5].width, maxWidth: COLS[5].width }}
                  >
                    <AppIcon name={flow.application} size={12} />
                    <span className="text-[11px] truncate">{flow.application}</span>
                  </div>

                  {/* Protocol */}
                  <div
                    className="flex-shrink-0"
                    style={{ minWidth: COLS[6].width, maxWidth: COLS[6].width }}
                  >
                    <ProtocolBadge protocol={flow.protocol} />
                  </div>

                  {/* Domain / SNI */}
                  <span
                    className={cn('text-[11px] font-mono flex-shrink-0 truncate', isLight ? 'text-gray-500' : 'text-muted')}
                    style={{ minWidth: COLS[7].width, maxWidth: COLS[7].width }}
                  >
                    {flow.domain || '—'}
                  </span>

                  {/* Packets */}
                  <span
                    className="text-[11px] font-mono flex-shrink-0 text-right"
                    style={{ minWidth: COLS[8].width, maxWidth: COLS[8].width }}
                  >
                    {formatNumber(flow.packets)}
                  </span>

                  {/* Bytes */}
                  <span
                    className={cn('text-[11px] font-mono flex-shrink-0 text-right', isLight ? 'text-gray-500' : 'text-muted')}
                    style={{ minWidth: COLS[9].width, maxWidth: COLS[9].width }}
                  >
                    {formatBytes(flow.bytes)}
                  </span>

                  {/* Blocked */}
                  <div
                    className="flex-shrink-0"
                    style={{ minWidth: COLS[10].width, maxWidth: COLS[10].width }}
                  >
                    <StatusBadge blocked={flow.blocked} />
                  </div>

                  {/* Classified */}
                  <div
                    className="flex-shrink-0"
                    style={{ minWidth: COLS[11].width, maxWidth: COLS[11].width }}
                  >
                    <ClassifiedBadge classified={flow.classified} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
