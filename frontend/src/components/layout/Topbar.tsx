import { Activity, Sun, Moon } from "lucide-react";
import { cn } from "../../lib/utils";

interface TopbarProps {
  isLight: boolean;
  onToggleTheme: () => void;
}

export function Topbar({ isLight, onToggleTheme }: TopbarProps) {
  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 h-16 z-40 flex items-center justify-between px-4 gap-4",
        "border-b border-white/5",
        isLight ? "bg-white border-gray-200" : "bg-navy-800"
      )}
    >
      {/* ── NetInspect Logo + Branding ── */}
      <div className="flex items-center gap-2.5 w-60 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-accent/20 shadow-glow-cyan">
          <Activity size={18} className="text-accent-light" />
        </div>
        <div className="leading-tight">
          <div className={cn("font-bold text-sm", isLight ? "text-gray-900" : "text-white")}>
            NetInspect
          </div>
          <div className={cn("text-[9px] leading-tight", isLight ? "text-gray-400" : "text-muted")}>
            Deep Packet Inspection &amp; Network Intelligence
          </div>
        </div>
      </div>

      {/* ── Network Intelligence Dashboard heading + subtitle ── */}
      <div className="flex-1 min-w-0">
        <h1 className={cn("text-lg font-bold leading-tight truncate", isLight ? "text-gray-900" : "text-white")}>
          Network Intelligence Dashboard
        </h1>
        <p className={cn("text-xs leading-tight truncate mt-0.5", isLight ? "text-gray-500" : "text-muted")}>
          Real traffic. Real analysis. Complete visibility.
        </p>
      </div>

      {/* ── Light/Dark Toggle at FAR RIGHT ── */}
      <button
        onClick={onToggleTheme}
        className={cn(
          "w-8 h-8 flex items-center justify-center rounded-lg transition-colors flex-shrink-0",
          isLight
            ? "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            : "text-muted hover:bg-white/5 hover:text-white"
        )}
        aria-label="Toggle theme"
      >
        {isLight ? <Moon size={16} /> : <Sun size={16} />}
      </button>
    </header>
  );
}
