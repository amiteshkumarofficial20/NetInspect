import { useRef, useState } from "react";
import {
  Activity,
  Search,
  Upload,
  Bell,
  Sun,
  Moon,
  X,
  User,
} from "lucide-react";
import type { EngineStatus } from "../../types";
import { cn } from "../../lib/utils";

interface TopbarProps {
  engineStatus: EngineStatus;
  search: string;
  onSearchChange: (value: string) => void;
  onAnalyze: (file: File, blockApp?: string) => void;
  isLoading: boolean;
  isLight: boolean;
  onToggleTheme: () => void;
  selectedFile: string | null;
  onClearFile: () => void;
}

const ENGINE_STATUS_CONFIG = {
  checking: {
    dot: "bg-warn animate-pulse",
    label: "Checking...",
    sub: "C++ DPI Engine",
    textColor: "text-warn",
  },
  online: {
    dot: "bg-success animate-pulse-dot",
    label: "Engine Online",
    sub: "C++ DPI Engine",
    textColor: "text-success",
  },
  offline: {
    dot: "bg-danger",
    label: "Engine Offline",
    sub: "Not reachable",
    textColor: "text-danger",
  },
} as const;

export function Topbar({
  engineStatus,
  search,
  onSearchChange,
  onAnalyze,
  isLoading,
  isLight,
  onToggleTheme,
  selectedFile,
  onClearFile,
}: TopbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [blockApp, setBlockApp] = useState("None");
  const cfg = ENGINE_STATUS_CONFIG[engineStatus];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAnalyze(file, blockApp);
      // Reset so same file can be re-selected
      e.target.value = "";
    }
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 h-16 z-40 flex items-center px-4 gap-4",
        "border-b border-white/5",
        isLight ? "bg-white border-gray-200" : "bg-navy-800",
      )}
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-2.5 w-60 flex-shrink-0">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
            "bg-accent/20 shadow-glow-cyan",
          )}
        >
          <Activity size={18} className="text-accent-light" />
        </div>
        <div className="leading-tight">
          <div
            className={cn(
              "font-bold text-sm",
              isLight ? "text-gray-900" : "text-white",
            )}
          >
            NetInspect
          </div>
          <div
            className={cn(
              "text-[9px] leading-tight",
              isLight ? "text-gray-400" : "text-muted",
            )}
          >
            Deep Packet Inspection &amp; Network Intelligence
          </div>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="flex-1 relative">
        <Search
          size={14}
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2",
            isLight ? "text-gray-400" : "text-muted",
          )}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search applications, domains, IPs, or flows..."
          className={cn(
            "w-full h-9 pl-9 pr-4 rounded-xl text-sm transition-colors",
            "outline-none focus:ring-1 focus:ring-accent/50",
            isLight
              ? "bg-gray-100 text-gray-900 placeholder:text-gray-400 focus:bg-white border border-gray-200"
              : "bg-navy-750 text-white placeholder:text-muted/60 focus:bg-navy-700 border border-white/5",
          )}
        />
      </div>

      {/* ── Selected file chip ── */}
      {selectedFile && (
        <div
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border flex-shrink-0",
            isLight
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-accent/10 text-accent-light border-accent/25",
          )}
        >
          <span className="max-w-[120px] truncate">
            Selected: {selectedFile}
          </span>
          <button
            onClick={onClearFile}
            className="hover:opacity-70 transition-opacity"
            aria-label="Clear selected file"
          >
            <X size={11} />
          </button>
        </div>
      )}

      {/* ── Engine Status ── */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="relative flex-shrink-0">
          <span className={cn("block w-2 h-2 rounded-full", cfg.dot)} />
          {engineStatus === "online" && (
            <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-60" />
          )}
        </div>
        <div className="leading-tight">
          <div className={cn("text-xs font-semibold", cfg.textColor)}>
            {cfg.label}
          </div>
          <div
            className={cn(
              "text-[9px]",
              isLight ? "text-gray-400" : "text-muted",
            )}
          >
            {cfg.sub}
          </div>
        </div>
      </div>
      {/* ── Block App Selector ── */}
      <select
        value={blockApp}
        onChange={(e) => setBlockApp(e.target.value)}
        disabled={isLoading}
        className={cn(
          "h-9 px-3 rounded-xl text-xs font-medium border outline-none",
          "focus:ring-1 focus:ring-accent/50",
          isLight
            ? "bg-white text-gray-700 border-gray-200"
            : "bg-navy-750 text-white border-white/5",
        )}
        aria-label="Block application"
      >
        <option value="None">Block App: None</option>
        <option value="YouTube">YouTube</option>
        <option value="Facebook">Facebook</option>
        <option value="Instagram">Instagram</option>
        <option value="Twitter/X">Twitter/X</option>
        <option value="Discord">Discord</option>
        <option value="Telegram">Telegram</option>
        <option value="TikTok">TikTok</option>
        <option value="Spotify">Spotify</option>
      </select>
      {/* ── Analyze PCAP Button ── */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold flex-shrink-0",
          "bg-accent hover:bg-accent-dark transition-colors",
          "text-white shadow-sm",
          isLoading && "opacity-60 cursor-not-allowed",
        )}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Analyzing...</span>
          </>
        ) : (
          <>
            <Upload size={14} />
            <span>Analyze PCAP</span>
          </>
        )}
      </button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pcap,.pcapng,.cap"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ── Right icons ── */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Bell */}
        <button
          className={cn(
            "w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
            isLight
              ? "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              : "text-muted hover:bg-white/5 hover:text-white",
          )}
          aria-label="Notifications"
        >
          <Bell size={16} />
        </button>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className={cn(
            "w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
            isLight
              ? "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              : "text-muted hover:bg-white/5 hover:text-white",
          )}
          aria-label="Toggle theme"
        >
          {isLight ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        {/* Avatar */}
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center ml-1",
            "bg-accent/20 text-accent-light border border-accent/30",
          )}
        >
          <User size={14} />
        </div>
      </div>
    </header>
  );
}
