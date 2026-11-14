export interface DomainParkingMetrics {
  domain: string;
  startDate: string;
  endDate: string;
  checkedAt: string;
  report: {
    visits: number | null;
    pageViews: number | null;
    adClicks: number | null;
    currency: string | null;
    revenueMicrounits: number | null;
  } | null;
}
