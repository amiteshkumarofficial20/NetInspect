// ============================================================================
// NetInspect Frontend — TypeScript Interfaces
// Mirrors the C++ DPI engine data model exactly.
// ============================================================================

/** All AppType values emitted by the C++ engine's appTypeToString() */
export type AppType =
  | 'Unknown' | 'HTTP' | 'HTTPS' | 'DNS' | 'TLS' | 'QUIC'
  | 'Google' | 'Facebook' | 'YouTube' | 'Twitter/X' | 'Instagram'
  | 'Netflix' | 'Amazon' | 'Microsoft' | 'Apple' | 'Spotify'
  | 'Discord' | 'Zoom' | 'Steam' | 'Dropbox' | 'Cloudflare'
  | 'WhatsApp' | 'Telegram' | 'Reddit' | 'LinkedIn' | 'GitHub'
  | 'Twitch' | 'Gaming' | 'Streaming' | 'Other'
  | string; // catch-all for future enum extensions

/** Five-tuple uniquely identifying a connection (fields serialized as strings by backend) */
export interface FiveTuple {
  src_ip: string;
  dst_ip: string;
  src_port: number;
  dst_port: number;
  protocol: number; // 6=TCP, 17=UDP, 1=ICMP
}

/** A single flow entry as returned by the engine JSON */
export interface Flow {
  sourceIp: string;
  destinationIp: string;
  sourcePort: number;
  destinationPort: number;
  /** Protocol string: "TCP" | "UDP" | "ICMP" */
  protocol: string;
  /** Application name — matches AppType enum strings */
  application: string;
  /** SNI hostname if extracted, empty string otherwise */
  domain: string;
  packets: number;
  bytes: number;
  /** True if this flow was dropped by a blocking rule */
  blocked: boolean;
  /** True if the application was identified by the DPI classifier */
  classified: boolean;
}

/** A normalized application traffic entry */
export interface AppEntry {
  name: string;
  packets: number;
  /** bytes may not be present in all engine versions */
  bytes?: number;
}

/** A domain/SNI detection entry */
export interface DomainEntry {
  domain: string;
  application: string;
}

/** Summary statistics emitted by the engine */
export interface AnalysisSummary {
  totalPackets: number;
  totalBytes: number;
  tcpPackets: number;
  udpPackets: number;
  forwardedPackets: number;
  droppedPackets: number;
}

/** Full normalized analysis result (after normalization in api.ts) */
export interface AnalysisResult {
  summary: AnalysisSummary;
  /** Sorted descending by packets (normalized from array or object-map) */
  applications: AppEntry[];
  domains: DomainEntry[];
  flows: Flow[];
}

/**
 * Raw shape from POST /api/analyze before normalization.
 * The engine may emit applications as an array OR an object map.
 */
export interface RawAnalyzeResponse {
  result: {
    summary: AnalysisSummary;
    applications:
      | Array<{ name: string; packets: number; bytes?: number }>
      | Record<string, number>;
    domains: DomainEntry[];
    flows: Flow[];
  };
}

/** Health check response from GET /api/health */
export interface HealthResponse {
  status: string;
  service: string;
}

/** Engine connection status */
export type EngineStatus = 'checking' | 'online' | 'offline';

/** State machine for the analysis workflow */
export type AnalysisStatus = 'idle' | 'loading' | 'success' | 'error';

/** Derived top-talker entry (aggregated client-side from flows) */
export interface TopTalker {
  sourceIp: string;
  bytes: number;
  packets: number;
}

/** Derived domain with packet count (deduplicated client-side) */
export interface DomainCount {
  domain: string;
  application: string;
  packets: number;
}

/** Protocol distribution row */
export interface ProtocolStat {
  name: string;
  packets: number;
  percentage: number;
  color: string;
}

/** Chart color assignments for app entries */
export const CHART_COLORS: string[] = [
  '#3b82f6', // blue  — HTTPS
  '#ef4444', // red   — YouTube
  '#22c55e', // green — Google
  '#a855f7', // purple — Spotify
  '#5865F2', // discord purple
  '#f59e0b', // amber — DNS
  '#ec4899', // pink  — HTTP
  '#14b8a6', // teal
  '#f97316', // orange
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#8b5cf6', // violet
  '#94a3b8', // gray  — Others/fallback
];
