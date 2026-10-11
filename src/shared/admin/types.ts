import type { Roles } from '../../types/types';
import type { User } from '../models/users/User';
import type { Domain } from '../models/domains/Domain';
import type { Notification } from '../models/notifications/Notification';

export interface AdminCoverage { loaded: number; limit: number; hasMore: boolean }
export interface AdminSnapshot {
  users: User[];
  domains: Domain[];
  notifications: Notification[];
  notificationError: string;
  notificationCoverage: AdminCoverage | null;
  updatedAt: string;
  mode: `firebase` | `local`;
  canInspectAccounts: boolean;
  registeredAccounts: number | null;
  userCoverage: AdminCoverage;
  domainCoverage: AdminCoverage;
}
export interface UserAccessInput { role?: Roles; active?: boolean }
