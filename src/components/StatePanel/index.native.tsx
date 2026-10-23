import { useMemo } from 'react';
import type { StatePanelProps } from './types';
import { createStyles } from './styles.native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { Text, View, Platform, useWindowDimensions } from 'react-native';
import { Eye, Bell, Gavel, Clock3, Globe2, Search, CircleAlert, UsersRound, LockKeyhole } from 'lucide-react-native';

const icons = { watching: Eye, notifications: Bell, auction: Gavel, planned: Clock3, domains: Globe2, search: Search, error: CircleAlert, community: UsersRound, lock: LockKeyhole };
const decorativeProps = Platform.OS === `web`
  ? { 'aria-hidden': true as const }
  : { accessible: false, accessibilityElementsHidden: true, importantForAccessibility: `no-hide-descendants` as const };
const decorativeIconProps = Platform.OS === `web` ? { 'aria-hidden': true as const } : { accessible: false };

const StatePanel = ({ id, title, description, eyebrow, badge, detail, children, alert = false, icon = `domains`, variant = `page` }: StatePanelProps) => {
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const compact = width < 600;
  const inline = variant === `inline`;
  const Icon = icons[icon];
  const headingProps = Platform.OS === `web` ? { 'aria-level': inline ? 2 : 1 } : {};

  return <View {...elementProps(`state-panel`, id)} style={[styles.page, inline && styles.inline, compact && styles.compact]}>
    <View {...elementProps(`state-panel-content`, id)} style={styles.content}>
      <View {...elementProps(`state-panel-art`, id)} {...decorativeProps} style={styles.art}>
        <View {...elementProps(`state-panel-back-tile`, id)} style={styles.backTile} />
        <View {...elementProps(`state-panel-tile`, id)} style={styles.tile}>
          <Icon {...elementProps(`state-panel-icon`, id)} {...decorativeIconProps} size={30} strokeWidth={1.5} color={alert ? palette.danger : palette.accent} />
        </View>
        <View {...elementProps(`state-panel-domain-first`, id)} style={[styles.domain, styles.domainFirst]}>
          <Text {...elementProps(`state-panel-domain-first-text`, id)} style={styles.domainText}>{`.com`}</Text>
        </View>
        <View {...elementProps(`state-panel-domain-last`, id)} style={[styles.domain, styles.domainLast]}>
          <Text {...elementProps(`state-panel-domain-last-text`, id)} style={styles.domainText}>{`.dev`}</Text>
        </View>
      </View>
      {!!eyebrow && <Text {...elementProps(`state-panel-eyebrow`, id)} style={styles.eyebrow}>{eyebrow}</Text>}
      <View {...elementProps(`state-panel-title-row`, id)} style={styles.titleRow}>
        <Text {...elementProps(`state-panel-title`, id)} {...headingProps} accessibilityRole={`header`} style={[styles.title, inline && styles.inlineTitle, compact && (inline ? styles.compactInlineTitle : styles.compactTitle)]}>{title}</Text>
        {!!badge && <Text {...elementProps(`state-panel-badge`, id)} style={styles.badge}>{badge}</Text>}
      </View>
      <Text {...elementProps(`state-panel-description`, id)} accessibilityRole={alert ? `alert` : undefined} accessibilityLiveRegion={alert ? `polite` : undefined} style={[styles.description, inline && styles.inlineDescription]}>{description}</Text>
      {!!children && <View {...elementProps(`state-panel-actions`, id)} style={[styles.actions, compact && styles.compactActions]}>{children}</View>}
      {!!detail && <Text {...elementProps(`state-panel-detail`, id)} style={styles.detail}>{detail}</Text>}
    </View>
  </View>;
};

export default StatePanel;
