import { useMemo } from 'react';
import { FileText, CheckCircle } from 'lucide-react';
import type { AnalysisResult, AnalysisStatus, DomainCount, TopTalker } from '../types';
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
  onClearSearch: () => void;
  glowEnabled: boolean;
  onGlowToggle: (v: boolean) => void;
  isLight: boolean;
}

export function Dashboard({
  data,
  status,
  error,
  analysisTime,
  formattedAnalysisTime,
  fileName,
  search,
  onClearSearch,
  glowEnabled,
  onGlowToggle,
  isLight,
}: DashboardProps) {
  const isLoading = status === 'loading';

  /* ── Derived data (client-side aggregation) ── */

  const filteredFlows = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.flows;

    return data.flows.filter((f) =>
      [
        f.sourceIp,
        f.destinationIp,
        f.application,
        f.domain,
        f.protocol,
        String(f.sourcePort),
        String(f.destinationPort),
      ]
        .join(' ')
        .toLowerCase()
        .includes(q),
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
      const existing = map.get(f.sourceIp);
      if (existing) {
        existing.bytes += f.bytes;
        existing.packets += f.packets;
      } else {
        map.set(f.sourceIp, { sourceIp: f.sourceIp, bytes: f.bytes, packets: f.packets });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.bytes - a.bytes);
  }, [data]);

  const topDomains = useMemo((): DomainCount[] => {
    if (!data) return [];
    const map = new Map<string, DomainCount>();
    data.domains.forEach((d) => {
      const key = `${d.domain}|${d.application}`;
      const ex = map.get(key);
      if (ex) {
        ex.packets += 1;
      } else {
        map.set(key, { domain: d.domain, application: d.application, packets: 1 });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.packets - a.packets);
  }, [data]);

  /* Filter 4-up tables by search query */
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

      {/* ── Page header row ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className={cn('text-2xl font-bold', isLight ? 'text-gray-900' : 'text-white')}>
            Network Intelligence Dashboard
          </h1>
          <p className={cn('text-sm mt-0.5', isLight ? 'text-gray-500' : 'text-muted')}>
            Real traffic. Real analysis. Complete visibility.
          </p>
        </div>

        {/* Last Analyzed File card */}
        <div
          className={cn(
            'ni-card px-4 py-3 flex items-center gap-3 flex-shrink-0',
          )}
        >
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              isLight ? 'bg-blue-50' : 'bg-accent/10',
            )}
          >
            <FileText size={16} className="text-accent-light" />
          </div>
          <div className="min-w-0">
            <p className={cn('text-[10px] mb-0.5', isLight ? 'text-gray-400' : 'text-muted')}>
              Last Analyzed File
            </p>
            <p className={cn('text-xs font-semibold truncate max-w-[160px]', isLight ? 'text-gray-800' : 'text-white')}>
              {fileName ?? 'No file analyzed'}
            </p>
            <p className={cn('text-[10px]', isLight ? 'text-gray-400' : 'text-muted')}>
              {formattedAnalysisTime ?? '—'}
            </p>
          </div>
          {status === 'success' && (
            <div className="flex flex-col items-end gap-1.5 ml-2">
              <Badge variant="complete">
                <CheckCircle size={9} className="mr-1" />
                Analysis Complete
              </Badge>
              <button className="text-[10px] text-accent-light hover:underline">
                View Report →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <StatCards data={data} status={status} isLight={isLight} />

      {/* ── Main visualization + right panels ── */}
      <div className="grid grid-cols-3 gap-4">
        {/* Traffic viz — 2/3 width */}
        <div className="col-span-2">
          <TrafficVisualization
            data={data}
            glowEnabled={glowEnabled}
            isLight={isLight}
            fileName={fileName}
          />
        </div>

        {/* Right column — 1/3 width */}
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
        <TopApplicationsTable
          applications={filteredApps}
          isLoading={isLoading}
          isLight={isLight}
          searchQuery={search}
        />
        <TopDomainsTable
          domains={filteredDomains}
          isLoading={isLoading}
          isLight={isLight}
          searchQuery={search}
        />
        <TopTalkersTable
          talkers={filteredTalkers}
          isLoading={isLoading}
          isLight={isLight}
          searchQuery={search}
        />
        <SecurityEventsPanel
          blockedFlows={blockedFlows}
          analysisTime={analysisTime}
          isLoading={isLoading}
          isLight={isLight}
        />
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

      {/* ── Summary cards row ── */}
      <SummaryCards
        data={data}
        glowEnabled={glowEnabled}
        onGlowToggle={onGlowToggle}
        rawJson={data}
        isLight={isLight}
      />
    </div>
  );
}
