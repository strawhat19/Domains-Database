import { styles } from './styles.native';
import { useEffect, useRef } from 'react';
import type { DomainRecord } from '../../shared/types';
import { elementProps } from '../../shared/elementProps';
import { Pencil, RefreshCw, Trash2 } from 'lucide-react-native';
import { Animated, Pressable, Text, View } from 'react-native';
import { formatDate, formatCurrency, getDaysUntil, getDomainStatus } from '../../shared/domainUtils';

interface DomainCardProps {
  index?: number;
  loading?: boolean;
  domain?: DomainRecord;
  onEdit?: (domain: DomainRecord) => void;
  onDelete?: (domain: DomainRecord) => void;
}

const statusColors = {
  Active: { foreground: `#248477`, background: `#e6f1e9` },
  Expired: { foreground: `#b35857`, background: `#f9e7e1` },
  'Renewing Soon': { foreground: `#767a72`, background: `#eeefe7` },
};

const DomainCard = ({ index = 0, loading = false, domain, onEdit, onDelete }: DomainCardProps) => {
  const opacity = useRef(new Animated.Value(.45)).current;
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
  const daysLabel = days < 0 ? `${Math.abs(days)} day(s) ago` : days === 0 ? `Expires today` : `In ${days} day(s)`;

  return (
    <View {...elementProps(`native-domain-card`, domain.id)} style={styles.card}>
      <View {...elementProps(`native-domain-card-top`, domain.id)} style={styles.top}>
        <View {...elementProps(`native-domain-monogram`, domain.id)} style={styles.monogram}>
          <Text {...elementProps(`native-domain-monogram-text`, domain.id)} style={styles.monogramText}>
            {domain.name?.[0]?.toUpperCase()}
          </Text>
        </View>
        <View {...elementProps(`native-domain-name-group`, domain.id)} style={styles.nameGroup}>
          <Text {...elementProps(`native-domain-name`, domain.id)} style={styles.name} numberOfLines={1}>
            {domain.name}
          </Text>
          <Text {...elementProps(`native-domain-owner`, domain.id)} style={styles.owner} numberOfLines={1}>
            {domain.owner}
          </Text>
        </View>
        <View {...elementProps(`actionsCell`, domain.id)} style={styles.actionsCell}>
          <Pressable {...elementProps(`native-domain-edit`, domain.id)} style={styles.actionButton} onPress={() => onEdit?.(domain)} accessibilityRole={`button`} accessibilityLabel={`Edit ${domain.name}`}>
            <Pencil {...elementProps(`native-domain-edit-icon`, domain.id)} size={14} color={`#61716f`} />
          </Pressable>
          <Pressable {...elementProps(`native-domain-delete`, domain.id)} style={styles.actionButton} onPress={() => onDelete?.(domain)} accessibilityRole={`button`} accessibilityLabel={`Delete ${domain.name}`}>
            <Trash2 {...elementProps(`native-domain-delete-icon`, domain.id)} size={14} color={`#8a938d`} />
          </Pressable>
        </View>
      </View>
      <View {...elementProps(`native-domain-card-middle`, domain.id)} style={styles.middle}>
        <Text {...elementProps(`native-domain-registrar`, domain.id)} style={styles.registrar}>
          {domain.registrar}
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
            {`${formatCurrency(domain.renewalPrice)} / year`}
          </Text>
          <View {...elementProps(`native-domain-auto-renew`, domain.id)} style={styles.autoRenew}>
            <RefreshCw {...elementProps(`native-domain-auto-renew-icon`, domain.id)} size={10} color={domain.autoRenew ? `#138b8b` : `#8a938d`} />
            <Text {...elementProps(`native-domain-auto-renew-text`, domain.id)} style={styles.autoRenewText}>
              {`Auto-renew ${domain.autoRenew ? `on` : `off`}`}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default DomainCard;
