import { useMemo } from 'react';
import { Link } from 'expo-router';
import { createStyles } from './styles.native';
import { Text, View, Pressable } from 'react-native';
import DomainAnalyticsButton from '../DomainAnalyticsButton';
import { Globe2, ArrowUpRight } from 'lucide-react-native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { getAuctionRow, type AuctionRowProps } from './presentation';

const AuctionRow = ({ record }: AuctionRowProps) => {
  const suffix = record.id;
  const view = getAuctionRow(record);
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const statusColor = view.statusState === `ended` ? palette.danger : palette.muted;
  const metrics = [
    { id: `bids`, label: `Bids`, value: view.bids },
    { id: `age`, label: `Age`, value: view.age },
    { id: `ends`, label: `Ends`, value: view.end },
    { id: `price`, label: `Price (USD)`, value: view.price },
  ];

  return (
    <View {...elementProps(`auction-row`, suffix)} style={styles.card}>
      <View {...elementProps(`auction-domain-identity`, suffix)} style={styles.identity}>
        <Globe2 {...elementProps(`auction-domain-icon`, suffix)} size={17} color={palette.accent} />
        <Text {...elementProps(`auction-domain`, suffix)} style={styles.domain}>{record.domain}</Text>
      </View>
      <View {...elementProps(`auction-source-heading`, suffix)} style={styles.sourceHeading}>
        <Text {...elementProps(`auction-source`, suffix)} style={styles.source}>{`${view.source} · ${view.type}`}</Text>
        <View {...elementProps(`rowStatus`, `auction-${suffix}`)} style={styles.rowStatus}>
          <View {...elementProps(`statusDotWrap`, `auction-${suffix}`)} style={styles.statusDotWrap}>
            <View {...elementProps(`statusDot`, `auction-${suffix}`)} style={[styles.statusDot, { backgroundColor: statusColor }]} />
          </View>
          <Text {...elementProps(`statusText`, `auction-${suffix}`)} style={[styles.statusText, { color: statusColor }]}>{view.status}</Text>
        </View>
      </View>
      {!!view.checked && <Text {...elementProps(`auction-snapshot-time`, suffix)} style={styles.source}>{`${view.checkedLabel}: ${view.checked}`}</Text>}
      <View {...elementProps(`auction-metrics`, suffix)} style={styles.metrics}>
        {metrics.map(metric => (
          <View key={metric.id} {...elementProps(`auction-metric`, `${suffix}-${metric.id}`)} style={styles.metric}>
            <Text {...elementProps(`auction-metric-label`, `${suffix}-${metric.id}`)} style={styles.label}>{metric.label}</Text>
            <Text {...elementProps(`auction-metric-value`, `${suffix}-${metric.id}`)} style={styles.value}>{metric.value}</Text>
          </View>
        ))}
      </View>
      {!!view.valuation && <Text {...elementProps(`auction-source-estimate`, suffix)} style={styles.source}>{`Source Estimate: ${view.valuation}`}</Text>}
      {!!view.pageviews && <Text {...elementProps(`auction-pageviews`, suffix)} style={styles.source}>{`Provider Pageviews: ${view.pageviews}`}</Text>}
      <View {...elementProps(`actionsCell`, `auction-${suffix}`)} style={styles.actionsCell}>
        {!!view.href && (
          <Link href={view.href} asChild>
            <Pressable
              {...elementProps(`auction-source-link`, suffix)}
              style={styles.link}
              accessibilityRole={`link`}
              accessibilityLabel={`${view.linkLabel} On ${view.source}`}
            >
              <Text {...elementProps(`auction-source-link-text`, suffix)} style={styles.linkText}>{view.linkLabel}</Text>
              <ArrowUpRight {...elementProps(`auction-source-link-icon`, suffix)} size={13} color={palette.accent} />
            </Pressable>
          </Link>
        )}
        <DomainAnalyticsButton domain={record.domain} suffix={`auction-${suffix}`} compact />
      </View>
    </View>
  );
};

export default AuctionRow;
