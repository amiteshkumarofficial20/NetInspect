import { useState } from 'react';
import { Shield, FileText, Settings, ExternalLink } from 'lucide-react';
import type { AnalysisResult } from '../../types';
import { formatNumber, formatBytes, formatPercent } from '../../lib/api';
import { ProgressBar } from '../ui/ProgressBar';
import { cn } from '../../lib/utils';

interface SummaryCardsProps {
  data: AnalysisResult | null;
  glowEnabled: boolean;
  onGlowToggle: (v: boolean) => void;
  rawJson: AnalysisResult | null;
  isLight: boolean;
}

export function SummaryCards({
  data,
  glowEnabled,
  onGlowToggle,
  rawJson,
  isLight,
}: SummaryCardsProps) {
  const [downloading, setDownloading] = useState(false);

  const droppedPct = data
    ? (data.summary.droppedPackets / Math.max(1, data.summary.totalPackets)) * 100
    : 0;

  const handleDownloadReport = () => {
    if (!rawJson) return;
    setDownloading(true);
    try {
      const blob = new Blob([JSON.stringify(rawJson, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'netinspect-report.json';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setTimeout(() => setDownloading(false), 500);
    }
  };

  const card = cn('ni-card p-4 flex flex-col gap-3');
  const heading = cn('font-semibold text-sm', isLight ? 'text-gray-900' : 'text-white');
  const muted = cn('text-xs', isLight ? 'text-gray-500' : 'text-muted');

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* ── Blocking / Rules ── */}
      <div className={card}>
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-danger flex-shrink-0" />
          <h3 className={heading}>Blocking / Rules</h3>
        </div>

        {data ? (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-danger">
                {formatNumber(data.summary.droppedPackets)}
              </span>
              <span className={muted}>Dropped Packets</span>
            </div>
            <p className={muted}>Packets blocked by active DPI rules.</p>
            <ProgressBar value={droppedPct} color="red" height="sm" />
            <p className={cn('text-[10px]', isLight ? 'text-gray-400' : 'text-white/25')}>
              {droppedPct.toFixed(1)}% of total traffic
            </p>
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-danger">0</span>
              <span className={muted}>Dropped Packets</span>
            </div>
            <p className={muted}>No analysis loaded yet.</p>
            <ProgressBar value={0} color="red" height="sm" />
          </>
        )}
      </div>

      {/* ── Reports ── */}
      <div className={card}>
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-accent-light flex-shrink-0" />
          <h3 className={heading}>Reports</h3>
        </div>

        <div
          className={cn(
            'flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors',
            isLight
              ? 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
              : 'bg-navy-900/50 hover:bg-navy-900 border border-white/5',
            !rawJson && 'opacity-50 cursor-not-allowed',
          )}
          onClick={rawJson ? handleDownloadReport : undefined}
        >
          <FileText size={20} className="text-accent-light flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className={cn('text-xs font-semibold', isLight ? 'text-gray-700' : 'text-white/90')}>
              Machine-readable report
            </p>
            <p className={cn('text-[10px] mt-0.5 leading-relaxed', muted)}>
              JSON output generated directly by the C++ DPI engine.
            </p>
            {rawJson && (
              <div className="flex items-center gap-1 mt-1.5 text-accent-light">
                <ExternalLink size={10} />
                <span className="text-[10px]">
                  {downloading ? 'Downloading…' : 'Click to download'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Settings ── */}
      <div className={card}>
        <div className="flex items-center gap-2">
          <Settings size={16} className="text-accent-light flex-shrink-0" />
          <h3 className={heading}>Settings</h3>
        </div>

        {/* Visual Glow toggle */}
        <div className="flex items-center justify-between">
          <div className="min-w-0 pr-4">
            <p className={cn('text-xs font-medium', isLight ? 'text-gray-700' : 'text-white/80')}>
              Visual Glow
            </p>
            <p className={cn('text-[10px] mt-0.5 leading-relaxed', muted)}>
              Enable dashboard network effects.
            </p>
          </div>

          {/* Toggle switch */}
          <button
          type="button"
          role="switch"
          aria-checked={glowEnabled}
          aria-label="Toggle Visual Glow"
          onClick={() => onGlowToggle(!glowEnabled)}
          className={cn(
          'relative flex-shrink-0 w-11 h-6 rounded-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/40',
          glowEnabled
          ? 'bg-accent border-accent'
          : isLight
          ? 'bg-gray-300 border-gray-300'
          : 'bg-white/10 border-white/10',
          )}
        >
  <span
    className={cn(
      'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200',
      glowEnabled ? 'translate-x-5' : 'translate-x-0',
    )}
  />
</button>
        </div>
      </div>
    </div>
  );
}
