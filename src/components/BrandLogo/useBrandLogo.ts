import { useTheme } from '../../shared/themeContext/useTheme';
import { useAppBrand } from '../../shared/branding/useAppBrand';

export const logoRecords = [
  { id: `com`, row: 0, column: 0 },
  { id: `org`, row: 1, column: 0 },
  { id: `dev`, row: 2, column: 0 },
  { id: `net`, row: 0, column: 1 },
  { id: `app`, row: 1, column: 1 },
  { id: `io`, row: 2, column: 1 },
];

export const recordPath = (row: number) => `M47 ${51 + row * 65}h141l22 24v35H47v-59Z`;

export const useBrandLogo = () => {
  const brand = useAppBrand();
  const { isDark } = useTheme();
  return { ...brand, ink: isDark ? `#e0edf4` : `#133B50`, accent: isDark ? `#5acfc6` : `#138B8B`, label: isDark ? `#0c1821` : `#FFFFFF` };
};
