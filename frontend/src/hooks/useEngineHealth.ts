import { useState, useEffect, useRef, useCallback } from 'react';
import type { EngineStatus } from '../types';
import { checkHealth } from '../lib/api';

const POLL_INTERVAL_MS = 5000;

/**
 * Polls GET /api/health every 5 seconds and reports engine status.
 *
 * States:
 *  - 'checking' — initial state, first poll not yet resolved
 *  - 'online'   — last poll returned { status: "ok" }
 *  - 'offline'  — last poll failed (network error, timeout, non-200, or wrong status)
 */
export function useEngineHealth(): EngineStatus {
  const [status, setStatus] = useState<EngineStatus>('checking');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    const ok = await checkHealth();
    setStatus(ok ? 'online' : 'offline');
  }, []);

  useEffect(() => {
    // First check fires immediately
    poll();

    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [poll]);

  return status;
}
