// ============================================================================
// NetInspect API Client
// Endpoints: GET /api/health, POST /api/analyze
// All normalization happens here — no raw union types escape to components.
// ============================================================================

import type {
  AnalysisResult,
  AppEntry,
  RawAnalyzeResponse,
} from '../types';

const API_BASE = '/api'; // proxied to http://localhost:3000/api by Vite

// ── Normalization ────────────────────────────────────────────────────────────

function normalizeApplications(
  raw: Array<{ name: string; packets: number; bytes?: number }> | Record<string, number> | unknown,
): AppEntry[] {
  if (Array.isArray(raw)) {
    return raw
      .map((item) => ({
        name: String(item.name ?? 'Unknown'),
        packets: Number(item.packets ?? 0),
        bytes: item.bytes != null ? Number(item.bytes) : undefined,
      }))
      .filter((item) => Number.isFinite(item.packets) && item.packets >= 0)
      .sort((a, b) => b.packets - a.packets);
  }

  if (raw && typeof raw === 'object') {
    return Object.entries(raw as Record<string, unknown>)
      .map(([name, packets]) => ({
        name,
        packets: Number(packets),
      }))
      .filter((item) => Number.isFinite(item.packets) && item.packets >= 0)
      .sort((a, b) => b.packets - a.packets);
  }

  return [];
}

function normalizeProtocol(protocol: string | number): string {
  const value = String(protocol).toLowerCase();

  if (value === "6" || value === "tcp") return "TCP";
  if (value === "17" || value === "udp") return "UDP";
  if (value === "1" || value === "icmp") return "ICMP";

  return value.toUpperCase();
}

// ── Health Check ─────────────────────────────────────────────────────────────

/**
 * Check if the C++ DPI backend is reachable and healthy.
 * Returns true if the engine is online, false otherwise.
 * Times out after 3 seconds.
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${API_BASE}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) return false;
    const data = await res.json();
    return data?.status === 'ok';
  } catch {
    return false;
  }
}

// ── Analyze PCAP ─────────────────────────────────────────────────────────────

/**
 * Upload a PCAP file for analysis by the C++ DPI engine.
 * POST /api/analyze (multipart, field name: "pcap")
 *
 * Returns a fully normalized AnalysisResult — no union types.
 * Throws an Error with a human-readable message on failure.
 */
export async function analyzePcap(
  file: File,
  blockApp?: string,
): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append('pcap', file);

  const params = blockApp && blockApp !== 'None'
    ? `?blockApp=${encodeURIComponent(blockApp)}`
    : '';

  const res = await fetch(`${API_BASE}/analyze${params}`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    let message = `Analysis failed (HTTP ${res.status})`;
    try {
      const errData = await res.json();
      if (errData?.error) message = errData.error;
    } catch {
      // ignore JSON parse error
    }
    throw new Error(message);
  }

  const data: RawAnalyzeResponse = await res.json();
  const raw = data.result;

  return {
    summary: {
      totalPackets: Number(raw.summary?.totalPackets ?? 0),
      totalBytes: Number(raw.summary?.totalBytes ?? 0),
      tcpPackets: Number(raw.summary?.tcpPackets ?? 0),
      udpPackets: Number(raw.summary?.udpPackets ?? 0),
      forwardedPackets: Number(raw.summary?.forwardedPackets ?? 0),
      droppedPackets: Number(raw.summary?.droppedPackets ?? 0),
    },
    applications: normalizeApplications(raw.applications),
    domains: Array.isArray(raw.domains) ? raw.domains : [],
    flows: Array.isArray(raw.flows)
      ? raw.flows.map((flow) => ({
          ...flow,
          protocol: normalizeProtocol(flow.protocol),
        }))
      : [],
  };
}

// ── Utility formatters (shared across components) ────────────────────────────

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatPercent(value: number, total: number): string {
  if (total === 0) return '0.0%';
  return `${((value / total) * 100).toFixed(1)}%`;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatDateTime(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) + ', ' + formatTime(date);
}
