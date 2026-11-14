import type { Registrar, JSONValue, DomainRegistrant } from '../types';
import type { ConnectionProvider } from '../connections/types';

export interface ConnectedSyncRegistrar {
  label: string;
  provider: ConnectionProvider;
}

export interface RegistrarDetailSelection {
  start?: string;
  recent: [name: string, providerId?: string][];
}

export interface RegistrarDomain {
  name: string;
  registrar: Registrar | ``;
  status?: string;
  locked?: boolean;
  privacy?: boolean;
  dnssec?: boolean;
  expiresAt?: string;
  autoRenew?: boolean;
  createdAt?: string;
  updatedAt?: string;
  providerId?: string;
  nameservers?: string[];
  detailsCheckedAt?: string;
  internationalName?: string;
  detailsAttemptedAt?: string;
  registrant?: DomainRegistrant;
  meta?: Record<string, JSONValue>;
  renewalEstimate?: { amount: number; currency: string; years?: number };
}

export interface ConnectionSyncStatus {
  count: number;
  message: string;
  checkedAt: string;
  warnings?: string[];
  discoveredDomains?: RegistrarDomain[];
  state: `idle` | `checking` | `connected` | `error`;
}

export type ConnectionSyncStatuses = Record<ConnectionProvider, ConnectionSyncStatus>;
export type AccountSyncStatuses = Record<string, ConnectionSyncStatus>;
export interface VercelDomainConfiguration {
  name: string;
  verified: boolean;
  echMode?: `auto` | `disabled` | `enabled`;
  observedNameservers?: string[];
  intendedNameservers?: string[];
  dnsService: `external` | `zeit.world` | `na`;
}

export interface RegistrarSyncResult {
  warnings?: string[];
  domains: RegistrarDomain[];
  discoveredDomains?: RegistrarDomain[];
  vercelConfigurations?: VercelDomainConfiguration[];
}
export interface ConnectionSyncResult { count: number; errors: string[]; warnings: string[] }
