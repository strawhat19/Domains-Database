export const sellerUsernamePattern = /^[a-z0-9]{3,30}$/;

export const normalizeSellerUsername = (value: string) => value.trim().toLowerCase();

export const sellerProfilePath = (username: string): `/domainers/${string}` => `/domainers/${encodeURIComponent(username)}`;

export const isSellerProfilePath = (value: string): value is ReturnType<typeof sellerProfilePath> =>
  /^\/domainers\/[a-z0-9]{3,30}$/.test(value);
