export type Registrar = `Hostinger` | `GoDaddy` | `GoDaddy Auctions` | `Namecheap`;
export type DomainStatus = `Expired` | `Renewing Soon` | `Active`;

export interface DomainRecord {
  id: string;
  name: string;
  owner: string;
  notes: string;
  number: number;
  isSample?: boolean;
  expiresAt: string;
  autoRenew: boolean;
  registrar: Registrar;
  renewalPrice: number;
}

export type DomainInput = Omit<DomainRecord, `id` | `number` | `isSample`>;

export interface PortfolioSnapshot {
  version: 1;
  nextNumber: number;
  domains: DomainRecord[];
}
