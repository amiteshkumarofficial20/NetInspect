import { useState } from 'react';
import type { AnalysisResult, ProtocolStat } from '../../types';
import { formatNumber, formatPercent } from '../../lib/api';
import { ProgressBar } from '../ui/ProgressBar';
import { cn } from '../../lib/utils';

interface ProtocolBarsProps {
  data: AnalysisResult | null;
  isLight: boolean;
}

function buildProtocolStats(data: AnalysisResult | null): ProtocolStat[] {
  if (!data) return [];

  const { summary, flows } = data;
  const total = summary.totalPackets;
  if (total === 0) return [];

  // Count ICMP and Other from flows (engine doesn't emit icmpPackets separately)
  let icmpPkts = 0;
  let otherPkts = 0;
  flows.forEach((f) => {
    const p = f.protocol.toUpperCase();
    if (p === 'ICMP') icmpPkts += f.packets;
    else if (p !== 'TCP' && p !== 'UDP') otherPkts += f.packets;
  });

  const tcp = summary.tcpPackets;
  const udp = summary.udpPackets;
  const others = Math.max(0, total - tcp - udp - icmpPkts);

  return [
    { name: 'TCP', packets: tcp, percentage: (tcp / total) * 100, color: 'cyan' },
    { name: 'UDP', packets: udp, percentage: (udp / total) * 100, color: 'green' },
    { name: 'ICMP', packets: icmpPkts, percentage: (icmpPkts / total) * 100, color: 'amber' },
    { name: 'Others', packets: others + otherPkts, percentage: ((others + otherPkts) / total) * 100, color: 'gray' },
  ].filter((p) => p.packets >= 0);
}

export function ProtocolBars({ data, isLight }: ProtocolBarsProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const stats = buildProtocolStats(data);

  return (
    <div className="ni-card p-4 flex flex-col gap-3">
      <h3 className={cn('font-semibold text-sm', isLight ? 'text-gray-900' : 'text-white')}>
        Protocol Distribution
      </h3>

      {stats.length === 0 ? (
        <div className="space-y-3">
          {['TCP', 'UDP', 'ICMP', 'Others'].map((name) => (
            <div key={name} className="flex items-center gap-3">
              <span className={cn('text-xs w-12 flex-shrink-0', isLight ? 'text-gray-600' : 'text-muted')}>
                {name}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-white/5" />
              <span className={cn('text-xs w-10 text-right', isLight ? 'text-gray-400' : 'text-muted/50')}>
                —
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {stats.map((stat) => {
            const isHovered = hoveredRow === stat.name;
            return (
              <div
                key={stat.name}
                className="flex items-center gap-3 group cursor-default"
                onMouseEnter={() => setHoveredRow(stat.name)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <span className={cn('text-xs w-12 flex-shrink-0', isLight ? 'text-gray-600' : 'text-muted')}>
                  {stat.name}
                </span>
                <div className="flex-1 relative">
                  <ProgressBar
                    value={stat.percentage}
                    color={stat.color as 'cyan' | 'green' | 'amber' | 'gray'}
                    height="sm"
                  />
                  {/* Hover tooltip */}
                  {isHovered && (
                    <div
                      className={cn(
                        'absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] px-2 py-1 rounded z-10 whitespace-nowrap',
                        isLight ? 'bg-gray-800 text-white' : 'bg-navy-600 text-white border border-white/10',
                      )}
                    >
                      {formatNumber(stat.packets)} packets
                    </div>
                  )}
                </div>
                <span className={cn('text-xs w-10 text-right font-medium', isLight ? 'text-gray-700' : 'text-white/70')}>
                  {stat.percentage.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
