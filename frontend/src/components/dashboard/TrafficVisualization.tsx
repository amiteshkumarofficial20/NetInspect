import { useState, useMemo } from "react";
import { Maximize2, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { AnalysisResult } from "../../types";
import { AppIcon, getAppColor } from "../../lib/appIcons";
import { DotGridBackground } from "../ui/DotGridBackground";
import { StatusBadge } from "../ui/Badge";
import { formatNumber } from "../../lib/api";
import { cn } from "../../lib/utils";

type ViewMode = "Applications" | "Domains" | "IPs" | "Protocols";
const VIEW_MODES: ViewMode[] = ["Applications", "Domains", "IPs", "Protocols"];

interface TrafficVisualizationProps {
  data: AnalysisResult | null;
  glowEnabled: boolean;
  isLight: boolean;
  fileName: string | null;
}

interface AppChip {
  name: string;
  packets: number;
  blocked: boolean;
  color: string;
}

export function TrafficVisualization({
  data,
  glowEnabled,
  isLight,
  fileName,
}: TrafficVisualizationProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("Applications");

  /* Build chip list depending on view mode */
  const chips = useMemo((): AppChip[] => {
    if (!data) return [];

    if (viewMode === "Applications") {
      const blockedApps = new Set(
        data.flows.filter((f) => f.blocked).map((f) => f.application),
      );
      return data.applications.slice(0, 12).map((app) => ({
        name: app.name,
        packets: app.packets,
        blocked: blockedApps.has(app.name),
        color: getAppColor(app.name),
      }));
    }

    if (viewMode === "Domains") {
      const domCount = new Map<string, number>();
      data.domains.forEach((d) => {
        domCount.set(d.domain, (domCount.get(d.domain) ?? 0) + 1);
      });
      return Array.from(domCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, packets]) => ({
          name,
          packets,
          blocked: false,
          color: "#38bdf8",
        }));
    }

    if (viewMode === "IPs") {
      const ipMap = new Map<string, number>();
      data.flows.forEach((f) => {
        ipMap.set(f.sourceIp, (ipMap.get(f.sourceIp) ?? 0) + f.packets);
      });
      return Array.from(ipMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, packets]) => ({
          name,
          packets,
          blocked: false,
          color: "#a855f7",
        }));
    }

    // Protocols
    const protoMap = new Map<string, number>();
    data.flows.forEach((f) => {
      protoMap.set(f.protocol, (protoMap.get(f.protocol) ?? 0) + f.packets);
    });
    return Array.from(protoMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, packets]) => ({
        name,
        packets,
        blocked: false,
        color:
          name === "TCP" ? "#3b82f6" : name === "UDP" ? "#22c55e" : "#f59e0b",
      }));
  }, [data, viewMode]);

  const hasData = data !== null;
  const totalPackets = data?.summary.totalPackets ?? 0;

  /* SVG layout constants */
  const W = 700;
  const H = 320;
  const LEFT_X = 110;
  const HUB_X = 330;
  const HUB_Y = H / 2;
  const RIGHT_X = 570;

  /* Vertical positions for each chip */
  const chipCount = Math.min(chips.length, 8);
  const chipH = 36;
  const chipGap = 6;
  const totalChipH = chipCount * (chipH + chipGap) - chipGap;
  const chipStartY = HUB_Y - totalChipH / 2;

  return (
    <div
      className={cn(
        "ni-card flex flex-col overflow-hidden",
        isLight ? "bg-white" : "",
      )}
      style={{ minHeight: 380 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0">
        <div>
          <h3
            className={cn(
              "font-semibold text-sm",
              isLight ? "text-gray-900" : "text-white",
            )}
          >
            Network Traffic Visualization
          </h3>
          <p
            className={cn(
              "text-xs mt-0.5",
              isLight ? "text-gray-500" : "text-muted",
            )}
          >
            Detected application traffic and flow relations
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div
            className={cn(
              "flex rounded-lg p-0.5 text-xs",
              isLight ? "bg-gray-100" : "bg-navy-900",
            )}
          >
            {VIEW_MODES.map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "px-2.5 py-1 rounded-md font-medium transition-all",
                  viewMode === mode
                    ? "bg-accent text-white"
                    : isLight
                      ? "text-gray-500 hover:text-gray-700"
                      : "text-muted hover:text-white",
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded-lg",
              isLight
                ? "text-gray-400 hover:bg-gray-100"
                : "text-muted hover:bg-white/5",
            )}
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* Visualization area */}
      <div className="relative flex-1" style={{ minHeight: 300 }}>
        <DotGridBackground />

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-full"
          style={{ minHeight: 280 }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* ── Connection lines from hub to chips ── */}
          {hasData &&
            chips.slice(0, chipCount).map((chip, i) => {
              const cy = chipStartY + i * (chipH + chipGap) + chipH / 2;
              const cp1x = HUB_X + (RIGHT_X - HUB_X) * 0.4;
              const cp2x = HUB_X + (RIGHT_X - HUB_X) * 0.7;
              const d = `M ${HUB_X} ${HUB_Y} C ${cp1x} ${HUB_Y}, ${cp2x} ${cy}, ${RIGHT_X - 90} ${cy}`;

              return (
                <motion.path
                  key={chip.name}
                  d={d}
                  fill="none"
                  stroke={chip.blocked ? "#ef4444" : chip.color}
                  strokeWidth={1.5}
                  strokeOpacity={0.6}
                  strokeDasharray="4 3"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.7 }}
                  transition={{
                    duration: 0.8,
                    delay: i * 0.08,
                    ease: "easeOut",
                  }}
                />
              );
            })}

          {/* ── Line from left node to hub ── */}
          <motion.line
            x1={LEFT_X + 70}
            y1={HUB_Y}
            x2={HUB_X - 40}
            y2={HUB_Y}
            stroke="#38bdf8"
            strokeWidth={2}
            strokeOpacity={0.5}
            strokeDasharray="6 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.7 }}
          />

          {/* ── Left Node: Local Network ── */}
          <g transform={`translate(${LEFT_X - 60}, ${HUB_Y - 38})`}>
            <rect
              width="140"
              height="76"
              rx="10"
              fill={isLight ? "#f1f5f9" : "#141b2d"}
              stroke="#38bdf8"
              strokeWidth="1"
              strokeOpacity="0.4"
            />
            <Monitor
              x={50}
              y={10}
              size={20}
              className="text-accent-light"
              color="#38bdf8"
            />
            <text
              x={70}
              y={40}
              textAnchor="middle"
              fill={isLight ? "#1e293b" : "white"}
              fontSize={10}
              fontWeight="600"
            >
              {hasData ? "Analyzed Traffic" : "Local Network"}
            </text>
            <text x={70} y={54} textAnchor="middle" fill="#94a3b8" fontSize={9}>
              {hasData
                ? `${formatNumber(totalPackets)} pkts`
                : "192.168.1.0/24"}
            </text>
          </g>

          {/* ── Hub Circle ── */}
          {glowEnabled && (
            <circle
              cx={HUB_X}
              cy={HUB_Y}
              r="48"
              fill="#38bdf8"
              fillOpacity="0.04"
            >
              <animate
                attributeName="r"
                values="44;52;44"
                dur="3s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="fill-opacity"
                values="0.04;0.08;0.04"
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>
          )}
          <circle
            cx={HUB_X}
            cy={HUB_Y}
            r="40"
            fill={isLight ? "#e0f2fe" : "#0d1b2e"}
            stroke="#38bdf8"
            strokeWidth="1.5"
            strokeOpacity="0.7"
          />
          <circle
            cx={HUB_X}
            cy={HUB_Y}
            r="34"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="0.5"
            strokeOpacity="0.3"
          />
          {/* Pulse icon inside hub */}
          <text
            x={HUB_X}
            y={HUB_Y - 6}
            textAnchor="middle"
            fill="#38bdf8"
            fontSize="18"
          >
            ∿
          </text>
          <text
            x={HUB_X}
            y={HUB_Y + 10}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="7.5"
            fontWeight="500"
          >
            NetInspect
          </text>

          {/* ── App Chips on right ── */}
          {chips.slice(0, chipCount).map((chip, i) => {
            const cy = chipStartY + i * (chipH + chipGap);
            return (
              <motion.g
                key={chip.name}
                transform={`translate(${RIGHT_X - 88}, ${cy})`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.07, duration: 0.4 }}
              >
                {/* Chip background */}
                <rect
                  width="178"
                  height={chipH}
                  rx="8"
                  fill={isLight ? "#f8fafc" : "#141b2d"}
                  stroke={chip.blocked ? "#ef4444" : "#1e293b"}
                  strokeWidth="1"
                  strokeOpacity="0.7"
                />
                {/* Colored accent left bar */}
                <rect
                  width="3"
                  height={chipH}
                  rx="2"
                  fill={chip.color}
                  opacity="0.8"
                />
                {/* App name */}
                <text
                  x={18}
                  y={chipH / 2 + 4}
                  fill={isLight ? "#1e293b" : "white"}
                  fontSize={9.5}
                  fontWeight="600"
                >
                  {chip.name.length > 14
                    ? chip.name.slice(0, 14) + "…"
                    : chip.name}
                </text>
                {/* Packet count */}
                <text x={18} y={chipH / 2 + 15} fill="#94a3b8" fontSize={8}>
                  {formatNumber(chip.packets)} pkts
                </text>
                {/* Status pill */}
                <rect
                  x="122"
                  y="10"
                  width={chip.blocked ? 48 : 44}
                  height="16"
                  rx="4"
                  fill={
                    chip.blocked
                      ? "rgba(239,68,68,0.15)"
                      : "rgba(34,197,94,0.15)"
                  }
                  stroke={
                    chip.blocked
                      ? "rgba(239,68,68,0.35)"
                      : "rgba(34,197,94,0.35)"
                  }
                  strokeWidth="0.8"
                />
                <text
                  x={chip.blocked ? 146 : 144}
                  y="21"
                  textAnchor="middle"
                  fill={chip.blocked ? "#ef4444" : "#22c55e"}
                  fontSize="7.5"
                  fontWeight="700"
                >
                  {chip.blocked ? "BLOCKED" : "ALLOWED"}
                </text>
              </motion.g>
            );
          })}

          {/* Empty state overlay */}
          {!hasData && (
            <g>
              <text
                x={W / 2}
                y={H / 2 + 105}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="12"
              >
                Upload a PCAP file to visualize traffic
              </text>
              <text
                x={W / 2}
                y={H / 2 + 123}
                textAnchor="middle"
                fill="#64748b"
                fontSize="10"
              >
                Click "Analyze PCAP" in the top bar
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Footer legend */}
      <div className="flex items-center gap-5 px-4 pb-3 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-accent" />
          <span
            className={cn("text-xs", isLight ? "text-gray-500" : "text-muted")}
          >
            Allowed Traffic
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-danger" />
          <span
            className={cn("text-xs", isLight ? "text-gray-500" : "text-muted")}
          >
            Blocked Traffic
          </span>
        </div>
      </div>
    </div>
  );
}
