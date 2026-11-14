import { Platform } from 'react-native';
import { absoluteSiteUrl } from '../seo';
import type { DomainRecord } from '../types';
import { useAuth } from '../authContext/useAuth';
import { getFirebaseAuth } from '../firebase/client';
import { useEffect, useRef, useState } from 'react';
import { useConnectionAvailability } from '../connections/useConnectionAvailability';
import { DOMAIN_DNS_LIMIT_PER_TYPE, DOMAIN_DNS_SOURCE, DOMAIN_DNS_TYPES, type DomainDnsSnapshot } from '../domainDns/types';

const initial = { scope: ``, loading: false, error: ``, result: null as DomainDnsSnapshot | null };

const readResult = (value: unknown, domain: string): DomainDnsSnapshot => {
  const result = value as Partial<DomainDnsSnapshot> | null;
  if (!result || result.source !== DOMAIN_DNS_SOURCE || result.domain !== domain || typeof result.checkedAt !== `string`
    || !Number.isFinite(Date.parse(result.checkedAt)) || !Array.isArray(result.records)
    || result.records.length > DOMAIN_DNS_LIMIT_PER_TYPE * DOMAIN_DNS_TYPES.length
    || result.records.some(row => !DOMAIN_DNS_TYPES.includes(row?.type) || typeof row.name !== `string` || row.name.length > 253
      || typeof row.value !== `string` || row.value.length > 253 || !Number.isSafeInteger(row.ttl) || row.ttl < 0
      || (row.priority !== undefined && (!Number.isSafeInteger(row.priority) || row.priority < 0)))
    || !Array.isArray(result.coverage) || result.coverage.length !== DOMAIN_DNS_TYPES.length
    || new Set(result.coverage.map(item => item?.type)).size !== DOMAIN_DNS_TYPES.length
    || result.coverage.some(item => !DOMAIN_DNS_TYPES.includes(item?.type) || ![`complete`, `truncated`, `unavailable`].includes(item.status))) {
    throw new Error(`Could Not Read GoDaddy DNS Results`);
  }
  return result as DomainDnsSnapshot;
};

export const useGoDaddyDns = (domain: DomainRecord) => {
  const { user, loading, loginRevision } = useAuth();
  const { revision, hasGoDaddyConnection } = useConnectionAvailability();
  const connectionId = domain.meta?.registrarConnectionId;
  const available = !loading && hasGoDaddyConnection && user?.active === true && !user.anonymous && domain.uid === user.id
    && !domain.isSample && domain.registrar === `GoDaddy` && domain.meta?.registrarProvider === `godaddy`
    && domain.meta?.domainSource === `registrar` && domain.meta?.externalRegistration !== true
    && /^[1-9]\d{0,15}$/.test(domain.providerId ?? ``) && typeof connectionId === `string` && !!connectionId;
  const scope = available ? JSON.stringify([domain.uid, loginRevision, revision, domain.id, domain.name, domain.providerId, connectionId]) : ``;
  const current = useRef(scope);
  const pending = useRef<AbortController | null>(null);
  const [state, setState] = useState(initial);
  current.current = scope;

  useEffect(() => () => { pending.current?.abort(); pending.current = null; }, [scope]);

  const check = async () => {
    if (!scope || current.current !== scope || pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    const ownsRequest = () => current.current === scope && pending.current === controller;
    const timeout = setTimeout(() => controller.abort(), 45_000);
    setState(previous => ({ ...(previous.scope === scope ? previous : initial), scope, loading: true, error: `` }));
    try {
      const auth = getFirebaseAuth();
      const actor = auth.currentUser;
      if (!actor || actor.isAnonymous) throw new Error(`Sign In To Check GoDaddy DNS`);
      const token = await actor.getIdToken();
      if (!ownsRequest() || auth.currentUser !== actor) return;
      if (controller.signal.aborted) throw new Error(`GoDaddy DNS Check Timed Out`);
      const path = `/api/domain-dns`;
      const response = await fetch(Platform.OS === `web` ? path : absoluteSiteUrl(path), {
        method: `POST`, cache: `no-store`, redirect: `error`, credentials: `omit`, signal: controller.signal,
        body: JSON.stringify({ domainId: domain.id }),
        headers: { Accept: `application/json`, 'Content-Type': `application/json`, Authorization: `Bearer ${token}` },
      });
      const value: unknown = await response.json().catch(() => null);
      if (!ownsRequest() || auth.currentUser !== actor) return;
      if (!response.ok) {
        const error = (value as { error?: unknown } | null)?.error;
        throw new Error(typeof error === `string` && error.length <= 240 ? error : `Could Not Load GoDaddy DNS`);
      }
      const result = readResult(value, domain.name);
      setState({ scope, error: ``, loading: false, result });
    } catch (failure) {
      if (ownsRequest()) setState(previous => ({ ...previous, error: controller.signal.aborted ? `GoDaddy DNS Check Timed Out`
        : failure instanceof Error && !(failure instanceof TypeError) ? failure.message : `Could Not Reach GoDaddy DNS` }));
    } finally {
      clearTimeout(timeout);
      if (ownsRequest()) { pending.current = null; setState(previous => ({ ...previous, loading: false })); }
    }
  };

  return { ...(state.scope === scope ? state : initial), available, check };
};

export const getDnsDetailLabels = (snapshot: DomainDnsSnapshot) => [
  { id: `checked`, label: `Checked ${new Date(snapshot.checkedAt).toLocaleString()}` },
  ...snapshot.coverage.flatMap(({ type, status }) => {
    const records = snapshot.records.filter(record => record.type === type);
    const rows = records.map((record, index) => ({ id: `${type}-${index}`,
      label: `${type} ${record.name} → ${record.value} · TTL ${record.ttl}s${record.priority === undefined ? `` : ` · Priority ${record.priority}`}` }));
    if (status === `unavailable`) return [{ id: `${type}-coverage`, label: `${type} Records Unavailable` }];
    if (status === `truncated`) return [...rows, { id: `${type}-coverage`, label: `Showing The First ${records.length} ${type} Records` }];
    return rows.length ? rows : [{ id: `${type}-coverage`, label: `No ${type} Records` }];
  }),
];
