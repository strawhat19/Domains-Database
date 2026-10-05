import { useId, useEffect, useState } from 'react';

export interface DomainAnalyticsButtonProps {
  domain: string;
  suffix?: string;
  compact?: boolean;
}

export const useDomainAnalyticsButton = (domain: string, suffix?: string) => {
  const instance = useId().replace(/[^a-z0-9_-]/gi, `-`);
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [domain]);
  return {
    open,
    show: () => setOpen(true),
    close: () => setOpen(false),
    scope: `${suffix ?? domain.replace(/[^a-z0-9-]/gi, `-`)}-${instance}`,
  };
};
