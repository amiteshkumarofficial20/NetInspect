import { useMemo, useRef, useState } from "react";
import "./App.css";
import type { AnalysisResult} from "./types/analysis";
import { analyzePcap } from "./services/api";

type NavItem = {
    id: string;
    label: string;
    icon: string;
};

const navItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: "⌂" },
    { id: "pcap", label: "PCAP Analysis", icon: "▣" },
    { id: "applications", label: "Applications", icon: "▦" },
    { id: "domains", label: "Domains / SNI", icon: "◎" },
    { id: "flows", label: "Flows", icon: "⌘" },
    { id: "rules", label: "Blocking / Rules", icon: "◇" },
    { id: "reports", label: "Reports", icon: "▤" },
    { id: "settings", label: "Settings", icon: "⚙" },
];

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatNumber(value: number): string {
    return new Intl.NumberFormat("en-US").format(value);
}



function truncate(value: string, length = 28): string {
    if (value.length <= length) return value;
    return `${value.slice(0, length - 1)}…`;
}

function StatCard({
    icon,
    label,
    value,
    tone = "blue",
    subtitle,
}: {
    icon: string;
    label: string;
    value: string;
    tone?: "blue" | "green" | "red" | "purple";
    subtitle?: string;
}) {
    return (
        <div className={`stat-card stat-${tone}`}>
            <div className="stat-top">
                <div className="stat-icon">{icon}</div>
                <span className="stat-label">{label}</span>
            </div>

            <div className="stat-value">{value}</div>

            {subtitle && <div className="stat-subtitle">{subtitle}</div>}
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="empty-state">
            <div className="empty-logo">∿</div>
            <h3>No analysis loaded</h3>
            <p>{message}</p>
        </div>
    );
}

function App() {
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [activeNav, setActiveNav] = useState("dashboard");
    const [themeGlow, setThemeGlow] = useState(true);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const applications = useMemo(() => {
        if (!analysis) return [];

        const raw = analysis.applications;

        if (Array.isArray(raw)) {
            return raw.map((item) => ({
                name: String(item.name ?? "Unknown"),
                packets: Number(item.packets ?? 0),
            })).filter((item) => Number.isFinite(item.packets)).sort((a, b) => b.packets - a.packets);
        }

        return Object.entries(raw).map(([name, packets]) => ({
            name,
            packets: Number(packets),
        })).filter((item) => Number.isFinite(item.packets)).sort((a, b) => b.packets - a.packets);
    }, [analysis]);

    const domains = useMemo(() => {
        if (!analysis) return [];

        const counts = new Map<
            string,
            { domain: string; application: string; packets: number }
        >();

        for (const item of analysis.domains) {
            const key = `${item.domain}|${item.application}`;

            const existing = counts.get(key);

            if (existing) {
                existing.packets += 1;
            } else {
                counts.set(key, {
                    domain: item.domain,
                    application: item.application,
                    packets: 1,
                });
            }
        }

        return Array.from(counts.values()).sort(
            (a, b) => b.packets - a.packets
        );
    }, [analysis]);

    const flows = useMemo(() => {
        if (!analysis) return [];

        return [...analysis.flows].sort((a, b) => b.bytes - a.bytes);
    }, [analysis]);

    const filteredFlows = useMemo(() => {
        if (!search.trim()) return flows;

        const query = search.toLowerCase();

        return flows.filter((flow) =>
            [
                flow.sourceIp,
                flow.destinationIp,
                flow.sourcePort,
                flow.destinationPort,
                flow.protocol,
                flow.application,
                flow.domain,
            ]
                .join(" ")
                .toLowerCase()
                .includes(query)
        );
    }, [flows, search]);

    const topTalkers = useMemo(() => {
        if (!analysis) return [];

        const talkers = new Map<
            string,
            { sourceIp: string; bytes: number; packets: number }
        >();

        for (const flow of analysis.flows) {
            const existing = talkers.get(flow.sourceIp);

            if (existing) {
                existing.bytes += flow.bytes;
                existing.packets += flow.packets;
            } else {
                talkers.set(flow.sourceIp, {
                    sourceIp: flow.sourceIp,
                    bytes: flow.bytes,
                    packets: flow.packets,
                });
            }
        }

        return Array.from(talkers.values())
            .sort((a, b) => b.bytes - a.bytes)
            .slice(0, 6);
    }, [analysis]);

    const protocolStats = useMemo(() => {
        if (!analysis) return [];

        const total =
            analysis.summary.tcpPackets + analysis.summary.udpPackets;

        const tcp = analysis.summary.tcpPackets;
        const udp = analysis.summary.udpPackets;

        return [
            {
                name: "TCP",
                value: tcp,
                percentage: total ? (tcp / total) * 100 : 0,
            },
            {
                name: "UDP",
                value: udp,
                percentage: total ? (udp / total) * 100 : 0,
            },
        ];
    }, [analysis]);

    const securityEvents = useMemo(() => {
        if (!analysis) return [];

        return analysis.flows
            .filter((flow) => flow.blocked)
            .sort((a, b) => b.bytes - a.bytes)
            .slice(0, 8);
    }, [analysis]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) return;

        setSelectedFile(file);
        setError("");
    };

    const handleAnalyze = async () => {
        if (!selectedFile) {
            fileInputRef.current?.click();
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await analyzePcap(selectedFile);

            setAnalysis(response.result);
            setActiveNav("dashboard");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to analyze PCAP"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleNav = (id: string) => {
        setActiveNav(id);

        const element = document.getElementById(id);

        if (element) {
            element.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    };

    const totalApplicationPackets =
        applications.reduce((sum, item) => sum + item.packets, 0);

    return (
        <div className={`app ${themeGlow ? "glow-enabled" : ""}`}>
            <aside className="sidebar">
                <div className="brand-area">
                    <div className="brand-mark">∿</div>

                    <div>
                        <div className="brand-name">NetInspect</div>
                        <div className="brand-tagline">
                            Deep Packet Inspection
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            className={`nav-item ${
                                activeNav === item.id ? "active" : ""
                            }`}
                            onClick={() => handleNav(item.id)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="sidebar-bottom">
                    <div className="sidebar-card">
                        <div className="sidebar-card-logo">∿</div>

                        <div>
                            <strong>NetInspect</strong>
                            <p>Inspect.</p>
                            <p>Analyze.</p>
                            <p>Secure.</p>
                            <p>Your Network.</p>
                        </div>
                    </div>

                    <div className="version">v1.0.0</div>
                </div>
            </aside>

            <main className="main-content">
                <header className="topbar">
                    <div className="search-box">
                        <span className="search-icon">⌕</span>

                        <input
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Search applications, domains, IPs, or flows..."
                        />
                    </div>

                    <div className="topbar-actions">
                        <div className="engine-status">
                            <span className="online-dot" />
                            <div>
                                <strong>Engine Online</strong>
                                <small>C++ DPI Engine</small>
                            </div>
                        </div>

                        <button
                            className="analyze-button"
                            onClick={() => {
                                if (!selectedFile) {
                                    fileInputRef.current?.click();
                                } else {
                                    void handleAnalyze();
                                }
                            }}
                            disabled={loading}
                        >
                            <span>↥</span>
                            {loading ? "Analyzing..." : "Analyze PCAP"}
                        </button>

                        <button
                            className="icon-button"
                            title="Notifications"
                        >
                            ♢
                        </button>

                        <button
                            className="icon-button"
                            title="Toggle glow"
                            onClick={() => setThemeGlow((value) => !value)}
                        >
                            ◐
                        </button>

                        <div className="profile">N</div>
                    </div>
                </header>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pcap,.pcapng"
                    className="hidden-input"
                    onChange={handleFileChange}
                />

                <section id="dashboard" className="dashboard-section">
                    <div className="page-heading">
                        <div>
                            <h1>Network Intelligence Dashboard</h1>
                            <p>
                                Real traffic. Real analysis. Complete
                                visibility.
                            </p>
                        </div>

                        {selectedFile && (
                            <div className="selected-file">
                                <span>Selected:</span>
                                <strong>{selectedFile.name}</strong>
                                <button
                                    onClick={() => setSelectedFile(null)}
                                >
                                    ×
                                </button>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="error-banner">
                            <strong>Analysis failed</strong>
                            <span>{error}</span>
                        </div>
                    )}

                    {!analysis ? (
                        <div id="pcap" className="analysis-empty-panel">
                            <EmptyState message="Upload a PCAP file to populate this dashboard with real DPI engine results." />

                            <button
                                className="large-analyze-button"
                                onClick={() => {
                                    if (!selectedFile) {
                                        fileInputRef.current?.click();
                                    } else {
                                        void handleAnalyze();
                                    }
                                }}
                                disabled={loading}
                            >
                                {loading
                                    ? "Analyzing PCAP..."
                                    : "Analyze a PCAP"}
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="analysis-info">
                                <div className="analysis-file-icon">▣</div>

                                <div className="analysis-file-info">
                                    <span>Last Analyzed File</span>
                                    <strong>
                                        {selectedFile?.name ??
                                            "PCAP Analysis"}
                                    </strong>
                                </div>

                                <div className="analysis-complete">
                                    <span className="complete-dot" />
                                    Analysis Complete
                                </div>

                                <button
                                    className="report-button"
                                    onClick={() =>
                                        handleNav("reports")
                                    }
                                >
                                    View Report →
                                </button>
                            </div>

                            <div className="stats-grid">
                                <StatCard
                                    icon="♧"
                                    label="Total Packets"
                                    value={formatNumber(
                                        analysis.summary.totalPackets
                                    )}
                                />

                                <StatCard
                                    icon="◉"
                                    label="Total Bytes"
                                    value={formatBytes(
                                        analysis.summary.totalBytes
                                    )}
                                    tone="purple"
                                />

                                <StatCard
                                    icon="⌘"
                                    label="Total Flows"
                                    value={formatNumber(flows.length)}
                                />

                                <StatCard
                                    icon="▦"
                                    label="Applications"
                                    value={formatNumber(
                                        applications.length
                                    )}
                                />

                                <StatCard
                                    icon="→"
                                    label="Forwarded Packets"
                                    value={formatNumber(
                                        analysis.summary.forwardedPackets
                                    )}
                                    tone="green"
                                    subtitle={
                                        analysis.summary.totalPackets
                                            ? `${(
                                                  (analysis.summary
                                                      .forwardedPackets /
                                                      analysis.summary
                                                          .totalPackets) *
                                                  100
                                              ).toFixed(1)}%`
                                            : "0%"
                                    }
                                />

                                <StatCard
                                    icon="×"
                                    label="Dropped Packets"
                                    value={formatNumber(
                                        analysis.summary.droppedPackets
                                    )}
                                    tone="red"
                                    subtitle={
                                        analysis.summary.totalPackets
                                            ? `${(
                                                  (analysis.summary
                                                      .droppedPackets /
                                                      analysis.summary
                                                          .totalPackets) *
                                                  100
                                              ).toFixed(1)}%`
                                            : "0%"
                                    }
                                />
                            </div>

                            <section className="content-grid">
                                <div
                                    id="applications"
                                    className="panel visualization-panel"
                                >
                                    <div className="panel-heading">
                                        <div>
                                            <h2>
                                                Network Traffic
                                                Visualization
                                            </h2>
                                            <p>
                                                Detected application traffic
                                                and flow relationships
                                            </p>
                                        </div>
                                    </div>

                                    <div className="network-visual">
                                        <div className="network-lines">
                                            <span className="line line-one" />
                                            <span className="line line-two" />
                                            <span className="line line-three" />
                                            <span className="line line-four" />
                                            <span className="line line-five" />
                                        </div>

                                        <div className="network-source">
                                            <div className="source-icon">▣</div>
                                            <div>
                                                <strong>Analyzed Traffic</strong>
                                                <span>
                                                    {
                                                        analysis.summary
                                                            .totalPackets
                                                    }{" "}
                                                    packets
                                                </span>
                                            </div>
                                        </div>

                                        <div className="network-core">
                                            <div className="core-symbol">∿</div>
                                            <strong>NetInspect</strong>
                                            <span>DPI Engine</span>
                                        </div>

                                        <div className="network-app-list">
                                            {applications
                                                .slice(0, 6)
                                                .map((app) => {
                                                    const percentage =
                                                        totalApplicationPackets
                                                            ? (app.packets /
                                                                  totalApplicationPackets) *
                                                              100
                                                            : 0;

                                                    return (
                                                        <div
                                                            className="network-app"
                                                            key={app.name}
                                                        >
                                                            <div className="app-color">
                                                                {app.name
                                                                    .charAt(
                                                                        0
                                                                    )
                                                                    .toUpperCase()}
                                                            </div>

                                                            <div className="app-info">
                                                                <strong>
                                                                    {truncate(
                                                                        app.name,
                                                                        20
                                                                    )}
                                                                </strong>

                                                                <span>
                                                                    {formatNumber(
                                                                        app.packets
                                                                    )}{" "}
                                                                    packets
                                                                </span>
                                                            </div>

                                                            <span className="app-percent">
                                                                {percentage.toFixed(
                                                                    1
                                                                )}
                                                                %
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>

                                    <div className="legend">
                                        <span>
                                            <i className="legend-blue" />
                                            Allowed Traffic
                                        </span>

                                        <span>
                                            <i className="legend-red" />
                                            Blocked Traffic
                                        </span>
                                    </div>
                                </div>

                                <div className="right-stack">
                                    <div className="panel distribution-panel">
                                        <div className="panel-heading compact">
                                            <div>
                                                <h2>
                                                    Application Traffic
                                                    Distribution
                                                </h2>
                                            </div>

                                            <button
                                                onClick={() =>
                                                    handleNav(
                                                        "applications"
                                                    )
                                                }
                                            >
                                                View All →
                                            </button>
                                        </div>

                                        <div className="donut-row">
                                            <div
                                                className="donut"
                                                style={{
                                                    background:
                                                        applications.length
                                                            ? `conic-gradient(
                                                            #1689ff 0deg ${Math.min(
                                                                360,
                                                                (applications[0]
                                                                    ?.packets /
                                                                    totalApplicationPackets) *
                                                                    360
                                                            )}deg,
                                                            #25d695 ${Math.min(
                                                                360,
                                                                (applications[0]
                                                                    ?.packets /
                                                                    totalApplicationPackets) *
                                                                    360
                                                            )}deg ${Math.min(
                                                                360,
                                                                ((applications[0]
                                                                    ?.packets +
                                                                    (applications[1]
                                                                        ?.packets ||
                                                                        0)) /
                                                                    totalApplicationPackets) *
                                                                    360
                                                            )}deg,
                                                            #8c5cff ${Math.min(
                                                                360,
                                                                ((applications[0]
                                                                    ?.packets +
                                                                    (applications[1]
                                                                        ?.packets ||
                                                                        0) +
                                                                    (applications[2]
                                                                        ?.packets ||
                                                                        0)) /
                                                                    totalApplicationPackets) *
                                                                    360
                                                            )}deg,
                                                            #ffb52e ${Math.min(
                                                                360,
                                                                ((applications[0]
                                                                    ?.packets +
                                                                    (applications[1]
                                                                        ?.packets ||
                                                                        0) +
                                                                    (applications[2]
                                                                        ?.packets ||
                                                                        0) +
                                                                    (applications[3]
                                                                        ?.packets ||
                                                                        0)) /
                                                                    totalApplicationPackets) *
                                                                    360
                                                            )}deg,
                                                            #31445b ${Math.min(
                                                                360,
                                                                ((applications[0]
                                                                    ?.packets +
                                                                    (applications[1]
                                                                        ?.packets ||
                                                                        0) +
                                                                    (applications[2]
                                                                        ?.packets ||
                                                                        0) +
                                                                    (applications[3]
                                                                        ?.packets ||
                                                                        0) +
                                                                    (applications[4]
                                                                        ?.packets ||
                                                                        0)) /
                                                                    totalApplicationPackets) *
                                                                    360
                                                            )}deg,
                                                            #16263a 0deg 360deg)`
                                                            : "#16263a",
                                                }}
                                            >
                                                <div>
                                                    <strong>
                                                        {formatNumber(
                                                            analysis.summary
                                                                .totalPackets
                                                        )}
                                                    </strong>
                                                    <span>Packets</span>
                                                </div>
                                            </div>

                                            <div className="distribution-list">
                                                {applications
                                                    .slice(0, 6)
                                                    .map((app, index) => {
                                                        const percentage =
                                                            totalApplicationPackets
                                                                ? (app.packets /
                                                                      totalApplicationPackets) *
                                                                  100
                                                                : 0;

                                                        return (
                                                            <div
                                                                className="distribution-item"
                                                                key={app.name}
                                                            >
                                                                <i
                                                                    className={`distribution-dot dot-${index}`}
                                                                />

                                                                <span>
                                                                    {truncate(
                                                                        app.name,
                                                                        18
                                                                    )}
                                                                </span>

                                                                <strong>
                                                                    {percentage.toFixed(
                                                                        1
                                                                    )}
                                                                    %
                                                                </strong>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="panel protocol-panel">
                                        <div className="panel-heading compact">
                                            <div>
                                                <h2>
                                                    Protocol Distribution
                                                </h2>
                                            </div>
                                        </div>

                                        {protocolStats.map((protocol) => (
                                            <div
                                                className="protocol-row"
                                                key={protocol.name}
                                            >
                                                <span>
                                                    {protocol.name}
                                                </span>

                                                <div className="protocol-track">
                                                    <div
                                                        className={`protocol-fill ${
                                                            protocol.name ===
                                                            "TCP"
                                                                ? "tcp"
                                                                : "udp"
                                                        }`}
                                                        style={{
                                                            width: `${protocol.percentage}%`,
                                                        }}
                                                    />
                                                </div>

                                                <strong>
                                                    {protocol.percentage.toFixed(
                                                        1
                                                    )}
                                                    %
                                                </strong>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            <section className="four-grid">
                                <div className="panel mini-panel">
                                    <div className="panel-heading compact">
                                        <h2>Top Applications</h2>

                                        <button
                                            onClick={() =>
                                                handleNav(
                                                    "applications"
                                                )
                                            }
                                        >
                                            View All →
                                        </button>
                                    </div>

                                    <div className="table-wrap">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Application</th>
                                                    <th>Packets</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {applications
                                                    .slice(0, 6)
                                                    .map((app, index) => (
                                                        <tr key={app.name}>
                                                            <td>
                                                                {index + 1}
                                                            </td>
                                                            <td>
                                                                <span className="table-app">
                                                                    <i>
                                                                        {app.name.charAt(
                                                                            0
                                                                        )}
                                                                    </i>
                                                                    {truncate(
                                                                        app.name
                                                                    )}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {formatNumber(
                                                                    app.packets
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div
                                    id="domains"
                                    className="panel mini-panel"
                                >
                                    <div className="panel-heading compact">
                                        <h2>Top Domains / SNI</h2>

                                        <button
                                            onClick={() =>
                                                handleNav("domains")
                                            }
                                        >
                                            View All →
                                        </button>
                                    </div>

                                    <div className="table-wrap">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Domain</th>
                                                    <th>Application</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {domains
                                                    .slice(0, 6)
                                                    .map((item, index) => (
                                                        <tr
                                                            key={`${item.domain}-${item.application}`}
                                                        >
                                                            <td>
                                                                {index + 1}
                                                            </td>
                                                            <td>
                                                                {truncate(
                                                                    item.domain
                                                                )}
                                                            </td>
                                                            <td>
                                                                {
                                                                    item.application
                                                                }
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="panel mini-panel">
                                    <div className="panel-heading compact">
                                        <h2>Top Talkers</h2>

                                        <button
                                            onClick={() =>
                                                handleNav("flows")
                                            }
                                        >
                                            View All →
                                        </button>
                                    </div>

                                    <div className="table-wrap">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Source IP</th>
                                                    <th>Bytes</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {topTalkers.map(
                                                    (talker, index) => (
                                                        <tr
                                                            key={
                                                                talker.sourceIp
                                                            }
                                                        >
                                                            <td>
                                                                {index + 1}
                                                            </td>
                                                            <td>
                                                                {
                                                                    talker.sourceIp
                                                                }
                                                            </td>
                                                            <td>
                                                                {formatBytes(
                                                                    talker.bytes
                                                                )}
                                                            </td>
                                                        </tr>
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="panel mini-panel">
                                    <div className="panel-heading compact">
                                        <h2>Security Events</h2>

                                        <button
                                            onClick={() =>
                                                handleNav("rules")
                                            }
                                        >
                                            View All →
                                        </button>
                                    </div>

                                    <div className="security-list">
                                        {securityEvents.length === 0 ? (
                                            <div className="no-events">
                                                No blocked flows detected.
                                            </div>
                                        ) : (
                                            securityEvents
                                                .slice(0, 5)
                                                .map((flow) => (
                                                    <div
                                                        className="security-event"
                                                        key={`${flow.sourceIp}-${flow.destinationIp}-${flow.destinationPort}`}
                                                    >
                                                        <span className="event-dot" />

                                                        <div>
                                                            <strong>
                                                                {
                                                                    flow.application
                                                                }
                                                            </strong>
                                                            <small>
                                                                {
                                                                    flow.sourceIp
                                                                }{" "}
                                                                →{" "}
                                                                {truncate(
                                                                    flow.domain ||
                                                                        flow.destinationIp,
                                                                    24
                                                                )}
                                                            </small>
                                                        </div>

                                                        <b>BLOCKED</b>
                                                    </div>
                                                ))
                                        )}
                                    </div>
                                </div>
                            </section>

                            <section id="flows" className="panel flows-panel">
                                <div className="panel-heading">
                                    <div>
                                        <h2>Recent Flows</h2>
                                        <p>
                                            Complete flow visibility from the
                                            DPI engine
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => setSearch("")}
                                    >
                                        Clear Search →
                                    </button>
                                </div>

                                <div className="flow-table-wrap">
                                    <table className="flow-table">
                                        <thead>
                                            <tr>
                                                <th>Source IP</th>
                                                <th>Destination</th>
                                                <th>Src Port</th>
                                                <th>Dst Port</th>
                                                <th>Application</th>
                                                <th>Protocol</th>
                                                <th>Domain / SNI</th>
                                                <th>Packets</th>
                                                <th>Bytes</th>
                                                <th>Blocked</th>
                                                <th>Classified</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {filteredFlows
                                                .slice(0, 100)
                                                .map((flow, index) => (
                                                    <tr
                                                        key={`${flow.sourceIp}-${flow.destinationIp}-${flow.sourcePort}-${flow.destinationPort}-${index}`}
                                                    >
                                                        <td>
                                                            {
                                                                flow.sourceIp
                                                            }
                                                        </td>

                                                        <td>
                                                            {truncate(
                                                                flow.destinationIp,
                                                                24
                                                            )}
                                                        </td>

                                                        <td>
                                                            {
                                                                flow.sourcePort
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                flow.destinationPort
                                                            }
                                                        </td>

                                                        <td>
                                                            <span className="flow-app">
                                                                {
                                                                    flow.application
                                                                }
                                                            </span>
                                                        </td>

                                                        <td>
                                                            <span
                                                                className={`protocol-badge ${
                                                                    (String(flow.protocol) === "6" || String(flow.protocol).toLowerCase() === "tcp")
                                                                        ? "tcp-badge"
                                                                        : "udp-badge"
                                                                }`}
                                                            >
                                                                {
                                                                    (String(flow.protocol) === "6" ? "TCP" : String(flow.protocol) === "17" ? "UDP" : String(flow.protocol))
                                                                }
                                                            </span>
                                                        </td>

                                                        <td>
                                                            {truncate(
                                                                flow.domain ||
                                                                    "—",
                                                                28
                                                            )}
                                                        </td>

                                                        <td>
                                                            {formatNumber(
                                                                flow.packets
                                                            )}
                                                        </td>

                                                        <td>
                                                            {formatBytes(
                                                                flow.bytes
                                                            )}
                                                        </td>

                                                        <td>
                                                            <span
                                                                className={`status-badge ${
                                                                    flow.blocked
                                                                        ? "blocked"
                                                                        : "allowed"
                                                                }`}
                                                            >
                                                                {flow.blocked
                                                                    ? "BLOCKED"
                                                                    : "ALLOWED"}
                                                            </span>
                                                        </td>

                                                        <td>
                                                            <span
                                                                className={`classified ${
                                                                    flow.classified
                                                                        ? "yes"
                                                                        : "no"
                                                                }`}
                                                            >
                                                                {flow.classified
                                                                    ? "YES"
                                                                    : "NO"}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>

                                    {filteredFlows.length === 0 && (
                                        <div className="table-empty">
                                            No flows match your search.
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section
                                id="rules"
                                className="bottom-detail-grid"
                            >
                                <div className="panel detail-panel">
                                    <div className="panel-heading compact">
                                        <h2>Blocking / Rules</h2>
                                    </div>

                                    <div className="rule-summary">
                                        <div className="rule-number">
                                            {
                                                analysis.summary
                                                    .droppedPackets
                                            }
                                        </div>

                                        <div>
                                            <strong>
                                                Dropped Packets
                                            </strong>

                                            <p>
                                                Packets blocked by active DPI
                                                rules.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rule-bar">
                                        <div
                                            style={{
                                                width: `${
                                                    analysis.summary
                                                        .totalPackets
                                                        ? (analysis.summary
                                                              .droppedPackets /
                                                              analysis.summary
                                                                  .totalPackets) *
                                                          100
                                                        : 0
                                                }%`,
                                            }}
                                        />
                                    </div>
                                </div>

                                <div
                                    id="reports"
                                    className="panel detail-panel"
                                >
                                    <div className="panel-heading compact">
                                        <h2>Reports</h2>
                                    </div>

                                    <div className="report-content">
                                        <div className="report-icon">
                                            ▤
                                        </div>

                                        <div>
                                            <strong>
                                                Machine-readable report
                                            </strong>

                                            <p>
                                                JSON output generated directly
                                                by the C++ DPI engine.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    id="settings"
                                    className="panel detail-panel"
                                >
                                    <div className="panel-heading compact">
                                        <h2>Settings</h2>
                                    </div>

                                    <div className="settings-row">
                                        <div>
                                            <strong>Visual Glow</strong>
                                            <p>
                                                Enable dashboard network
                                                effects.
                                            </p>
                                        </div>

                                        <button
                                            className={`toggle ${
                                                themeGlow ? "on" : ""
                                            }`}
                                            onClick={() =>
                                                setThemeGlow((value) => !value)
                                            }
                                        >
                                            <span />
                                        </button>
                                    </div>
                                </div>
                            </section>
                        </>
                    )}
                </section>
            </main>
        </div>
    );
}

export default App;
