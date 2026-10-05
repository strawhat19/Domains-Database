import { createStyles } from './styles.native';
import DomainAnalyticsButton from '../DomainAnalyticsButton';
import DomainSourceBadge from '../DomainSourceBadge/index.native';
import Svg, { Path, Rect } from 'react-native-svg';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { DomainRecord } from '../../shared/types';
import { elementProps } from '../../shared/elementProps';
import { getDomainSiteIconUrl } from '../../shared/domainSiteIcon';
import { Globe2, Pencil, RefreshCw, Trash2 } from 'lucide-react-native';
import { Animated, Image, Linking, Pressable, Text, View } from 'react-native';
import { useColumns } from '../../shared/columnContext/useColumns';
import { useTheme } from '../../shared/themeContext/useTheme';
import { formatDate, getDaysUntil, getDomainStatus } from '../../shared/domainUtils';
import { PORTFOLIO_COLUMNS, getWebsiteInsightsHint, getRenewalEstimateHint, getPortfolioColumnValue, getPortfolioColumnDisplay } from '../../shared/portfolioColumns';

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
  const siteIconUrl = domain ? getDomainSiteIconUrl(domain) : ``;
  useEffect(() => setIconFailed(false), [siteIconUrl]);
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
  const renewalEstimate = getPortfolioColumnDisplay(domain, `renewalEstimate`);
  const renewalEstimateHint = getRenewalEstimateHint(domain);
  const autoRenewLabel = autoRenew === undefined ? `unknown` : getPortfolioColumnDisplay(domain, `autoRenew`).toLowerCase();
  const daysLabel = !Number.isFinite(days)
    ? `Expiry unknown`
    : days < 0 ? `${Math.abs(days)} day(s) ago` : days === 0 ? `Expires today` : `In ${days} day(s)`;

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
              <Svg
                width={18}
                height={18}
                accessible={false}
                viewBox={`0 0 16 16`}
                pointerEvents={`none`}
                style={styles.selectionIcon}
                accessibilityElementsHidden
                importantForAccessibility={`no-hide-descendants`}
                {...elementProps(`native-domain-select-icon`, domain.id)}
              >
                {selected ? (
                  <Path
                    fill={palette.accent}
                    fillRule={`evenodd`}
                    {...elementProps(`native-domain-select-check`, domain.id)}
                    d={`M4 0h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4Z M4.2 7.7 6.6 10.1 11.7 5 13.1 6.4 6.6 12.9 2.8 9.1Z`}
                  />
                ) : (
                  <Rect
                    x={.75}
                    y={.75}
                    rx={3.25}
                    width={14.5}
                    fill={`none`}
                    height={14.5}
                    strokeWidth={1.5}
                    stroke={palette.accent}
                    {...elementProps(`native-domain-select-outline`, domain.id)}
                  />
                )}
              </Svg>
            </Pressable>
          )}
          <Text {...elementProps(`native-domain-position`, domain.id)} style={styles.position}>
            {index + 1}
          </Text>
        </View>
        <View {...elementProps(`native-domain-monogram`, domain.id)} style={styles.monogram}>
          {iconFailed || !siteIconUrl ? (
            <Globe2 {...elementProps(`native-domain-icon-fallback`, domain.id)} size={20} color={palette.accent} />
          ) : (
            <Image
              key={siteIconUrl}
              {...elementProps(`native-domain-site-icon`, domain.id)}
              style={styles.siteIcon}
              accessibilityIgnoresInvertColors
              onError={() => setIconFailed(true)}
              source={{ uri: siteIconUrl }}
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
        <View {...elementProps(`native-domain-registrar-group`, domain.id)} style={styles.registrarGroup}>
          <Text {...elementProps(`native-domain-registrar`, domain.id)} style={styles.registrar}>
            {domain.registrar || `—`}
          </Text>
          <DomainSourceBadge domain={domain} id={`native-domain-source-${domain.id}`} />
        </View>
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
      {visibleColumns.includes(`renewalEstimate`) && renewalEstimate !== `—` && (
        <View
          style={styles.renewalEstimate}
          {...elementProps(`native-domain-renewal-estimate`, domain.id)}
        >
          <View
            style={styles.renewalEstimateHeading}
            {...elementProps(`native-domain-renewal-estimate-heading`, domain.id)}
          >
            <Text
              style={styles.renewalEstimateLabel}
              {...elementProps(`native-domain-renewal-estimate-label`, domain.id)}
            >
              {`Renewal estimate`}
            </Text>
            <Text
              style={styles.renewalEstimatePrice}
              {...elementProps(`native-domain-renewal-estimate-price`, domain.id)}
            >
              {renewalEstimate}
            </Text>
          </View>
          <Text
            style={styles.renewalEstimateHint}
            {...elementProps(`native-domain-renewal-estimate-hint`, domain.id)}
          >
            {renewalEstimateHint}
          </Text>
        </View>
      )}
      {PORTFOLIO_COLUMNS.filter(column => [`websitePerformance`, `trancoRank`, `websiteInsightsCheckedAt`].includes(column.field) && visibleColumns.includes(column.field)).map(column => (
        <View
          key={column.field}
          style={styles.renewalEstimate}
          {...elementProps(`native-domain-insight-${column.field}`, domain.id)}
        >
          <View
            style={styles.renewalEstimateHeading}
            {...elementProps(`native-domain-insight-heading-${column.field}`, domain.id)}
          >
            <Text
              style={styles.renewalEstimateLabel}
              {...elementProps(`native-domain-insight-label-${column.field}`, domain.id)}
            >
              {column.label}
            </Text>
            <Text
              style={styles.renewalEstimatePrice}
              {...elementProps(`native-domain-insight-value-${column.field}`, domain.id)}
            >
              {getPortfolioColumnDisplay(domain, column.field)}
            </Text>
          </View>
          <Text
            style={styles.renewalEstimateHint}
            {...elementProps(`native-domain-insight-hint-${column.field}`, domain.id)}
          >
            {getWebsiteInsightsHint(domain, column.field)}
          </Text>
        </View>
      ))}
      <DomainAnalyticsButton suffix={`native-domain-card-${domain.id}`} domain={domain.name} />
    </View>
  );
};

export default DomainCard;
