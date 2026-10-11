import { Roles } from '../../types/types';
import type { User } from '../models/users/User';

export type AdminSection = `overview` | `users` | `plans` | `domains` | `requests` | `reports` | `notifications` | `analytics` | `observability`;
type Account = Pick<User, `id` | `role` | `active`> | null | undefined;
const operationalRoles: string[] = [Roles.Owner, `Admin`, Roles.Administrator];
const technicalRoles: string[] = [...operationalRoles, Roles.Developer];

export const canInspectAccounts = (user: Account) => !!user?.active && operationalRoles.includes(user.role);
export const canManageNotifications = canInspectAccounts;
export const canManagePlans = canInspectAccounts;
export const canManageRoles = (user: Account) => !!user?.active && user.role === Roles.Owner;
export const canManageUsers = canManageRoles;
export const canAccessAdmin = (user: Account, section: AdminSection = `overview`) => {
  if (section === `requests` || section === `reports`) return canManageRoles(user);
  if (section === `plans`) return canManagePlans(user);
  if (section === `users` || section === `domains` || section === `notifications`) return canInspectAccounts(user);
  return !!user?.active && technicalRoles.includes(user.role);
};
export const canManageAccountStatus = (actor: Account, target: Account) => {
  if (!canInspectAccounts(actor) || !target || actor?.id === target.id) return false;
  if (canManageRoles(actor)) return true;
  return !technicalRoles.includes(target.role);
};
