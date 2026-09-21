import { useState, useCallback } from "react";
import type { AnalysisResult, AnalysisStatus } from "../types";
import { analyzePcap, analyzeNewTraffic, formatDateTime } from "../lib/api";

export interface AnalysisState {
  status: AnalysisStatus;
  data: AnalysisResult | null;
  error: string | null;
  /** Time the analysis completed — used as "Time" for all flow rows */
  analysisTime: Date | null;
  /** Name of the last analyzed file */
  fileName: string | null;
}

export interface UseAnalysisReturn extends AnalysisState {
  analyze: (file: File, blockApp?: string) => Promise<void>;
  analyzeNewTraffic: (blockApp?: string) => Promise<void>;
  reset: () => void;
  formattedAnalysisTime: string | null;
}

const INITIAL_STATE: AnalysisState = {
  status: "idle",
  data: null,
  error: null,
  analysisTime: null,
  fileName: null,
};

export function useAnalysis(): UseAnalysisReturn {
  const [state, setState] = useState<AnalysisState>(INITIAL_STATE);

  // ── Shared success/error handlers ──────────────────────────────────────────

  const handleSuccess = (result: AnalysisResult, fileName: string) => {
    setState({
      status: "success",
      data: result,
      error: null,
      analysisTime: new Date(),
      fileName,
    });
  };

  const handleError = (err: unknown) => {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    setState((prev) => ({ ...prev, status: "error", error: message }));
  };

  // ── analyze: existing PCAP file upload flow ────────────────────────────────

  const analyze = useCallback(async (file: File, blockApp?: string) => {
    setState((prev) => ({ ...prev, status: "loading", error: null, fileName: file.name }));
    try {
      handleSuccess(await analyzePcap(file, blockApp), file.name);
    } catch (err) {
      handleError(err);
    }
  }, []);

  // ── analyzeNewTraffic: no file picker, generates PCAP on server ────────────

  const analyzeNewTrafficFn = useCallback(async (blockApp?: string) => {
    setState((prev) => ({
      ...prev,
      status: "loading",
      error: null,
      fileName: "Generated Traffic",
    }));
    try {
      handleSuccess(await analyzeNewTraffic(blockApp), "Generated Traffic");
    } catch (err) {
      handleError(err);
    }
  }, []);

  // ── reset ──────────────────────────────────────────────────────────────────

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  const formattedAnalysisTime = state.analysisTime
    ? formatDateTime(state.analysisTime)
    : null;

  return {
    ...state,
    analyze,
    analyzeNewTraffic: analyzeNewTrafficFn,
    reset,
    formattedAnalysisTime,
  };
}
