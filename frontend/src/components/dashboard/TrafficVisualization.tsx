import { useState, useMemo, useEffect, useCallback } from "react";
import { Maximize2, Monitor } from "lucide-react";
import { motion } from "framer-motion";
import type { AnalysisResult } from "../../types";
import { AppIcon, getAppColor } from "../../lib/appIcons";
import { DotGridBackground } from "../ui/DotGridBackground";
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

/* ── Shared layout constants ───────────────────────────── */
const CHIP_H = 38;
const CHIP_GAP = 6;
const NODE_W = 178;
const MAX_COMPACT = 6;

/* Compact (dashboard) coordinate system */
const W = 700;
const H = 320;
const LEFT_X = 110;
const HUB_X = 330;
const HUB_Y = H / 2;
const RIGHT_X = 570;

/* Expanded (modal) coordinate system */
const EXP_W = 1000;
const EXP_GAP = 10;
const EXP_PAD_Y = 70;
const EXP_LEFT_X = 150;
const EXP_HUB_X = 430;
const EXP_RIGHT_X = 780;
const EXP_MIN_H = 520;

function protocolColor(name: string): string {
  if (name === "TCP") return "#3b82f6";
  if (name === "UDP") return "#22c55e";
  if (name === "ICMP") return "#a855f7";
  return "#f59e0b";
}

/* ── Reusable node card ───────────────────────────────── */
interface NodeCardProps {
  chip: AppChip;
  isLight: boolean;
  isDomain?: boolean;
}

function NodeCard({ chip, isLight, isDomain = false }: NodeCardProps) {
  const displayName = isDomain
    ? chip.name.length > 10
      ? `${chip.name.slice(0, 10)}…`
      : chip.name
    : chip.name.length > 13
      ? `${chip.name.slice(0, 13)}…`
      : chip.name;

  return (
    <>
      <rect
        width={NODE_W}
        height={CHIP_H}
        rx="9"
        fill={isLight ? "#f8fafc" : "#141b2d"}
        stroke={chip.blocked ? "#ef4444" : chip.color}
        strokeWidth="1"
        strokeOpacity={chip.blocked ? 0.75 : 0.45}
      />

      <rect
        width="3"
        height={CHIP_H}
        rx="2"
        fill={chip.blocked ? "#ef4444" : chip.color}
      />

      <foreignObject x="10" y="8" width="26" height="26">
        <div className="w-6 h-6 flex items-center justify-center">
          <AppIcon name={chip.name} size={16} />
        </div>
      </foreignObject>

      <text
        x="42"
        y="17"
        fill={isLight ? "#1e293b" : "#ffffff"}
        fontSize="9.5"
        fontWeight="600"
      >
        {displayName}
      </text>

      <text x="42" y="30" fill="#94a3b8" fontSize="8">
        {formatNumber(chip.packets)} pkts
      </text>

      <rect
        x="122"
        y="13"
        width={chip.blocked ? 48 : 44}
        height="16"
        rx="4"
        fill={chip.blocked ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)"}
        stroke={chip.blocked ? "rgba(239,68,68,0.35)" : "rgba(34,197,94,0.35)"}
        strokeWidth="0.8"
      />

      <text
        x={chip.blocked ? 146 : 144}
        y="24"
        textAnchor="middle"
        fill={chip.blocked ? "#ef4444" : "#22c55e"}
        fontSize="7"
        fontWeight="700"
      >
        {chip.blocked ? "BLOCKED" : "ALLOWED"}
      </text>
    </>
  );
}

/* ── Reusable hub ─────────────────────────────────────── */
interface HubProps {
  cx: number;
  cy: number;
  isLight: boolean;
  glowEnabled: boolean;
  r?: number;
}

function Hub({ cx, cy, isLight, glowEnabled, r = 40 }: HubProps) {
  return (
    <>
      {glowEnabled && (
        <circle cx={cx} cy={cy} r={r + 8} fill="#38bdf8" fillOpacity="0.04">
          <animate
            attributeName="r"
            values={`${r + 4};${r + 12};${r + 4}`}
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
        cx={cx}
        cy={cy}
        r={r}
        fill={isLight ? "#e0f2fe" : "#0d1b2e"}
        stroke="#38bdf8"
        strokeWidth="1.5"
        strokeOpacity="0.7"
      />

      <circle
        cx={cx}
        cy={cy}
        r={r - 6}
        fill="none"
        stroke="#38bdf8"
        strokeWidth="0.5"
        strokeOpacity="0.3"
      />

      <text x={cx} y={cy - 6} textAnchor="middle" fill="#38bdf8" fontSize="18">
        ∿
      </text>

      <text
        x={cx}
        y={cy + 10}
        textAnchor="middle"
        fill="#94a3b8"
        fontSize="7.5"
        fontWeight="500"
      >
        NetInspect
      </text>
    </>
  );
}

/* ── Reusable source node ─────────────────────────────── */
interface SourceNodeProps {
  x: number;
  y: number;
  isLight: boolean;
  hasData: boolean;
  totalPackets: number;
}

function SourceNode({ x, y, isLight, hasData, totalPackets }: SourceNodeProps) {
  return (
    <g transform={`translate(${x}, ${y - 38})`}>
      <rect
        width="140"
        height="76"
        rx="10"
        fill={isLight ? "#f1f5f9" : "#141b2d"}
        stroke="#38bdf8"
        strokeWidth="1"
        strokeOpacity="0.4"
      />

      <Monitor x={50} y={10} size={20} color="#38bdf8" />

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
        {hasData ? `${formatNumber(totalPackets)} pkts` : "192.168.1.0/24"}
      </text>
    </g>
  );
}

export function TrafficVisualization({
  data,
  glowEnabled,
  isLight,
}: TrafficVisualizationProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("Applications");
  const [isExpanded, setIsExpanded] = useState(false);

  /* Build full chip list depending on view mode */
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
      const blockedDomains = new Set(
        data.flows.filter((f) => f.blocked && f.domain).map((f) => f.domain),
      );

      const domCount = new Map<string, number>();

      data.domains.forEach((d) => {
        domCount.set(d.domain, (domCount.get(d.domain) ?? 0) + 1);
      });

      return Array.from(domCount.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([name, packets]) => ({
          name,
          packets,
          blocked: blockedDomains.has(name),
          color: "#38bdf8",
        }));
    }

    if (viewMode === "IPs") {
      const blockedIps = new Set(
        data.flows.filter((f) => f.blocked).map((f) => f.sourceIp),
      );

      const ipMap = new Map<string, number>();

      data.flows.forEach((f) => {
        ipMap.set(f.sourceIp, (ipMap.get(f.sourceIp) ?? 0) + f.packets);
      });

      return Array.from(ipMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([name, packets]) => ({
          name,
          packets,
          blocked: blockedIps.has(name),
          color: "#a855f7",
        }));
    }

    /* Protocols */
    const blockedProtos = new Set(
      data.flows.filter((f) => f.blocked).map((f) => f.protocol),
    );

    const protoMap = new Map<string, number>();

    data.flows.forEach((f) => {
      protoMap.set(f.protocol, (protoMap.get(f.protocol) ?? 0) + f.packets);
    });

    return Array.from(protoMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, packets]) => ({
        name,
        packets,
        blocked: blockedProtos.has(name),
        color: protocolColor(name),
      }));
  }, [data, viewMode]);

  const hasData = data !== null;
  const totalPackets = data?.summary.totalPackets ?? 0;

  /* Compact layout */
  const compactChips = useMemo(() => chips.slice(0, MAX_COMPACT), [chips]);

  const remaining = Math.max(0, chips.length - MAX_COMPACT);

  const compactTotalH = compactChips.length * (CHIP_H + CHIP_GAP) - CHIP_GAP;

  const compactStartY = HUB_Y - compactTotalH / 2;

  /* Expanded layout */
  const expStep = CHIP_H + EXP_GAP;

  const expContentH = Math.max(0, chips.length * expStep - EXP_GAP);

  const expH = Math.max(EXP_MIN_H, expContentH + EXP_PAD_Y * 2);

  const expHubY = expH / 2;

  const expStartY = expHubY - expContentH / 2;

  const closeExpanded = useCallback(() => setIsExpanded(false), []);

  /* Escape + body scroll lock */
  useEffect(() => {
    if (!isExpanded) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeExpanded();
      }
    };

    const prevOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);

      document.body.style.overflow = prevOverflow;
    };
  }, [isExpanded, closeExpanded]);

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
                type="button"
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

          {/* Expand */}
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded-lg",
              isLight
                ? "text-gray-400 hover:bg-gray-100"
                : "text-muted hover:bg-white/5",
            )}
            aria-label="Expand traffic visualization"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* Compact visualization */}
      <div className="relative flex-1" style={{ minHeight: 300 }}>
        <DotGridBackground />

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-full"
          style={{ minHeight: 280 }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Hub → nodes */}
          {hasData &&
            compactChips.map((chip, i) => {
              const cy = compactStartY + i * (CHIP_H + CHIP_GAP) + CHIP_H / 2;

              const cp1x = HUB_X + (RIGHT_X - HUB_X) * 0.4;

              const cp2x = HUB_X + (RIGHT_X - HUB_X) * 0.7;

              const d = `M ${
                HUB_X + 40
              } ${HUB_Y} C ${cp1x} ${HUB_Y}, ${cp2x} ${cy}, ${
                RIGHT_X - 88
              } ${cy}`;

              return (
                <motion.path
                  key={`line-${chip.name}-${i}`}
                  d={d}
                  fill="none"
                  stroke={chip.blocked ? "#ef4444" : chip.color}
                  strokeWidth={1.5}
                  strokeOpacity={0.6}
                  strokeDasharray="4 3"
                  initial={{
                    pathLength: 0,
                    opacity: 0,
                  }}
                  animate={{
                    pathLength: 1,
                    opacity: 0.7,
                  }}
                  transition={{
                    duration: 0.8,
                    delay: i * 0.08,
                    ease: "easeOut",
                  }}
                />
              );
            })}

          {/* Source → hub */}
          <motion.line
            x1={LEFT_X + 70}
            y1={HUB_Y}
            x2={HUB_X - 40}
            y2={HUB_Y}
            stroke="#38bdf8"
            strokeWidth={2}
            strokeOpacity={0.5}
            strokeDasharray="6 4"
            initial={{
              pathLength: 0,
            }}
            animate={{
              pathLength: 1,
            }}
            transition={{
              duration: 0.7,
            }}
          />

          <SourceNode
            x={LEFT_X - 60}
            y={HUB_Y}
            isLight={isLight}
            hasData={hasData}
            totalPackets={totalPackets}
          />

          <Hub
            cx={HUB_X}
            cy={HUB_Y}
            isLight={isLight}
            glowEnabled={glowEnabled}
          />

          {/* Compact nodes */}
          {compactChips.map((chip, i) => (
            <motion.g
              key={`node-${chip.name}-${i}`}
              transform={`translate(${RIGHT_X - 88}, ${
                compactStartY + i * (CHIP_H + CHIP_GAP)
              })`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                delay: 0.3 + i * 0.07,
                duration: 0.4,
              }}
            >
              <NodeCard
                chip={chip}
                isLight={isLight}
                isDomain={viewMode === "Domains"}
              />
            </motion.g>
          ))}

          {/* Empty state */}
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

      {/* Footer */}
      <div className="flex items-center justify-between px-4 pb-3 flex-shrink-0">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent" />

            <span
              className={cn(
                "text-xs",
                isLight ? "text-gray-500" : "text-muted",
              )}
            >
              Allowed Traffic
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-danger" />

            <span
              className={cn(
                "text-xs",
                isLight ? "text-gray-500" : "text-muted",
              )}
            >
              Blocked Traffic
            </span>
          </div>
        </div>

        {remaining > 0 && (
          <span
            className={cn(
              "text-xs",
              isLight ? "text-gray-400" : "text-muted",
            )}
          >
            ••• +{remaining} more
          </span>
        )}
      </div>

      {/* Expanded modal */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 sm:p-6"
          onClick={closeExpanded}
          role="presentation"
        >
          <div
            className={cn(
              "relative w-full max-w-7xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden",
              isLight
                ? "bg-white border-gray-200"
                : "bg-navy-900 border-white/10",
            )}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Expanded network traffic visualization"
          >
            {/* Expanded header */}
            <div
              className={cn(
                "flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b flex-shrink-0",
                isLight ? "border-gray-200" : "border-white/10",
              )}
            >
              <div>
                <h3
                  className={cn(
                    "font-semibold text-base",
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
                  {viewMode} · {chips.length} items detected
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Expanded view modes */}
                <div
                  className={cn(
                    "flex rounded-lg p-0.5 text-xs",
                    isLight ? "bg-gray-100" : "bg-navy-800",
                  )}
                >
                  {VIEW_MODES.map((mode) => (
                    <button
                      key={`exp-${mode}`}
                      type="button"
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
                  type="button"
                  onClick={closeExpanded}
                  className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-lg text-lg",
                    isLight
                      ? "text-gray-500 hover:bg-gray-100"
                      : "text-muted hover:bg-white/10",
                  )}
                  aria-label="Close visualization"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Expanded visualization */}
            <div className="relative flex-1 overflow-auto p-4 sm:p-6">
              <DotGridBackground />

              <svg
                viewBox={`0 0 ${EXP_W} ${expH}`}
                className="w-full h-auto"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Source → hub */}
                <line
                  x1={EXP_LEFT_X + 70}
                  y1={expHubY}
                  x2={EXP_HUB_X - 48}
                  y2={expHubY}
                  stroke="#38bdf8"
                  strokeWidth={2}
                  strokeOpacity={0.5}
                  strokeDasharray="6 4"
                />

                {/* Hub → nodes */}
                {chips.map((chip, i) => {
                  const cy = expStartY + i * expStep + CHIP_H / 2;

                  const cp1x = EXP_HUB_X + (EXP_RIGHT_X - EXP_HUB_X) * 0.4;

                  const cp2x = EXP_HUB_X + (EXP_RIGHT_X - EXP_HUB_X) * 0.75;

                  const d = `M ${
                    EXP_HUB_X + 48
                  } ${expHubY} C ${cp1x} ${expHubY}, ${cp2x} ${cy}, ${
                    EXP_RIGHT_X - 88
                  } ${cy}`;

                  return (
                    <path
                      key={`exp-line-${chip.name}-${i}`}
                      d={d}
                      fill="none"
                      stroke={chip.blocked ? "#ef4444" : chip.color}
                      strokeWidth={1.5}
                      strokeOpacity={0.65}
                      strokeDasharray="4 3"
                    />
                  );
                })}

                <SourceNode
                  x={EXP_LEFT_X - 70}
                  y={expHubY}
                  isLight={isLight}
                  hasData={hasData}
                  totalPackets={totalPackets}
                />

                <Hub
                  cx={EXP_HUB_X}
                  cy={expHubY}
                  isLight={isLight}
                  glowEnabled={glowEnabled}
                  r={48}
                />

                {/* All expanded nodes */}
                {chips.map((chip, i) => (
                  <g
                    key={`exp-node-${chip.name}-${i}`}
                    transform={`translate(${EXP_RIGHT_X - 88}, ${
                      expStartY + i * expStep
                    })`}
                  >
                    <NodeCard
                      chip={chip}
                      isLight={isLight}
                      isDomain={viewMode === "Domains"}
                    />
                  </g>
                ))}

                {!hasData && (
                  <text
                    x={EXP_W / 2}
                    y={expHubY + 120}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="14"
                  >
                    Upload a PCAP file to visualize traffic
                  </text>
                )}
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
