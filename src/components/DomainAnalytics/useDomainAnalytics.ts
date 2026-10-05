import { Linking } from 'react-native';
import { useId, useEffect, useState } from 'react';
import { getDomainAnalytics } from '../../shared/domainAnalytics/client';
import type { DomainAnalyticsSnapshot } from '../../shared/domainAnalytics/types';

export interface DomainAnalyticsProps {
  domain: string;
  suffix?: string;
  onClose: () => void;
}

export const formatAnalyticsDate = (value?: string) => {
  if (!value) return `Not Available`;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? `Not Available` : date.toLocaleDateString();
};

export const useDomainAnalytics = (domain: string, suffix?: string) => {
  const instance = useId().replace(/[^a-z0-9_-]/gi, `-`);
  const [error, setError] = useState(``);
  const [loading, setLoading] = useState(true);
  const [linkError, setLinkError] = useState(``);
  const [request, setRequest] = useState(0);
  const [snapshot, setSnapshot] = useState<DomainAnalyticsSnapshot | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setError(``);
    setLinkError(``);
    setLoading(true);
    setSnapshot(null);
    void getDomainAnalytics(domain, controller.signal).then(result => {
      if (!controller.signal.aborted) setSnapshot(result);
    }).catch(caught => {
      if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : `Unable To Load Domain Analytics`);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [domain, request]);

  const openLink = async (url: string) => {
    setLinkError(``);
    if (!/^https?:\/\//i.test(url)) { setLinkError(`Research Link Is Unavailable`); return; }
    try {
      await Linking.openURL(url);
    } catch {
      setLinkError(`Unable To Open Research Link`);
    }
  };

  const registrationLabel = snapshot?.registration.status === `registered` ? `Registered`
    : snapshot?.registration.status === `unregistered` ? `No Registration Found` : `Unknown`;
  const registrationTone = snapshot?.registration.status === `registered` ? `registered`
    : snapshot?.registration.status === `unregistered` ? `unregistered` : `unknown`;
  const metrics = snapshot ? [
    { key: `length`, label: `Name Length`, value: `${snapshot.name.length} Characters` },
    { key: `extension`, label: `Extension`, value: snapshot.name.extension || `Not Available` },
    { key: `digits`, label: `Contains Digits`, value: snapshot.name.hasDigits ? `Yes` : `No` },
    { key: `hyphens`, label: `Contains Hyphens`, value: snapshot.name.hasHyphens ? `Yes` : `No` },
  ] : [];
  const registrationFields = snapshot ? [
    { key: `registrar`, label: `Registrar`, value: snapshot.registration.registrar ?? `Not Available` },
    { key: `created`, label: `Created`, value: formatAnalyticsDate(snapshot.registration.createdAt) },
    { key: `expires`, label: `Expires`, value: formatAnalyticsDate(snapshot.registration.expiresAt) },
  ] : [];
  const inventoryTimestamp = snapshot?.inventory?.sourceCheckedAt
    ? `Source Date: ${formatAnalyticsDate(snapshot.inventory.sourceCheckedAt)}${snapshot.inventory.importedAt ? ` · Imported ${formatAnalyticsDate(snapshot.inventory.importedAt)}` : ``}`
    : snapshot?.inventory?.importedAt ? `Imported ${formatAnalyticsDate(snapshot.inventory.importedAt)}` : `Source Date Not Provided`;

  return {
    error, loading, metrics, snapshot, linkError, openLink, inventoryTimestamp, registrationTone, registrationLabel, registrationFields,
    refresh: () => setRequest(previous => previous + 1),
    retry: Boolean(error || snapshot?.errors?.length || snapshot?.registration.error || snapshot?.dns.error),
    scope: `${suffix ?? domain.replace(/[^a-z0-9-]/gi, `-`)}-${instance}`,
    researchLinks: snapshot?.links?.filter(link => /^https?:\/\//i.test(link.url)) ?? [],
  };
};
