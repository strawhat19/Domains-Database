import type { User } from '../models/users/User';

export const getAccountBadgeColors = (user?: User | null) => ({
  backgroundColor: user?.color?.color || `#187565`,
  color: user?.color?.type === `light` ? `#133b50` : `#ffffff`,
});
