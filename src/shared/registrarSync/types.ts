import type { Registrar } from '../types';
import type { ConnectionProvider } from '../connections/types';

export interface RegistrarDomain {
  name: string;
  registrar: Registrar;
  status?: string;
  locked?: boolean;
  privacy?: boolean;
  expiresAt?: string;
  autoRenew?: boolean;
  createdAt?: string;
  providerId?: string;
}

export interface ConnectionSyncStatus {
  count: number;
  message: string;
  checkedAt: string;
  state: `idle` | `checking` | `connected` | `error`;
}

export type ConnectionSyncStatuses = Record<ConnectionProvider, ConnectionSyncStatus>;
export interface RegistrarSyncResult { domains: RegistrarDomain[]; warnings?: string[] }
export interface ConnectionSyncResult { count: number; errors: string[]; warnings: string[] }
