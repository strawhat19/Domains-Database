import { useMemo, useState } from 'react';
import { getAdminSummary } from '../AdminDashboard/data';
import { getDomainStatus } from '../../shared/domainUtils';
import type { AdminSnapshot } from '../../shared/admin/types';

export const domainStatusOptions = [`All`, `Active`, `Renewing Soon`, `Expired`, `Unknown`];

export const formatAnnualPrice = (amount: number, currency = `USD`) => {
  if (!Number.isFinite(amount)) return `—`;
  try { return new Intl.NumberFormat(undefined, { currency, style: `currency` }).format(amount); }
  catch { return `${currency} ${amount.toFixed(2)}`; }
};

export const useAdminDomains = (snapshot: AdminSnapshot | null) => {
  const [search, setSearch] = useState(``);
  const [status, setStatus] = useState(`All`);
  const summary = useMemo(() => snapshot ? getAdminSummary(snapshot) : null, [snapshot]);
  const accountNames = useMemo(() => new Map(snapshot?.users.map(account => [account.id, account.name]) ?? []), [snapshot?.users]);
  const filter = search.trim().toLocaleLowerCase();
  const domains = snapshot?.domains.filter(domain => (status === `All` || getDomainStatus(domain) === status) && `${domain.number} ${domain.name} ${domain.owner} ${domain.registrar} ${accountNames.get(domain.uid) ?? ``}`.toLocaleLowerCase().includes(filter)).sort((first, second) => first.number - second.number) ?? [];
  return { search, status, filter, domains, summary, accountNames, setSearch, setStatus };
};
