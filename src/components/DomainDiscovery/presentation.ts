import type { ThemePalette } from '../../shared/themeContext/theme';
import type { DomainDiscoveryStatus } from '../../shared/domainSearch/discovery';
import { Type, Text, Flame, Sparkles, LayoutGrid, Minimize2, TrendingUp, BadgeDollarSign } from 'lucide-react-native';

export const discoveryIcons = {
  hot: Flame,
  new: Sparkles,
  all: LayoutGrid,
  short: Minimize2,
  'one-word': Type,
  'two-word': Text,
  trending: TrendingUp,
  value: BadgeDollarSign,
};

export const getDiscoveryStatusTone = (status: DomainDiscoveryStatus, palette: ThemePalette) => {
  if (status === `hot`) return { color: palette.warning, backgroundColor: palette.warningBackground };
  if (status === `new` || status === `value`) return { color: palette.success, backgroundColor: palette.successBackground };
  if (status === `short` || status === `one-word` || status === `two-word`) return { color: palette.muted, backgroundColor: palette.input };
  return { color: palette.accent, backgroundColor: palette.subtle };
};
