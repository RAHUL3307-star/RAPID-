import { useState, useEffect } from 'react';

/**
 * Returns true when the screen is mobile or in portrait mode (<= 900px or portrait orientation).
 */
export function useIsMobile(breakpoint = 900): boolean {
  const checkIsMobile = () => {
    if (typeof window === 'undefined') return false;
    return (
      window.innerWidth <= breakpoint ||
      window.matchMedia('(orientation: portrait) and (max-width: 1024px)').matches
    );
  };

  const [isMobile, setIsMobile] = useState(checkIsMobile);

  useEffect(() => {
    const handleResize = () => setIsMobile(checkIsMobile());
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const mqPortrait = window.matchMedia('(orientation: portrait)');

    mq.addEventListener?.('change', handleResize);
    mqPortrait.addEventListener?.('change', handleResize);

    setIsMobile(checkIsMobile());

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      mq.removeEventListener?.('change', handleResize);
      mqPortrait.removeEventListener?.('change', handleResize);
    };
  }, [breakpoint]);

  return isMobile;
}
