import type { DomainParkingMetrics } from './types';

const counts = new Intl.NumberFormat(`en-US`);
const day = new Intl.DateTimeFormat(`en-US`, { dateStyle: `medium`, timeZone: `UTC` });

export const getParkingMetricsLabels = ({ report, startDate, endDate, checkedAt }: DomainParkingMetrics) => {
  const formatDate = (value: string) => day.format(new Date(value));
  const date = `${formatDate(startDate)}–${formatDate(endDate)} · Checked ${new Date(checkedAt).toLocaleString()}`;
  if (!report) return [{ id: `empty`, label: `GoDaddy Returned No Parking Data · ${date}` }];
  const revenue = report.revenueMicrounits !== null && report.currency ? new Intl.NumberFormat(`en-US`, {
    style: `currency`, currency: report.currency, maximumFractionDigits: 6,
  }).format(report.revenueMicrounits / 1_000_000) : ``;
  return [
    { id: `period`, label: `GoDaddy Parking · ${date}` },
    { id: `revenue`, label: revenue ? `${revenue} Parking Revenue` : `` },
    { id: `visits`, label: report.visits === null ? `` : `${counts.format(report.visits)} Visit(s)` },
    { id: `page-views`, label: report.pageViews === null ? `` : `${counts.format(report.pageViews)} Page View(s)` },
    { id: `ad-clicks`, label: report.adClicks === null ? `` : `${counts.format(report.adClicks)} Ad Click(s)` },
  ].filter(detail => detail.label);
};
