import { useState, useCallback } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Sector,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { AppEntry, AnalysisStatus } from '../../types';
import { CHART_COLORS } from '../../types';
import { formatNumber } from '../../lib/api';
import { cn } from '../../lib/utils';

interface DonutChartProps {
  applications: AppEntry[];
  totalPackets: number;
  status: AnalysisStatus;
  isLight: boolean;
  onViewAll?: () => void;
}

// ── Active (popped-out) sector shape ────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderActiveShape = (props: any) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill,
    payload, percent,
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke={fill}
        strokeWidth={2}
        opacity={0.95}
      />
      {/* Tooltip text in donut center when hovering */}
      <text x={cx} y={cy - 14} textAnchor="middle" fill="white" fontSize={13} fontWeight="700">
        {formatNumber(payload.value)}
      </text>
      <text x={cx} y={cy + 4} textAnchor="middle" fill="#94a3b8" fontSize={10}>
        {payload.name}
      </text>
      <text x={cx} y={cy + 18} textAnchor="middle" fill={fill} fontSize={11} fontWeight="600">
        {(percent * 100).toFixed(1)}%
      </text>
    </g>
  );
};

export function DonutChart({ applications, totalPackets, status, isLight, onViewAll }: DonutChartProps) {
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleMouseEnter = useCallback((_: unknown, index: number) => {
    setActiveIndex(index);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setActiveIndex(-1);
  }, []);

  const handleClick = useCallback((_: unknown, index: number) => {
    setSelectedIndex((prev) => (prev === index ? null : index));
  }, []);

  // Build chart data — cap at top 8, fold rest into "Others"
  const MAX_LEGEND = 8;
  const topApps = applications.slice(0, MAX_LEGEND);
  const othersPackets = applications.slice(MAX_LEGEND).reduce((s, a) => s + a.packets, 0);

  const chartData = [
    ...topApps.map((app, i) => ({
      name: app.name,
      value: app.packets,
      color: CHART_COLORS[i] ?? '#94a3b8',
    })),
    ...(othersPackets > 0
      ? [{ name: 'Others', value: othersPackets, color: '#94a3b8' }]
      : []),
  ];

  const isLoading = status === 'loading';
  const isEmpty = applications.length === 0 && status !== 'loading';

  // The "active" index for renderActiveShape — prefer click, fall back to hover
  const effectiveActive = selectedIndex ?? (activeIndex >= 0 ? activeIndex : undefined);

  return (
    <div className="ni-card p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className={cn('font-semibold text-sm', isLight ? 'text-gray-900' : 'text-white')}>
          Application Traffic Distribution
        </h3>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      )}

      {isEmpty && !isLoading && (
        <div className="flex flex-col items-center justify-center h-40 text-center">
          <div className="text-2xl mb-2 opacity-30">◎</div>
          <p className={cn('text-xs', isLight ? 'text-gray-400' : 'text-muted')}>
            Upload a PCAP to see<br />application distribution
          </p>
        </div>
      )}

      {!isLoading && !isEmpty && (
        <div className="flex gap-3 items-start">
          {/* Donut */}
          <div className="flex-shrink-0" style={{ width: 160, height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={2}
                  dataKey="value"
                  activeIndex={effectiveActive}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  activeShape={renderActiveShape as any}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  onClick={handleClick}
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.color}
                      opacity={
                        selectedIndex !== null && selectedIndex !== index ? 0.35 : 1
                      }
                    />
                  ))}
                </Pie>

                {/* Default center label when nothing active */}
                {effectiveActive === undefined && (
                  <text>
                    <tspan
                      x="50%"
                      y="47%"
                      textAnchor="middle"
                      fill="white"
                      fontSize={18}
                      fontWeight="700"
                      dominantBaseline="middle"
                    >
                      {totalPackets >= 10000
                        ? `${(totalPackets / 1000).toFixed(1)}K`
                        : formatNumber(totalPackets)}
                    </tspan>
                    <tspan
                      x="50%"
                      y="58%"
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize={10}
                      dominantBaseline="middle"
                    >
                      Packets
                    </tspan>
                  </text>
                )}

                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${formatNumber(value)} pkts`,
                    name,
                  ]}
                  contentStyle={{
                    background: '#141b2d',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: 'white',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex-1 min-w-0 space-y-1.5 overflow-y-auto max-h-40 no-scrollbar">
            {chartData.map((entry, i) => {
              const pct = totalPackets > 0
                ? ((entry.value / totalPackets) * 100).toFixed(1)
                : '0.0';
              const isActive = i === effectiveActive;

              return (
                <button
                  key={entry.name}
                  className={cn(
                    'w-full flex items-center gap-2 px-1.5 py-1 rounded-lg transition-all text-left',
                    isActive
                      ? isLight ? 'bg-gray-100' : 'bg-white/5'
                      : 'hover:bg-white/5',
                    selectedIndex !== null && selectedIndex !== i && 'opacity-40',
                  )}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(-1)}
                  onClick={() => setSelectedIndex((p) => (p === i ? null : i))}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{ background: entry.color }}
                  />
                  <span className={cn('text-xs flex-1 truncate', isLight ? 'text-gray-700' : 'text-white/80')}>
                    {entry.name}
                  </span>
                  <span className={cn('text-xs font-semibold flex-shrink-0', isLight ? 'text-gray-500' : 'text-muted')}>
                    {pct}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
