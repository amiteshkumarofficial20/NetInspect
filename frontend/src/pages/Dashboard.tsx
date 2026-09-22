import { useRef, useState, useMemo } from 'react';
import {
  FileText, CheckCircle, Upload, Zap, Search,
} from 'lucide-react';
import type {
  AnalysisResult, AnalysisStatus, DomainCount, TopTalker, EngineStatus,
} from '../types';
import { StatCards } from '../components/dashboard/StatCards';
import { TrafficVisualization } from '../components/dashboard/TrafficVisualization';
import { DonutChart } from '../components/dashboard/DonutChart';
import { ProtocolBars } from '../components/dashboard/ProtocolBars';
import { TopApplicationsTable } from '../components/dashboard/TopApplicationsTable';
import { TopDomainsTable } from '../components/dashboard/TopDomainsTable';
import { TopTalkersTable } from '../components/dashboard/TopTalkersTable';
import { SecurityEventsPanel } from '../components/dashboard/SecurityEventsPanel';
import { RecentFlowsTable } from '../components/dashboard/RecentFlowsTable';
import { SummaryCards } from '../components/dashboard/SummaryCards';
import { Badge } from '../components/ui/Badge';
import { cn } from '../lib/utils';

interface DashboardProps {
  data: AnalysisResult | null;
  status: AnalysisStatus;
  error: string | null;
  analysisTime: Date | null;
  formattedAnalysisTime: string | null;
  fileName: string | null;
  search: string;
  onSearchChange: (v: string) => void;
  onClearSearch: () => void;
  glowEnabled: boolean;
  onGlowToggle: (v: boolean) => void;
  isLight: boolean;
  engineStatus: EngineStatus;
  onAnalyze: (file: File, blockApp?: string) => void;
  onAnalyzeNewTraffic: (blockApp?: string) => void;
  isLoading: boolean;
}

const ENGINE_LABEL: Record<EngineStatus, { dot: string; label: string; color: string }> = {
  checking: { dot: 'bg-warn animate-pulse', label: 'Checking...', color: 'text-warn' },
  online:   { dot: 'bg-success',            label: 'Engine Online', color: 'text-success' },
  offline:  { dot: 'bg-danger',             label: 'Engine Offline', color: 'text-danger' },
};

const BLOCK_APP_OPTIONS = [
  'None', 'YouTube', 'Facebook', 'Instagram', 'Twitter/X',
  'Discord', 'Telegram', 'TikTok', 'Spotify',
];

export function Dashboard({
  data,
  status,
  error,
  analysisTime,
  formattedAnalysisTime,
  fileName,
  search,
  onSearchChange,
  onClearSearch,
  glowEnabled,
  onGlowToggle,
  isLight,
  engineStatus,
  onAnalyze,
  onAnalyzeNewTraffic,
  isLoading,
}: DashboardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [blockApp, setBlockApp] = useState('None');
  const eng = ENGINE_LABEL[engineStatus];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { onAnalyze(file, blockApp); e.target.value = ''; }
  };

  /* ── Derived data ── */

  const filteredFlows = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.flows;
    return data.flows.filter((f) =>
      [f.sourceIp, f.destinationIp, f.application, f.domain,
        f.protocol, String(f.sourcePort), String(f.destinationPort)]
        .join(' ').toLowerCase().includes(q),
    );
  }, [data, search]);

  const blockedFlows = useMemo(
    () => (data ? data.flows.filter((f) => f.blocked) : []),
    [data],
  );

  const topTalkers = useMemo((): TopTalker[] => {
    if (!data) return [];
    const map = new Map<string, TopTalker>();
    data.flows.forEach((f) => {
      const e = map.get(f.sourceIp);
      if (e) { e.bytes += f.bytes; e.packets += f.packets; }
      else map.set(f.sourceIp, { sourceIp: f.sourceIp, bytes: f.bytes, packets: f.packets });
    });
    return Array.from(map.values()).sort((a, b) => b.bytes - a.bytes);
  }, [data]);

  const topDomains = useMemo((): DomainCount[] => {
    if (!data) return [];
    const map = new Map<string, DomainCount>();
    data.domains.forEach((d) => {
      const key = `${d.domain}|${d.application}`;
      const ex = map.get(key);
      if (ex) ex.packets += 1;
      else map.set(key, { domain: d.domain, application: d.application, packets: 1 });
    });
    return Array.from(map.values()).sort((a, b) => b.packets - a.packets);
  }, [data]);

  const filteredApps = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.applications;
    return data.applications.filter((a) => a.name.toLowerCase().includes(q));
  }, [data, search]);

  const filteredTalkers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return topTalkers;
    return topTalkers.filter((t) => t.sourceIp.includes(q));
  }, [topTalkers, search]);

  const filteredDomains = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return topDomains;
    return topDomains.filter((d) => d.domain.toLowerCase().includes(q));
  }, [topDomains, search]);

  return (
    <div className="space-y-4">

      {/* ── Error banner ── */}
      {error && (
        <div className="rounded-xl bg-danger/10 border border-danger/30 px-4 py-3 text-sm text-danger flex items-center gap-2">
          <span className="font-semibold">Analysis failed:</span>
          <span>{error}</span>
        </div>
      )}


      {/* ── Control row: Search | Block App | Last Analyzed card ... Engine Online ── */}
      <div className="flex items-center justify-between gap-3">
        {/* Left group: Search, Block App, Last Analyzed */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={14}
              className={cn('absolute left-3 top-1/2 -translate-y-1/2', isLight ? 'text-gray-400' : 'text-muted')}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search applications, domains, IPs, or flows..."
              className={cn(
                'w-full h-9 pl-9 pr-4 rounded-xl text-sm outline-none transition-colors',
                'focus:ring-1 focus:ring-accent/50',
                isLight
                  ? 'bg-gray-100 text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:bg-white'
                  : 'bg-navy-750 text-white placeholder:text-muted/60 border border-white/5 focus:bg-navy-700',
              )}
            />
          </div>

          {/* Block App selector */}
          <select
            value={blockApp}
            onChange={(e) => setBlockApp(e.target.value)}
            disabled={isLoading}
            className={cn(
              'h-9 px-3 rounded-xl text-xs font-medium border outline-none flex-shrink-0',
              'focus:ring-1 focus:ring-accent/50',
              isLight ? 'bg-white text-gray-700 border-gray-200' : 'bg-navy-750 text-white border-white/5',
            )}
            aria-label="Block application"
          >
            {BLOCK_APP_OPTIONS.map((o) => (
              <option key={o} value={o}>{o === 'None' ? 'Block App: None' : o}</option>
            ))}
          </select>

          {/* Last Analyzed File card */}
          <div className={cn('ni-card px-3 py-2 flex items-center gap-3 flex-shrink-0')}>
            <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', isLight ? 'bg-blue-50' : 'bg-accent/10')}>
              <FileText size={14} className="text-accent-light" />
            </div>
            <div className="min-w-0">
              <p className={cn('text-[9px] mb-0.5', isLight ? 'text-gray-400' : 'text-muted')}>Last Analyzed</p>
              <p className={cn('text-xs font-semibold truncate max-w-[140px]', isLight ? 'text-gray-800' : 'text-white')}>
                {fileName ?? 'No file analyzed'}
              </p>
              <p className={cn('text-[9px]', isLight ? 'text-gray-400' : 'text-muted')}>
                {formattedAnalysisTime ?? '—'}
              </p>
            </div>
            {status === 'success' && (
              <div className="flex flex-col items-end gap-1 ml-1">
                <Badge variant="complete">
                  <CheckCircle size={9} className="mr-1" />
                  Analysis Complete
                </Badge>
                <button className="text-[10px] text-accent-light hover:underline">View Report →</button>
              </div>
            )}
          </div>
        </div>

        {/* Right item: Engine status */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative">
            <span className={cn('block w-2 h-2 rounded-full', eng.dot)} />
            {engineStatus === 'online' && (
              <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-60" />
            )}
          </div>
          <div className="leading-tight">
            <div className={cn('text-xs font-semibold', eng.color)}>{eng.label}</div>
            <div className={cn('text-[9px]', isLight ? 'text-gray-400' : 'text-muted')}>C++ DPI Engine</div>
          </div>
        </div>
      </div>

      {/* ── Info cards with action buttons ── */}
      <div className="grid grid-cols-2 gap-4">

        {/* Card 1 — Analyze PCAP */}
        <div className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-xl border',
          isLight ? 'bg-white border-gray-200' : 'bg-navy-750 border-white/5',
        )}>
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', isLight ? 'bg-blue-50' : 'bg-accent/15')}>
            <Upload size={18} className="text-accent-light" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-semibold mb-0.5', isLight ? 'text-gray-900' : 'text-white')}>Analyze PCAP</p>
            <p className={cn('text-xs leading-relaxed', isLight ? 'text-gray-500' : 'text-muted')}>
              Upload any PCAP file to analyze network traffic. Primarily for integration testing with sample captures.
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold flex-shrink-0',
              'bg-accent hover:bg-accent-dark transition-colors text-white',
              isLoading && 'opacity-60 cursor-not-allowed',
            )}
          >
            {isLoading
              ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Upload size={12} />}
            <span>Analyze PCAP</span>
          </button>
        </div>

        {/* Card 2 — Analyze New Traffic */}
        <div className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-xl border',
          isLight ? 'bg-white border-gray-200' : 'bg-navy-750 border-white/5',
        )}>
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', isLight ? 'bg-purple-50' : 'bg-purple/15')}>
            <Zap size={18} className="text-purple" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-semibold mb-0.5', isLight ? 'text-gray-900' : 'text-white')}>Analyze New Traffic</p>
            <p className={cn('text-xs leading-relaxed', isLight ? 'text-gray-500' : 'text-muted')}>
              Automatically generates a new PCAP using the traffic-generation script and analyzes it with the DPI engine. No file upload required.
            </p>
          </div>
          <button
            onClick={() => onAnalyzeNewTraffic(blockApp)}
            disabled={isLoading}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold flex-shrink-0',
              'bg-purple hover:bg-purple/80 transition-colors text-white',
              isLoading && 'opacity-60 cursor-not-allowed',
            )}
          >
            {isLoading
              ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Zap size={12} />}
            <span>Analyze New Traffic</span>
          </button>
        </div>
      </div>

      {/* Hidden file input — Analyze PCAP only */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pcap,.pcapng,.cap"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ── Stat cards ── */}
      <StatCards data={data} status={status} isLight={isLight} />

      {/* ── Main visualization + right panels ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <TrafficVisualization data={data} glowEnabled={glowEnabled} isLight={isLight} fileName={fileName} />
        </div>
        <div className="col-span-1 flex flex-col gap-4">
          <DonutChart
            applications={data?.applications ?? []}
            totalPackets={data?.summary.totalPackets ?? 0}
            status={status}
            isLight={isLight}
          />
          <ProtocolBars data={data} isLight={isLight} />
        </div>
      </div>

      {/* ── 4-up table row ── */}
      <div className="grid grid-cols-4 gap-4">
        <TopApplicationsTable applications={filteredApps} isLoading={isLoading} isLight={isLight} searchQuery={search} />
        <TopDomainsTable domains={filteredDomains} isLoading={isLoading} isLight={isLight} searchQuery={search} />
        <TopTalkersTable talkers={filteredTalkers} isLoading={isLoading} isLight={isLight} searchQuery={search} />
        <SecurityEventsPanel blockedFlows={blockedFlows} analysisTime={analysisTime} isLoading={isLoading} isLight={isLight} />
      </div>

      {/* ── Recent Flows ── */}
      <RecentFlowsTable
        flows={filteredFlows}
        analysisTime={analysisTime}
        isLoading={isLoading}
        isLight={isLight}
        searchQuery={search}
        onClearSearch={onClearSearch}
      />

      {/* ── Summary cards ── */}
      <SummaryCards data={data} glowEnabled={glowEnabled} onGlowToggle={onGlowToggle} rawJson={data} isLight={isLight} />
    </div>
  );
}
