import { usePathname } from 'expo-router';

export { navigation, footerLinks } from '../../shared/routes';
export const useAppShell = () => ({ pathname: usePathname(), year: new Date().getFullYear() });
