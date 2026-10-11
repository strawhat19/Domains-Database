import type { DomainRecord } from '../../shared/types';
import { useCallback, useSyncExternalStore } from 'react';

export interface DomainNewBadgeProps {
  id: string;
  compact?: boolean;
  domain: Pick<DomainRecord, `expiresAt` | `isSample`>;
}

const NEW_DOMAIN_DAYS = 5;
const NEW_DOMAIN_DURATION = NEW_DOMAIN_DAYS * 24 * 60 * 60 * 1000;
const subscriptions = new Map<() => void, number>();
let expiryTimer: ReturnType<typeof setTimeout> | undefined;

const scheduleExpiry = () => {
  if (expiryTimer !== undefined) clearTimeout(expiryTimer);
  expiryTimer = undefined;
  if (!subscriptions.size) return;
  let nextExpiry = Infinity;
  subscriptions.forEach(expiresAt => { nextExpiry = Math.min(nextExpiry, expiresAt); });
  expiryTimer = setTimeout(() => {
    expiryTimer = undefined;
    const expired = [...subscriptions].filter(([, expiresAt]) => expiresAt <= Date.now());
    expired.forEach(([listener]) => subscriptions.delete(listener));
    scheduleExpiry();
    expired.forEach(([listener]) => listener());
  }, Math.max(1, nextExpiry - Date.now()));
};

const subscribeExpiry = (expiresAt: number, listener: () => void) => {
  if (expiresAt <= Date.now()) return () => undefined;
  subscriptions.set(listener, expiresAt);
  scheduleExpiry();
  return () => {
    subscriptions.delete(listener);
    scheduleExpiry();
  };
};

const getExpiry = ({ expiresAt, isSample }: DomainNewBadgeProps[`domain`]) => {
  if (isSample || typeof expiresAt !== `string` || !expiresAt.trim()) return 0;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(expiresAt);
  const renewalDate = new Date(dateOnly ? `${expiresAt}T00:00:00` : expiresAt);
  const renewalAt = renewalDate.getTime();
  if (!Number.isFinite(renewalAt) || renewalAt > Date.now()) return 0;
  if (!dateOnly) return renewalAt + NEW_DOMAIN_DURATION;
  const [year, month, day] = expiresAt.split(`-`).map(Number);
  if (renewalDate.getFullYear() !== year || renewalDate.getMonth() !== month - 1 || renewalDate.getDate() !== day) return 0;
  renewalDate.setDate(renewalDate.getDate() + NEW_DOMAIN_DAYS);
  return renewalDate.getTime();
};

const getServerSnapshot = () => false;

export const useDomainNewBadge = (domain: DomainNewBadgeProps[`domain`]) => {
  const expiresAt = getExpiry(domain);
  const subscribe = useCallback((listener: () => void) => subscribeExpiry(expiresAt, listener), [expiresAt]);
  const getSnapshot = useCallback(() => expiresAt > Date.now(), [expiresAt]);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};
