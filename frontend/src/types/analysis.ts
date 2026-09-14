export interface AnalysisSummary {
    totalPackets: number;
    totalBytes: number;
    tcpPackets: number;
    udpPackets: number;
    forwardedPackets: number;
    droppedPackets: number;
}

export interface ApplicationEntry {
    name: string;
    packets: number;
}

export interface DomainEntry {
    domain: string;
    application: string;
}

export interface Flow {
    sourceIp: string;
    destinationIp: string;
    sourcePort: number;
    destinationPort: number;
    protocol: string | number;
    application: string;
    domain: string;
    packets: number;
    bytes: number;
    blocked: boolean;
    classified: boolean;
}

export interface AnalysisResult {
    summary: AnalysisSummary;
    applications: Record<string, number> | ApplicationEntry[];
    domains: DomainEntry[];
    flows: Flow[];
}

export interface AnalyzeResponse {
    status: string;
    result: AnalysisResult;
}
