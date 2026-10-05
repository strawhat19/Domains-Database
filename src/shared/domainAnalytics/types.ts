export interface DomainAnalyticsSnapshot {
  domain: string;
  checkedAt: string;
  registration: {
    createdAt?: string;
    expiresAt?: string;
    registrar?: string;
    error?: string;
    status: `registered` | `unregistered` | `unknown`;
  };
  dns: {
    error?: string;
    records: { type: string; value: string }[];
  };
  name: {
    label: string;
    length: number;
    extension: string;
    keywords: string[];
    hasDigits: boolean;
    hasHyphens: boolean;
  };
  links: { label: string; url: string }[];
  errors?: string[];
  inventory?: {
    sourceLabel: string;
    importedAt?: string;
    sourceCheckedAt?: string;
    metrics: { key: string; label: string; value: string }[];
  };
}

export type PublicDomainAnalytics = Pick<DomainAnalyticsSnapshot, `domain` | `checkedAt` | `registration` | `dns`>;
