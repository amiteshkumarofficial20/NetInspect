import { useState, useCallback } from 'react';
import type { AnalysisResult, AnalysisStatus } from '../types';
import { analyzePcap, formatDateTime } from '../lib/api';

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
  analyze: (file: File) => Promise<void>;
  reset: () => void;
  formattedAnalysisTime: string | null;
}

const INITIAL_STATE: AnalysisState = {
  status: 'idle',
  data: null,
  error: null,
  analysisTime: null,
  fileName: null,
};

/**
 * Manages the full PCAP analysis lifecycle:
 *   idle → loading → success | error
 *
 * On success, stores the normalized AnalysisResult and the wall-clock
 * time of response arrival (used as a per-session "Time" for all flows,
 * since the engine does not emit per-packet timestamps).
 */
export function useAnalysis(): UseAnalysisReturn {
  const [state, setState] = useState<AnalysisState>(INITIAL_STATE);

  const analyze = useCallback(async (file: File) => {
    setState((prev) => ({
      ...prev,
      status: 'loading',
      error: null,
      fileName: file.name,
    }));

    try {
      const result = await analyzePcap(file);
      setState({
        status: 'success',
        data: result,
        error: null,
        analysisTime: new Date(),
        fileName: file.name,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: message,
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const formattedAnalysisTime = state.analysisTime
    ? formatDateTime(state.analysisTime)
    : null;

  return {
    ...state,
    analyze,
    reset,
    formattedAnalysisTime,
  };
}
