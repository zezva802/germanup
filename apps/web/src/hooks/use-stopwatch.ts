import { useEffect, useState } from 'react';

/**
 * Elapsed-time stopwatch for challenge HUDs.
 * Counts up (ms) while `active` is true; restarts from 0 whenever `resetKey`
 * changes. Ticks a few times per second — enough for a smooth mm:ss readout.
 */
export function useStopwatch(active: boolean, resetKey?: unknown): number {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) return;
    const start = Date.now();
    setElapsed(0);
    const id = window.setInterval(() => setElapsed(Date.now() - start), 200);
    return () => window.clearInterval(id);
  }, [active, resetKey]);

  return elapsed;
}
