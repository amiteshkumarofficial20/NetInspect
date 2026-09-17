# NetInspect Frontend

React + TypeScript + Vite dashboard for the NetInspect C++ DPI engine.

## Quick Start

```bash
cd frontend
npm install
npm run dev        # → http://localhost:5173
```

Backend must be running on port 3000:
```bash
cd backend && npm run dev
```

---

## Tech Stack

| Tool | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite 6 | Build tool + dev server |
| Tailwind CSS v3 | Dark-theme styling |
| recharts v2 | Donut chart, protocol bars |
| lucide-react | All UI icons |
| react-icons/si | Brand icons (YouTube, Spotify, Discord, etc.) |
| framer-motion v11 | SVG path animations in Traffic Visualization |
| @tanstack/react-virtual v3 | Virtualized Recent Flows table |
| react-router-dom v6 | Client-side routing |

---

## Backend API Contract

The backend (`backend/src/server.ts`) exposes **exactly 2 endpoints**.
All other data is derived client-side.

### `GET /api/health`
```json
{ "status": "ok", "service": "NetInspect Backend" }
```
Polled every **5 seconds** by `useEngineHealth` to drive the Engine Status indicator.

### `POST /api/analyze`
**Multipart form, field name: `pcap`**

Response:
```json
{
  "result": {
    "summary": {
      "totalPackets": 77,
      "totalBytes": 5734,
      "tcpPackets": 60,
      "udpPackets": 17,
      "forwardedPackets": 77,
      "droppedPackets": 0
    },
    "applications": [
      { "name": "HTTPS", "packets": 32 },
      { "name": "DNS",   "packets": 15 }
    ],
    "domains": [
      { "domain": "www.google.com", "application": "Google" }
    ],
    "flows": [
      {
        "sourceIp": "192.168.1.20",
        "destinationIp": "142.250.185.110",
        "sourcePort": 54321,
        "destinationPort": 443,
        "protocol": "TCP",
        "application": "HTTPS",
        "domain": "www.google.com",
        "packets": 32,
        "bytes": 2048,
        "blocked": false,
        "classified": true
      }
    ]
  }
}
```

> **Note:** `applications` may be emitted as either an array or an object map
> (`{"HTTPS": 32, "DNS": 15}`). The frontend normalizes both in `src/lib/api.ts`
> → `normalizeApplications()`. Only the canonical `AppEntry[]` type is used
> in components.

---

## Assumed / Stubbed Endpoints

| Feature | How Resolved |
|---|---|
| `/api/flows` | **Does not exist** — flows are inside the `/api/analyze` response |
| `/api/applications` | **Does not exist** — computed from `result.applications` |
| `/api/domains` | **Does not exist** — from `result.domains`, deduplicated client-side |
| `/api/report` download | Client-side `Blob` download of the cached JSON response |
| Blocking rules CRUD | UI-only stub; no `/api/rules` endpoint in current backend |
| Security events | `flows.filter(f => f.blocked)` client-side |
| Top Talkers | Aggregated by `sourceIp` across all flows client-side |
| ICMP packet count | `totalPackets - tcpPackets - udpPackets` (engine doesn't emit `icmpPackets`) |
| Per-flow timestamps | Engine emits none — analysis completion time shown for all flow rows |

---

## Project Structure

```
src/
├── lib/
│   ├── api.ts           # Typed fetch client + formatters (checkHealth, analyzePcap)
│   ├── appIcons.tsx     # AppType → react-icons/si brand icon map
│   └── utils.ts         # cn() className utility
├── types/
│   └── index.ts         # Full TS interfaces (FiveTuple, Flow, AppType, AnalysisResult…)
├── hooks/
│   ├── useEngineHealth.ts  # 5s polling, 3 states: checking/online/offline
│   └── useAnalysis.ts      # idle→loading→success/error state machine
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx     # Fixed left nav + brand footer
│   │   └── Topbar.tsx      # Full-width header with logo, search, status, upload
│   ├── dashboard/
│   │   ├── StatCards.tsx         # 6-stat strip
│   │   ├── TrafficVisualization.tsx  # SVG network diagram
│   │   ├── DonutChart.tsx        # Interactive recharts donut
│   │   ├── ProtocolBars.tsx      # TCP/UDP/ICMP/Others bars
│   │   ├── TopApplicationsTable.tsx
│   │   ├── TopDomainsTable.tsx
│   │   ├── TopTalkersTable.tsx
│   │   ├── SecurityEventsPanel.tsx
│   │   ├── RecentFlowsTable.tsx  # @tanstack/react-virtual, searchable
│   │   └── SummaryCards.tsx      # Blocking/Reports/Settings row
│   └── ui/
│       ├── Badge.tsx
│       ├── Card.tsx
│       ├── DotGridBackground.tsx  # Inline SVG dot-grid
│       ├── ProgressBar.tsx
│       └── SkeletonRow.tsx
├── pages/
│   ├── Dashboard.tsx    # Full implementation
│   └── StubPage.tsx     # Placeholder for all other routes
├── App.tsx              # BrowserRouter, theme, all state
└── main.tsx
```
