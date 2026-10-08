import { useRef, useState } from 'react';
import { useDomains } from '../../shared/domainContext/useDomains';

export const useDomainStar = (domainId: string, disabled = false) => {
  const { domains, loading, toggleDomainStar } = useDomains();
  const domain = domains.find(record => record.id === domainId);
  const pendingRef = useRef(false);
  const [error, setError] = useState(``);
  const [pending, setPending] = useState(false);
  const [optimisticStar, setOptimisticStar] = useState<boolean | null>(null);
  const starred = optimisticStar ?? (domain?.starred === true);
  const unavailable = disabled || loading || pending || !domain;

  const toggle = async (): Promise<string> => {
    if (unavailable || pendingRef.current || !domain) return ``;
    pendingRef.current = true;
    setPending(true);
    setError(``);
    setOptimisticStar(!starred);
    try {
      await toggleDomainStar(domainId);
      return ``;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : `Unable To Update Domain Star`;
      setError(message);
      return message;
    } finally {
      pendingRef.current = false;
      setPending(false);
      setOptimisticStar(null);
    }
  };

  return { error, toggle, starred, disabled: unavailable };
};
