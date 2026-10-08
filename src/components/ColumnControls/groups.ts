import type { PortfolioColumn } from '../../shared/portfolioColumns';

export const COLUMN_GROUPS: {
  id: string;
  label: string;
  fields: PortfolioColumn[];
}[] = [
  {
    id: `domain`,
    label: `Domain details`,
    fields: [`name`, `tld`, `internationalName`, `status`, `owner`, `providerId`],
  },
  {
    id: `project`,
    label: `Project details`,
    fields: [`mvp`, `future`, `difficulty`],
  },
  {
    id: `registration`,
    label: `Registration & renewals`,
    fields: [
      `registrar`,
      `createdAt`,
      `updatedAt`,
      `ownershipAt`,
      `expiresAt`,
      `autoRenew`,
      `firstImportedAt`,
      `firstExportedAt`,
    ],
  },
  {
    id: `security`,
    label: `Security & routing`,
    fields: [`locked`, `privacy`, `dnssec`, `nameservers`, `forwardingUrl`, `protectionPlan`],
  },
  {
    id: `insights`,
    label: `Website insights`,
    fields: [`trancoRank`, `websitePerformance`, `websiteInsightsCheckedAt`],
  },
  {
    id: `contact`,
    label: `Registrant contact`,
    fields: [`registrantName`, `registrantEmail`, `organization`, `country`],
  },
  {
    id: `costs`,
    label: `Costs`,
    fields: [`renewalPrice`, `renewalEstimate`, `monthlyCost`, `currency`, `estimatedValue`],
  },
];
