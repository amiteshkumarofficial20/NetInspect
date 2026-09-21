import { Activity } from "lucide-react";
import { cn } from "../../lib/utils";

interface TopbarProps {
  isLight: boolean;
}

export function Topbar({ isLight }: TopbarProps) {
  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 h-16 z-40 flex items-center px-4",
        "border-b border-white/5",
        isLight ? "bg-white border-gray-200" : "bg-navy-800"
      )}
    >
      {/* ── Logo only ── */}
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
    </header>
  );
}
