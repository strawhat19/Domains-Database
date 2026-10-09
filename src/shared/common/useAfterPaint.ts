import { useEffect, useState } from 'react';

export const useAfterPaint = (enabled = true) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    if (!enabled) return;
    let cancelled = false;
    let frame: number | undefined;
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const browser = typeof window === `undefined` ? undefined : window;
    const finish = () => {
      if (!cancelled) setReady(true);
    };
    const defer = () => {
      if (cancelled) return;
      clearTimeout(timer);
      if (frame !== undefined) cancelAnimationFrame(frame);
      if (browser?.requestIdleCallback) idle = browser.requestIdleCallback(finish, { timeout: 250 });
      else timer = setTimeout(finish, 0);
    };

    // Keep storage work behind a painted frame, with a fallback for hidden tabs.
    timer = setTimeout(defer, 100);
    if (typeof requestAnimationFrame === `function`) {
      frame = requestAnimationFrame(() => { frame = requestAnimationFrame(defer); });
    }
    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (frame !== undefined) cancelAnimationFrame(frame);
      if (idle !== undefined) browser?.cancelIdleCallback?.(idle);
    };
  }, [enabled]);

  return enabled && ready;
};
