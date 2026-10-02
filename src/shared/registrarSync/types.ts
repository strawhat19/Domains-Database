import type { Registrar, JSONValue } from '../types';
import type { ConnectionProvider } from '../connections/types';

export interface RegistrarDomain {
  name: string;
  registrar: Registrar | ``;
  status?: string;
  locked?: boolean;
  privacy?: boolean;
  expiresAt?: string;
  autoRenew?: boolean;
  createdAt?: string;
  providerId?: string;
  meta?: Record<string, JSONValue>;
  renewalEstimate?: { amount: number; currency: string };
}

export interface ConnectionSyncStatus {
  count: number;
  message: string;
  checkedAt: string;
  discoveredDomains?: RegistrarDomain[];
  state: `idle` | `checking` | `connected` | `error`;
}

export type ConnectionSyncStatuses = Record<ConnectionProvider, ConnectionSyncStatus>;
export interface RegistrarSyncResult { domains: RegistrarDomain[]; warnings?: string[]; discoveredDomains?: RegistrarDomain[] }
export interface ConnectionSyncResult { count: number; errors: string[]; warnings: string[] }
