import { Roles } from '../types/types';
import { minRole, type User } from './models/users/User';

export const hasUnlimitedPlanAccess = (user?: Pick<User, `role`> | null) => Boolean(user && minRole(user.role, Roles.Administrator));
export const hasProPlanAccess = (user?: Pick<User, `role` | `plan`> | null) => hasUnlimitedPlanAccess(user) || user?.plan?.trim().toLowerCase() === `pro`;
