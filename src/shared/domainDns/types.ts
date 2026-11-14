export const DOMAIN_DNS_TYPES = [`A`, `AAAA`, `CNAME`, `MX`] as const;
export const DOMAIN_DNS_SOURCE = `GoDaddy DNS Zone`;
export const DOMAIN_DNS_LIMIT_PER_TYPE = 25;

export type DomainDnsRecordType = typeof DOMAIN_DNS_TYPES[number];

export interface DomainDnsRecord {
  ttl: number;
  name: string;
  value: string;
  priority?: number;
  type: DomainDnsRecordType;
}

export interface DomainDnsSnapshot {
  domain: string;
  checkedAt: string;
  records: DomainDnsRecord[];
  source: typeof DOMAIN_DNS_SOURCE;
  coverage: { type: DomainDnsRecordType; status: `complete` | `truncated` | `unavailable` }[];
}
