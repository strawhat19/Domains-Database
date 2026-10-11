import type { ChartPoint } from '../AdminCharts/types';
import type { AdminSnapshot } from '../../shared/admin/types';
import { getDomainStatus, getRegistrarCounts } from '../../shared/domainUtils';

export const getAdminSummary = (snapshot: AdminSnapshot) => {
  const reference = new Date(snapshot.updatedAt);
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() - 5 + index, 1));
    return { key: date.toISOString().slice(0, 7), label: date.toLocaleDateString(undefined, { month: `short`, timeZone: `UTC` }), value: 0, secondary: 0 };
  });
  for (const user of snapshot.users) {
    const month = months.find(item => item.key === user.created?.slice(0, 7));
    if (month) month.value += 1;
  }
  for (const domain of snapshot.domains) {
    const month = months.find(item => item.key === domain.created?.slice(0, 7));
    if (month) month.secondary += 1;
  }
  const statusCounts = new Map<string, number>();
  const roleCounts = new Map<string, number>();
  const currencyCosts = new Map<string, number>();
  for (const user of snapshot.users) roleCounts.set(user.role, (roleCounts.get(user.role) ?? 0) + 1);
  for (const domain of snapshot.domains) {
    const status = getDomainStatus(domain);
    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
    const currency = domain.currency || `USD`;
    currencyCosts.set(currency, (currencyCosts.get(currency) ?? 0) + domain.renewalPrice);
  }
  const cost = [...currencyCosts].map(([currency, amount]) => {
    try { return new Intl.NumberFormat(undefined, { currency, style: `currency`, maximumFractionDigits: 0 }).format(amount); }
    catch { return `${currency} ${amount.toFixed(0)}`; }
  }).join(` + `) || `—`;
  return {
    cost,
    months: months as ChartPoint[],
    activeAccounts: snapshot.users.filter(user => user.active).length,
    renewing: statusCounts.get(`Renewing Soon`) ?? 0,
    statuses: [...statusCounts].map(([label, value]) => ({ label, value })),
    roles: [...roleCounts].map(([label, value]) => ({ label: label === `Administrator` ? `Admin (Legacy)` : label, value })),
    registrars: getRegistrarCounts(snapshot.domains).map(({ registrar, count }) => ({ label: registrar, value: count })),
  };
};
