import { getRandomArrayValue } from '../../shared/common/values';

export interface DataColor {
  name: string;
  color: string;
  type: `dark` | `light`;
}

export const colors: Record<string, DataColor> = {
  info: { name: `info`, color: `#138b8b`, type: `dark` },
  error: { name: `error`, color: `#ad5653`, type: `dark` },
  violet: { name: `violet`, color: `#7356a1`, type: `dark` },
  success: { name: `success`, color: `#248477`, type: `dark` },
  warning: { name: `warning`, color: `#e7b987`, type: `light` },
  disabled: { name: `disabled`, color: `#a1b3bd`, type: `light` },
};
export const usedColorNames = new Set<string>();
export const getRandomUnusedColor = (options = Object.values(colors)): DataColor => {
  const available = options.filter(color => !usedColorNames.has(color.name));
  if (!available.length) usedColorNames.clear();
  const color = getRandomArrayValue(available.length ? available : options) ?? colors.info;
  usedColorNames.add(color.name);
  return color;
};

export type ThemeMode = `light` | `dark`;
export const THEME_STORAGE_KEY = `domains-database:theme:v1`;
export const THEME_BOOTSTRAP_KEY = `domains-database:theme-preview:v1`;

const lightPalette = {
  ink: `#133b50`,
  paper: `#ffffff`,
  muted: `#61717b`,
  line: `#d8e0e3`,
  accent: `#138b8b`,
  canvas: `#f1f3f3`,
  contrast: `#ffffff`,
  strong: `#133b50`,
  subtle: `#eaf3f3`,
  input: `#f7f9f9`,
  placeholder: `#73828a`,
  skeleton: `#e4ebee`,
  success: `#248477`,
  successBackground: `#e5f2ef`,
  warning: `#a05b31`,
  warningBackground: `#f7f3e8`,
  danger: `#ad5653`,
  dangerBackground: `#f8e9e1`,
  overlay: `rgba(13, 39, 51, .35)`,
};

export type ThemePalette = Record<keyof typeof lightPalette, string>;

const darkPalette: ThemePalette = {
  ink: `#e0edf4`,
  paper: `#14232d`,
  muted: `#a1b3bd`,
  line: `#2c414f`,
  accent: `#5acfc6`,
  canvas: `#0c1821`,
  contrast: `#082d2e`,
  strong: `#133b50`,
  subtle: `#1b343d`,
  input: `#10202b`,
  placeholder: `#849aa7`,
  skeleton: `#2b414e`,
  success: `#71d9b7`,
  successBackground: `#153931`,
  warning: `#e7b987`,
  warningBackground: `#3a2d22`,
  danger: `#ff9f96`,
  dangerBackground: `#3d2529`,
  overlay: `rgba(0, 0, 0, .6)`,
};

export const themePalettes: Record<ThemeMode, ThemePalette> = {
  light: lightPalette,
  dark: darkPalette,
};

