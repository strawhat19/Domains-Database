import { useRef, useEffect, useState } from 'react';
import type { RecentDomainSearchesProps } from './types';

export const useRecentSearchesLayout = ({ error, records, loading, inline, maxHeight }: RecentDomainSearchesProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const warningRef = useRef<HTMLParagraphElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [warningHeight, setWarningHeight] = useState(0);
  const [edges, setEdges] = useState({ left: false, right: false });
  const boundedHeight = inline && typeof maxHeight === `number` && Number.isFinite(maxHeight) && maxHeight > 0
    ? maxHeight
    : undefined;
  const bodyHeight = boundedHeight === undefined ? 36 : boundedHeight - 52 - (error ? warningHeight + 10 : 0);
  const itemCount = loading ? 3 : records.length;
  const rowCount = Math.max(1, Math.min(itemCount || 1, Math.floor(bodyHeight / 36)));

  useEffect(() => {
    const track = trackRef.current;
    const warning = warningRef.current;
    const viewport = viewportRef.current;
    if (!inline || !viewport || !track) {
      setEdges(current => current.left || current.right ? { left: false, right: false } : current);
      return;
    }
    const measure = () => {
      const left = viewport.scrollLeft > 1;
      const right = viewport.scrollWidth - viewport.clientWidth - viewport.scrollLeft > 1;
      setEdges(current => current.left === left && current.right === right ? current : { left, right });
      setWarningHeight(warning?.getBoundingClientRect().height ?? 0);
    };
    const observer = typeof ResizeObserver === `undefined` ? null : new ResizeObserver(measure);
    observer?.observe(track);
    observer?.observe(viewport);
    if (warning) observer?.observe(warning);
    viewport.addEventListener(`scroll`, measure, { passive: true });
    window.addEventListener(`resize`, measure);
    measure();
    return () => {
      observer?.disconnect();
      viewport.removeEventListener(`scroll`, measure);
      window.removeEventListener(`resize`, measure);
    };
  }, [error, inline, records, loading, rowCount, maxHeight]);

  return { edges, rowCount, trackRef, warningRef, viewportRef, boundedHeight, bodyHeight: Math.max(0, bodyHeight) };
};
