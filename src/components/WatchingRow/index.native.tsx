import { useMemo } from 'react';
import { Link } from 'expo-router';
import DomainAnalyticsButton from '../DomainAnalyticsButton';
import { createStyles } from './styles.native';
import { Text, View, Pressable } from 'react-native';
import { Eye, Trash2, ArrowUpRight } from 'lucide-react-native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { getWatchingRow, getWatchingConnection, type WatchingRowProps } from './presentation';

const WatchingRow = ({ busy, record, onRemove }: WatchingRowProps) => {
  const view = getWatchingRow(record);
  const suffix = record.id;
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const statusColor = view.status.state === `available` ? palette.success
    : view.status.state === `error` || view.status.state === `unavailable` ? palette.danger : palette.muted;

  return (
    <View {...elementProps(`watching-row`, suffix)} style={styles.card}>
      <View {...elementProps(`watching-domain-identity`, suffix)} style={styles.identity}>
        <Eye {...elementProps(`watching-domain-icon`, suffix)} size={17} color={palette.accent} />
        <Text {...elementProps(`watching-domain`, suffix)} style={styles.domain}>{record.domain}</Text>
      </View>
      <View {...elementProps(`actionsCell`, suffix)} style={styles.actionsCell}>
        <View {...elementProps(`rowStatus`, suffix)} style={styles.rowStatus}>
          <View {...elementProps(`statusDotWrap`, suffix)} style={styles.statusDotWrap}>
            <View {...elementProps(`statusDot`, suffix)} style={[styles.statusDot, { backgroundColor: statusColor }]} />
          </View>
          <Text {...elementProps(`statusText`, suffix)} style={[styles.statusText, { color: statusColor }]}>{view.status.label}</Text>
        </View>
        <Text {...elementProps(`watching-availability-summary`, suffix)} style={styles.note}>{view.status.summary}</Text>
      </View>
      <View {...elementProps(`watching-registrars`, suffix)} style={styles.connections}>
        {record.connections.map((connection, index) => {
          const offer = getWatchingConnection(connection);
          const connectionId = `${suffix}-${connection.provider}-${index}`;
          const color = offer.status.state === `available` ? palette.success
            : offer.status.state === `error` || offer.status.state === `unavailable` ? palette.danger : palette.muted;
          return (
            <View key={connectionId} {...elementProps(`watching-connection`, connectionId)} style={styles.connection}>
              <View {...elementProps(`watching-connection-heading`, connectionId)} style={styles.connectionHeading}>
                <Text {...elementProps(`watching-registrar-name`, connectionId)} style={styles.registrar}>{connection.label}</Text>
                <View {...elementProps(`rowStatus`, connectionId)} style={styles.rowStatus}>
                  <View {...elementProps(`statusDotWrap`, connectionId)} style={styles.statusDotWrap}>
                    <View {...elementProps(`statusDot`, connectionId)} style={[styles.statusDot, { backgroundColor: color }]} />
                  </View>
                  <Text {...elementProps(`statusText`, connectionId)} style={[styles.statusText, { color }]}>{offer.status.label}</Text>
                </View>
              </View>
              {offer.available ? (
                <View {...elementProps(`watching-connection-prices`, connectionId)} style={styles.prices}>
                  {[
                    { id: `registration`, label: `Registration`, price: offer.registration },
                    { id: `renewal`, label: `Renewal`, price: offer.renewal },
                  ].map(item => (
                    <View key={item.id} {...elementProps(`watching-price`, `${connectionId}-${item.id}`)} style={styles.price}>
                      <Text {...elementProps(`watching-price-label`, `${connectionId}-${item.id}`)} style={styles.priceLabel}>{item.label}</Text>
                      <Text {...elementProps(`watching-price-amount`, `${connectionId}-${item.id}`)} style={styles.priceAmount}>{item.price.amount}</Text>
                      <Text {...elementProps(`watching-price-term`, `${connectionId}-${item.id}`)} style={styles.note}>{item.price.term}</Text>
                      {!!item.price.currencyNote && <Text {...elementProps(`watching-price-currency`, `${connectionId}-${item.id}`)} style={[styles.note, { color: palette.warning }]}>{item.price.currencyNote}</Text>}
                    </View>
                  ))}
                </View>
              ) : <Text {...elementProps(`watching-no-price`, connectionId)} style={styles.note}>{`Prices shown when availability is confirmed.`}</Text>}
              {!!connection.error && <Text {...elementProps(`watching-connection-error`, connectionId)} style={[styles.note, { color: palette.danger }]} accessibilityRole={`alert`}>{connection.error}</Text>}
              {!!connection.note && <Text {...elementProps(`watching-connection-note`, connectionId)} style={styles.note}>{connection.note}</Text>}
              {!!offer.purchaseHref && (
                <Link href={offer.purchaseHref} asChild>
                  <Pressable
                    {...elementProps(`watching-buy`, connectionId)}
                    style={styles.buy}
                    accessibilityRole={`link`}
                    accessibilityLabel={`Buy ${record.domain} On ${connection.label} — Opens Registrar Website`}
                  >
                    <Text {...elementProps(`watching-buy-text`, connectionId)} style={styles.buyText}>{`Buy on ${connection.label}`}</Text>
                    <ArrowUpRight {...elementProps(`watching-buy-icon`, connectionId)} size={14} color={palette.accent} />
                  </Pressable>
                </Link>
              )}
            </View>
          );
        })}
        {!record.connections.length && <Text {...elementProps(`watching-no-registrars`, suffix)} style={styles.note}>{`No registrar checks saved. Sync to get mock comparison data.`}</Text>}
      </View>
      <View {...elementProps(`watching-dates`, suffix)} style={styles.dates}>
        <View {...elementProps(`watching-checked`, suffix)} style={styles.date}>
          <Text {...elementProps(`watching-checked-label`, suffix)} style={styles.priceLabel}>{`Last Checked`}</Text>
          <Text {...elementProps(`watching-checked-date`, suffix)} style={styles.note}>{view.checkedDate}</Text>
          <Text {...elementProps(`watching-data-origin`, suffix)} style={[styles.note, record.mock && { color: palette.warning }]}>{view.dataLabel}</Text>
        </View>
        <View {...elementProps(`watching-added`, suffix)} style={styles.date}>
          <Text {...elementProps(`watching-added-label`, suffix)} style={styles.priceLabel}>{`Date Added`}</Text>
          <Text {...elementProps(`watching-added-date`, suffix)} style={styles.note}>{view.addedDate}</Text>
        </View>
      </View>
      <DomainAnalyticsButton suffix={`watching-${suffix}`} domain={record.domain} />
      <Pressable
        {...elementProps(`watching-remove`, suffix)}
        disabled={busy}
        accessibilityRole={`button`}
        accessibilityState={{ disabled: busy }}
        style={[styles.remove, busy && styles.disabled]}
        accessibilityLabel={`Remove ${record.domain} From Watching`}
        onPress={() => void onRemove(record.id).catch(() => undefined)}
      >
        <Trash2 {...elementProps(`watching-remove-icon`, suffix)} size={14} color={palette.danger} />
        <Text {...elementProps(`watching-remove-text`, suffix)} style={styles.removeText}>{`Remove`}</Text>
      </Pressable>
    </View>
  );
};

export default WatchingRow;
