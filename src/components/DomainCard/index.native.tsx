import { createStyles } from './styles.native';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { DomainRecord } from '../../shared/types';
import { elementProps } from '../../shared/elementProps';
import { Square, CheckSquare, Globe2, Pencil, RefreshCw, Trash2 } from 'lucide-react-native';
import { Animated, Image, Linking, Pressable, Text, View } from 'react-native';
import { useColumns } from '../../shared/columnContext/useColumns';
import { useTheme } from '../../shared/themeContext/useTheme';
import { formatDate, getDaysUntil, getDomainStatus } from '../../shared/domainUtils';
import { getPortfolioColumnValue, getPortfolioColumnDisplay } from '../../shared/portfolioColumns';

interface DomainCardProps {
  index?: number;
  selected?: boolean;
  loading?: boolean;
  domain?: DomainRecord;
  onSelect?: (id: string) => void;
  onEdit?: (domain: DomainRecord) => void;
  onDelete?: (domain: DomainRecord) => void;
}

const DomainCard = ({ index = 0, selected = false, loading = false, domain, onEdit, onDelete, onSelect }: DomainCardProps) => {
  const { palette } = useTheme();
  const { visibleColumns } = useColumns();
  const [iconFailed, setIconFailed] = useState(false);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const opacity = useRef(new Animated.Value(.45)).current;
  useEffect(() => setIconFailed(false), [domain?.name]);
  const statusColors = {
    Active: { foreground: palette.success, background: palette.successBackground },
    Unknown: { foreground: palette.muted, background: palette.subtle },
    Expired: { foreground: palette.danger, background: palette.dangerBackground },
    'Renewing Soon': { foreground: palette.warning, background: palette.warningBackground },
  };
  useEffect(() => {
    if (!loading) return;
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: .45, duration: 800, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [loading, opacity]);

  if (loading) return (
    <Animated.View {...elementProps(`native-domain-skeleton`, String(index))} style={[styles.card, { opacity }]} accessibilityLabel={`Loading Domain`}>
      <View {...elementProps(`native-domain-skeleton-header`, String(index))} style={styles.skeletonHeader}>
        <View {...elementProps(`native-domain-skeleton-monogram`, String(index))} style={styles.skeletonMonogram} />
        <View {...elementProps(`native-domain-skeleton-title-group`, String(index))} style={styles.skeletonTitleGroup}>
          <View {...elementProps(`native-domain-skeleton-title`, String(index))} style={styles.skeletonTitle} />
          <View {...elementProps(`native-domain-skeleton-owner`, String(index))} style={styles.skeletonOwner} />
        </View>
      </View>
      <View {...elementProps(`native-domain-skeleton-footer`, String(index))} style={styles.skeletonFooter}>
        <View {...elementProps(`native-domain-skeleton-expiry`, String(index))} style={styles.skeletonDetail} />
        <View {...elementProps(`native-domain-skeleton-price`, String(index))} style={styles.skeletonDetail} />
      </View>
    </Animated.View>
  );
  if (!domain) return null;

  const status = getDomainStatus(domain);
  const colors = statusColors[status];
  const days = getDaysUntil(domain.expiresAt);
  const autoRenew = getPortfolioColumnValue(domain, `autoRenew`);
  const annualPrice = getPortfolioColumnDisplay(domain, `renewalPrice`);
  const monthlyPrice = getPortfolioColumnDisplay(domain, `monthlyCost`);
  const autoRenewLabel = getPortfolioColumnDisplay(domain, `autoRenew`).toLowerCase();
  const daysLabel = !Number.isFinite(days)
    ? `Expiry unknown`
    : days < 0 ? `${Math.abs(days)} day(s) ago` : days === 0 ? `Expires today` : `In ${days} day(s)`;
  const SelectionIcon = selected ? CheckSquare : Square;

  return (
    <View {...elementProps(`native-domain-card`, domain.id)} style={[styles.card, selected && styles.cardSelected]}>
      <View {...elementProps(`native-domain-card-top`, domain.id)} style={styles.top}>
        <View {...elementProps(`native-domain-selection-position`, domain.id)} style={styles.selectionPosition}>
          {onSelect && (
            <Pressable
              {...elementProps(`native-domain-select`, domain.id)}
              style={styles.selectionButton}
              accessibilityRole={`checkbox`}
              accessibilityState={{ checked: selected }}
              accessibilityLabel={`Select ${domain.name}`}
              onPress={() => onSelect(domain.id)}
            >
              <SelectionIcon {...elementProps(`native-domain-select-icon`, domain.id)} size={18} color={selected ? palette.accent : palette.muted} />
            </Pressable>
          )}
          <Text {...elementProps(`native-domain-position`, domain.id)} style={styles.position}>
            {index + 1}
          </Text>
        </View>
        <View {...elementProps(`native-domain-monogram`, domain.id)} style={styles.monogram}>
          {iconFailed ? (
            <Globe2 {...elementProps(`native-domain-icon-fallback`, domain.id)} size={20} color={palette.accent} />
          ) : (
            <Image
              {...elementProps(`native-domain-site-icon`, domain.id)}
              style={styles.siteIcon}
              accessibilityIgnoresInvertColors
              onError={() => setIconFailed(true)}
              source={{ uri: `https://${domain.name}/favicon.ico` }}
            />
          )}
        </View>
        <View {...elementProps(`native-domain-name-group`, domain.id)} style={styles.nameGroup}>
          <Pressable
            {...elementProps(`native-domain-site-link`, domain.id)}
            accessibilityRole={`link`}
            accessibilityLabel={`Open ${domain.name}`}
            onPress={() => void Linking.openURL(`https://${domain.name}`).catch(() => undefined)}
          >
            <Text {...elementProps(`native-domain-name`, domain.id)} style={styles.name} numberOfLines={1}>
              {domain.name}
            </Text>
          </Pressable>
        </View>
        <View {...elementProps(`actionsCell`, domain.id)} style={styles.actionsCell}>
          <Pressable {...elementProps(`native-domain-edit`, domain.id)} style={styles.actionButton} onPress={() => onEdit?.(domain)} accessibilityRole={`button`} accessibilityLabel={`Edit ${domain.name}`}>
            <Pencil {...elementProps(`native-domain-edit-icon`, domain.id)} size={14} color={palette.muted} />
          </Pressable>
          <Pressable {...elementProps(`native-domain-delete`, domain.id)} style={styles.actionButton} onPress={() => onDelete?.(domain)} accessibilityRole={`button`} accessibilityLabel={`Delete ${domain.name}`}>
            <Trash2 {...elementProps(`native-domain-delete-icon`, domain.id)} size={14} color={palette.muted} />
          </Pressable>
        </View>
      </View>
      <View {...elementProps(`native-domain-card-middle`, domain.id)} style={styles.middle}>
        <Text {...elementProps(`native-domain-registrar`, domain.id)} style={styles.registrar}>
          {domain.registrar || `—`}
        </Text>
        <View {...elementProps(`rowStatus`, domain.id)} style={styles.rowStatus}>
          <View {...elementProps(`statusDotWrap`, domain.id)} style={[styles.statusDotWrap, { backgroundColor: colors.background }]}>
            <View {...elementProps(`statusDot`, domain.id)} style={[styles.statusDot, { backgroundColor: colors.foreground }]} />
          </View>
          <Text {...elementProps(`statusText`, domain.id)} style={[styles.statusText, { color: colors.foreground }]}>
            {status}
          </Text>
        </View>
      </View>
      <View {...elementProps(`native-domain-card-bottom`, domain.id)} style={styles.bottom}>
        <View {...elementProps(`native-domain-expiry`, domain.id)} style={styles.expiry}>
          <Text {...elementProps(`native-domain-expiry-date`, domain.id)} style={styles.expiryDate}>
            {formatDate(domain.expiresAt)}
          </Text>
          <Text {...elementProps(`native-domain-expiry-days`, domain.id)} style={styles.expiryDays}>
            {daysLabel}
          </Text>
        </View>
        <View {...elementProps(`native-domain-renewal`, domain.id)} style={styles.renewal}>
          <Text {...elementProps(`native-domain-renewal-price`, domain.id)} style={styles.renewalPrice}>
            {annualPrice === `—` ? annualPrice : `${annualPrice} / year`}
          </Text>
          {visibleColumns.includes(`monthlyCost`) && (
            <Text {...elementProps(`native-domain-monthly-cost`, domain.id)} style={styles.renewalPrice}>
              {monthlyPrice === `—` ? monthlyPrice : `${monthlyPrice} / month`}
            </Text>
          )}
          <View {...elementProps(`native-domain-auto-renew`, domain.id)} style={styles.autoRenew}>
            <RefreshCw {...elementProps(`native-domain-auto-renew-icon`, domain.id)} size={10} color={autoRenew === true ? palette.accent : palette.muted} />
            <Text {...elementProps(`native-domain-auto-renew-text`, domain.id)} style={styles.autoRenewText}>
              {`Auto-renew ${autoRenewLabel}`}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default DomainCard;
