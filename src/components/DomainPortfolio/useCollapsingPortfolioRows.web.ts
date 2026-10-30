import { useEffect, useMemo, useState } from 'react';

export const useCollapsingPortfolioRows = (visibleIds: Set<string>, collapsedIds: Set<string>) => {
  const [retainedIds, setRetainedIds] = useState(visibleIds);
  useEffect(() => {
    if (window.matchMedia(`(prefers-reduced-motion: reduce)`).matches) {
      setRetainedIds(visibleIds);
      return;
    }
    const timeout = window.setTimeout(() => setRetainedIds(visibleIds), 240);
    return () => window.clearTimeout(timeout);
  }, [visibleIds]);
  return useMemo(() => new Set([
    ...visibleIds,
    ...[...retainedIds].filter(id => collapsedIds.has(id)),
  ]), [visibleIds, retainedIds, collapsedIds]);
};
