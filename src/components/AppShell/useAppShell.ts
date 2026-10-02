import { usePathname } from 'expo-router';

export const navigation = [
  { href: `/`, label: `Overview` },
  { href: `/domains`, label: `Portfolio` },
] as const;

export const footerLinks = [
  { href: `/about`, label: `About` },
  { href: `/terms`, label: `Terms` },
  { href: `/contact`, label: `Contact` },
  { href: `/privacy`, label: `Privacy` },
] as const;

export const useAppShell = () => ({ pathname: usePathname(), year: new Date().getFullYear() });
