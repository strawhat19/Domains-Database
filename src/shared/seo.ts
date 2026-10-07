export const SITE_URL = (process.env.EXPO_PUBLIC_SITE_URL?.trim() || `https://domains-database.vercel.app`).replace(/\/+$/, ``);

export const absoluteSiteUrl = (path: string) => new URL(path, `${SITE_URL}/`).href;
