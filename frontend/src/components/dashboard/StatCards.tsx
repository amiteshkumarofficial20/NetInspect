import {
  Activity,
  Database,
  Share2,
  Grid3X3,
  ArrowUpRight,
  X,
  TrendingUp,
} from 'lucide-react';
import type { AnalysisResult, AnalysisStatus } from '../../types';
import { formatNumber, formatBytes, formatPercent } from '../../lib/api';
import { ProgressBar } from '../ui/ProgressBar';
import { SkeletonStat } from '../ui/SkeletonRow';
import { cn } from '../../lib/utils';

interface StatCardsProps {
  data: AnalysisResult | null;
  status: AnalysisStatus;
  isLight: boolean;
}

interface StatCardConfig {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
  tone: 'default' | 'green' | 'red';
  sub?: React.ReactNode;
}

function buildCards(data: AnalysisResult | null): StatCardConfig[] {
  if (!data) {
    return [
      { icon: <Activity size={18} />, label: 'Total Packets', value: '—', accent: 'text-accent-light', tone: 'default' },
      { icon: <Database size={18} />, label: 'Total Bytes', value: '—', accent: 'text-purple', tone: 'default' },
      { icon: <Share2 size={18} />, label: 'Total Flows', value: '—', accent: 'text-accent-light', tone: 'default' },
      { icon: <Grid3X3 size={18} />, label: 'Applications', value: '—', accent: 'text-warn', tone: 'default' },
      { icon: <ArrowUpRight size={18} />, label: 'Forwarded Packets', value: '—', accent: 'text-success', tone: 'green' },
      { icon: <X size={18} />, label: 'Dropped Packets', value: '—', accent: 'text-danger', tone: 'red' },
    ];
  }

  const { summary, applications, flows } = data;
  const totalFlows = flows.length;
  const totalApps = applications.length;

  const fwdPct = summary.totalPackets > 0
    ? (summary.forwardedPackets / summary.totalPackets) * 100
    : 0;
  const drpPct = summary.totalPackets > 0
    ? (summary.droppedPackets / summary.totalPackets) * 100
    : 0;

  return [
    {
      icon: <Activity size={18} />,
      label: 'Total Packets',
      accent: 'text-accent-light',
      value: formatNumber(summary.totalPackets),
      tone: 'default',
      sub: (
        <span className="flex items-center gap-1 text-xs text-success">
          <TrendingUp size={10} />
          {formatPercent(summary.tcpPackets, summary.totalPackets)} TCP
        </span>
      ),
    },
    {
      icon: <Database size={18} />,
      label: 'Total Bytes',
      accent: 'text-purple',
      value: formatBytes(summary.totalBytes),
      tone: 'default',
      sub: (
        <span className="flex items-center gap-1 text-xs text-success">
          <TrendingUp size={10} />
          {formatPercent(summary.udpPackets, summary.totalPackets)} UDP
        </span>
      ),
    },
    {
      icon: <Share2 size={18} />,
      label: 'Total Flows',
      accent: 'text-accent-light',
      value: formatNumber(totalFlows),
      tone: 'default',
      sub: (
        <span className="text-xs text-muted">
          {formatNumber(summary.tcpPackets)} TCP pkts
        </span>
      ),
    },
    {
      icon: <Grid3X3 size={18} />,
      label: 'Applications',
      accent: 'text-warn',
      value: formatNumber(totalApps),
      tone: 'default',
      sub: (
        <span className="text-xs text-muted">
          Detected by DPI
        </span>
      ),
    },
    {
      icon: <ArrowUpRight size={18} />,
      label: 'Forwarded Packets',
      accent: 'text-success',
      value: formatNumber(summary.forwardedPackets),
      tone: 'green',
      sub: (
        <div className="space-y-1 w-full">
          <div className="flex justify-between text-xs">
            <span className="text-success">{fwdPct.toFixed(1)}%</span>
            <span className="text-muted">of total</span>
          </div>
          <ProgressBar value={fwdPct} color="green" height="sm" />
        </div>
      ),
    },
    {
      icon: <X size={18} />,
      label: 'Dropped Packets',
      accent: 'text-danger',
      value: formatNumber(summary.droppedPackets),
      tone: 'red',
      sub: (
        <div className="space-y-1 w-full">
          <div className="flex justify-between text-xs">
            <span className="text-danger">{drpPct.toFixed(1)}%</span>
            <span className="text-muted">blocked by rules</span>
          </div>
          <ProgressBar value={drpPct} color="red" height="sm" />
        </div>
      ),
    },
  ];
}

export function StatCards({ data, status, isLight }: StatCardsProps) {
  const cards = buildCards(data);
  const isLoading = status === 'loading';

  return (
    <div className="grid grid-cols-6 gap-3">
      {cards.map((card, i) => (
        <div
          key={i}
          className={cn(
            'ni-card p-4 flex flex-col gap-2 min-w-0',
            card.tone === 'green' && 'border-success/20 bg-success/5',
            card.tone === 'red' && 'border-danger/20 bg-danger/5',
            isLight && card.tone === 'green' && 'bg-green-50 border-green-200',
            isLight && card.tone === 'red' && 'bg-red-50 border-red-200',
          )}
        >
          {/* Icon + Label */}
          <div className="flex items-center gap-2">
            <span className={cn(card.accent, 'flex-shrink-0')}>{card.icon}</span>
            <span className={cn('text-xs font-medium truncate', isLight ? 'text-gray-500' : 'text-muted')}>
              {card.label}
            </span>
          </div>

          {/* Value */}
          {isLoading ? (
            <SkeletonStat />
          ) : (
            <>
              <div
                className={cn(
                  'text-2xl font-bold leading-none tracking-tight',
                  isLight ? 'text-gray-900' : 'text-white',
                )}
              >
                {card.value}
              </div>
              {card.sub && (
                <div className="mt-auto">{card.sub}</div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
