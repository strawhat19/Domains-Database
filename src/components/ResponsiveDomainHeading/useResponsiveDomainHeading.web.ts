import { useRef, useState, useEffect, useLayoutEffect } from 'react';

const useBrowserLayoutEffect = typeof window === `undefined` ? useEffect : useLayoutEffect;

export const useResponsiveDomainHeading = (fullText: string, forceCompact = false) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLSpanElement | null>(null);
  const [needsShortText, setNeedsShortText] = useState(false);

  useBrowserLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const probe = measureRef.current;
    if (!wrapper || !probe) return;
    let active = true;
    const measure = () => {
      if (active) setNeedsShortText(probe.getBoundingClientRect().width > wrapper.getBoundingClientRect().width);
    };
    const observer = typeof ResizeObserver === `undefined` ? null : new ResizeObserver(measure);
    observer?.observe(probe);
    observer?.observe(wrapper);
    window.addEventListener(`resize`, measure);
    document.fonts?.addEventListener(`loadingdone`, measure);
    void document.fonts?.ready.then(measure);
    measure();
    return () => {
      active = false;
      observer?.disconnect();
      window.removeEventListener(`resize`, measure);
      document.fonts?.removeEventListener(`loadingdone`, measure);
    };
  }, [fullText]);

  return { measureRef, wrapperRef, compact: forceCompact || needsShortText };
};
