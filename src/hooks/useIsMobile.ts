import { useState, useEffect } from 'react';

/**
 * Returns true when the viewport width is ≤ the given breakpoint (default 600px).
 * Used to apply responsive inline-style overrides in TSX components.
 */
export function useIsMobile(breakpoint = 600): boolean {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= breakpoint);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);

  return isMobile;
}
