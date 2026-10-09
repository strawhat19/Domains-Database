import WatchButton from '../WatchButton';
import { Platform, Pressable, Text, View } from 'react-native';
import type { createStyles } from './styles.native';
import type { DiscoveryCardDensity } from './useDiscoveryShelf';
import { elementProps } from '../../shared/elementProps';
import { discoveryIcons, getDiscoveryStatusTone } from './presentation';
import type { ThemePalette } from '../../shared/themeContext/theme';
import { discoveryStatuses } from '../../shared/domainSearch/discovery';
import type { DomainDiscoveryResult, DomainDiscoveryStatus } from '../../shared/domainSearch/discovery';
import { formatSearchPrice, getAvailableConnections, getSearchPriceOrder, type SearchResult } from '../DomainSearch/resultPresentation';

interface DiscoveryCardProps {
  suffix: string;
  sidebar?: boolean;
  fillShelf?: boolean;
  disabled: boolean;
  palette: ThemePalette;
  density?: DiscoveryCardDensity;
  result: DomainDiscoveryResult;
  hiddenFromAccessibility?: boolean;
  onWatchPromptChange?: (open: boolean) => void;
  styles: ReturnType<typeof createStyles>;
  onSearch: (domain: string) => void;
}

interface DiscoveryBadgeProps {
  small?: boolean;
  suffix: string;
  iconOnly?: boolean;
  palette: ThemePalette;
  status: DomainDiscoveryStatus;
  styles: ReturnType<typeof createStyles>;
}

const DiscoveryBadge = ({ status, styles, suffix, palette, small = false, iconOnly = false }: DiscoveryBadgeProps) => {
  const definition = discoveryStatuses.find(value => value.id === status);
  if (!definition) return null;
  const Icon = discoveryIcons[status];
  const tone = getDiscoveryStatusTone(status, palette);
  const badgeSuffix = `${suffix}-${status}`;

  return (
    <View
      {...elementProps(`domain-discovery-badge`, badgeSuffix)}
      accessibilityLabel={`${definition.label}: ${definition.description}`}
      style={[styles.badge, small && styles.compactBadge, iconOnly && styles.pillBadge, { borderColor: tone.color, backgroundColor: tone.backgroundColor }]}
    >
      <Icon {...elementProps(`domain-discovery-badge-icon`, badgeSuffix)} size={12} color={tone.color} />
      {!iconOnly && (
        <Text {...elementProps(`domain-discovery-badge-label`, badgeSuffix)} style={[styles.badgeLabel, small && styles.compactBadgeLabel, { color: tone.color }]}>
          {definition.label}
        </Text>
      )}
    </View>
  );
};

const AvailabilityStatus = ({ styles, suffix, providerLabel, showLabel = true }: {
  suffix: string;
  showLabel?: boolean;
  providerLabel: string;
  styles: ReturnType<typeof createStyles>;
}) => (
  <View {...elementProps(`actionsCell`, `discovery-${suffix}`)} style={styles.actionsCell} accessibilityLabel={`Available at ${providerLabel}`}>
    <View {...elementProps(`rowStatus`, `discovery-${suffix}`)} style={styles.rowStatus}>
      <View {...elementProps(`statusDotWrap`, `discovery-${suffix}`)} style={styles.statusDotWrap}>
        <View {...elementProps(`statusDot`, `discovery-${suffix}`)} style={styles.statusDot} />
      </View>
      {showLabel && (
        <Text numberOfLines={1} {...elementProps(`statusText`, `discovery-${suffix}`)} style={styles.statusText}>
          {providerLabel}
        </Text>
      )}
    </View>
  </View>
);

const formatDiscoveryQuote = (quote: SearchResult[`registration`]) => {
  const price = formatSearchPrice(quote);
  const years = quote?.years;
  const term = years && Number.isInteger(years) && years > 0 ? `/${years}y` : `/?y`;
  return {
    text: price.amount === `—` ? `—` : `${price.amount}${term}${price.currencyNote ? ` ?` : ``}`,
    description: price.amount === `—` ? `Price Not Provided` : `${price.amount}, ${price.term}${price.currencyNote ? `, ${price.currencyNote}` : ``}`,
  };
};

const DiscoveryCard = ({ result, styles, suffix, palette, disabled, onSearch, onWatchPromptChange, sidebar = false, fillShelf = false, density = `full`, hiddenFromAccessibility = false }: DiscoveryCardProps) => {
  const connections = getAvailableConnections(result);
  const connection = connections?.[0];
  if (!connection) return null;
  const price = formatDiscoveryQuote(connection.registration);
  const priceOrder = getSearchPriceOrder(connections);
  const currency = connection.registration?.currency?.toUpperCase();
  const comparable = connections.length > 1 && Boolean(currency) && connections.every(value => (
    value.registration && Number.isFinite(value.registration.amount) && value.registration.amount >= 0
      && /^[a-z]{3}$/i.test(value.registration.currency) && value.registration.currency.toUpperCase() === currency
  ));
  const platformCount = `${connections.length} ${connections.length === 1 ? `Platform` : `Platforms`}`;
  const quoteSummary = connections.map(value => (
    `${value.label}, Registration ${formatDiscoveryQuote(value.registration).description}, Renewal ${formatDiscoveryQuote(value.renewal).description}`
  )).join(`; `);
  const missingCurrency = connections.some(value => [value.registration, value.renewal].some(quote => quote && !quote.currency));
  const missingTerm = connections.some(value => [value.registration, value.renewal].some(quote => quote && (!quote.years || !Number.isInteger(quote.years) || quote.years < 1)));
  const statusDefinitions = discoveryStatuses.filter(value => result.statuses.includes(value.id));
  const category = result.statuses.find(status => status === `hot` || status === `trending` || status === `new`);
  const concisePrice = price.text === `—` ? `At registrar` : `${comparable ? `From ` : ``}${price.text}`;

  return (
    <View
      {...elementProps(`domain-discovery-card`, suffix)}
      style={[styles.card, sidebar && styles.sidebarCard, density === `full` && styles.fullCard, density === `compact` && styles.compactCard, density === `pill` && styles.pillCard, fillShelf && styles.filledSidebarCard, disabled && styles.faded]}
    >
      <Pressable
        disabled={disabled}
        accessible={!hiddenFromAccessibility}
        focusable={!hiddenFromAccessibility}
        accessibilityRole={`button`}
        accessibilityState={{ disabled }}
        onPress={() => onSearch(result.domain)}
        {...elementProps(`domain-discovery-compare`, suffix)}
        {...(Platform.OS === `web` && hiddenFromAccessibility ? { tabIndex: -1 as const } : {})}
        style={({ pressed }) => [styles.compareControl, pressed && styles.comparePressed]}
        accessibilityHint={`Opens Full Registration And Renewal Comparison. ${priceOrder}. ${statusDefinitions.map(value => `${value.label}: ${value.description}`).join(`. `)}`}
        accessibilityLabel={`Compare ${result.domain}, ${platformCount} Available: ${quoteSummary}`}
      />
      <View
        accessibilityElementsHidden
        importantForAccessibility={`no-hide-descendants`}
        {...elementProps(`domain-discovery-card-content`, suffix)}
        style={[styles.cardContent, sidebar && styles.sidebarContent, density === `full` && styles.fullContent, density === `compact` && styles.compactContent, density === `pill` && styles.pillContent, { pointerEvents: `none` }]}
      >
        {density === `pill` && (
          <>
            <AvailabilityStatus styles={styles} suffix={suffix} showLabel={false} providerLabel={connection.label} />
            <Text numberOfLines={1} {...elementProps(`domain-discovery-domain`, suffix)} style={[styles.domain, styles.pillDomain]}>
              {result.domain}
            </Text>
            {!!category && <DiscoveryBadge small iconOnly status={category} styles={styles} suffix={suffix} palette={palette} />}
            <Text numberOfLines={1} {...elementProps(`domain-discovery-price-amount`, suffix)} style={[styles.priceAmount, styles.pillPriceAmount]}>
              {concisePrice}
            </Text>
            {connections.length > 1 && <Text {...elementProps(`domain-discovery-platform-count`, suffix)} style={styles.platformCount}>{`+${connections.length - 1}`}</Text>}
          </>
        )}
        {density !== `pill` && (
          <View {...elementProps(`domain-discovery-card-heading`, suffix)} style={[styles.cardHeading, density === `full` ? styles.watchHeading : styles.compactWatchHeading]}>
            <Text
              numberOfLines={1}
              style={[styles.domain, density === `full` && styles.fullDomain, density === `compact` && styles.compactDomain]}
              {...elementProps(`domain-discovery-domain`, suffix)}
            >
              {result.domain}
            </Text>
          </View>
        )}
        {density === `compact` && (
          <>
            <View {...elementProps(`domain-discovery-compact-meta`, suffix)} style={styles.compactMeta}>
              {!!category && <DiscoveryBadge small status={category} styles={styles} suffix={suffix} palette={palette} />}
              <AvailabilityStatus styles={styles} suffix={suffix} providerLabel={connection.label} />
            </View>
            <View {...elementProps(`domain-discovery-price`, suffix)} style={styles.compactPriceRow}>
              <Text numberOfLines={1} {...elementProps(`domain-discovery-price-amount`, suffix)} style={[styles.priceAmount, styles.compactPriceAmount]}>
                {concisePrice}
              </Text>
              <Text {...elementProps(`domain-discovery-platform-count`, suffix)} style={styles.platformCount}>{`Compare ${platformCount}`}</Text>
            </View>
          </>
        )}
        {density === `full` && (
          <>
            <View {...elementProps(`domain-discovery-badges`, suffix)} style={styles.badges}>
              {result.statuses.map(status => (
                <DiscoveryBadge small key={status} status={status} styles={styles} suffix={suffix} palette={palette} />
              ))}
            </View>
            <View {...elementProps(`domain-discovery-platforms`, suffix)} style={styles.platforms}>
              <Text numberOfLines={1} {...elementProps(`domain-discovery-price-order`, suffix)} style={styles.detail}>
                {`${platformCount} · ${priceOrder.startsWith(`Grouped by currency`) ? `By Currency & Quote` : `Quote Low To High`}`}
              </Text>
              <View {...elementProps(`domain-discovery-platform-heading`, suffix)} style={styles.platformRow}>
                <Text {...elementProps(`domain-discovery-platform-label`, suffix)} style={[styles.platformLabel, styles.detail]}>{`Platform`}</Text>
                <Text {...elementProps(`domain-discovery-registration-label`, suffix)} style={[styles.platformPrice, styles.detail]}>{`Registration`}</Text>
                <Text {...elementProps(`domain-discovery-renewal-label`, suffix)} style={[styles.platformPrice, styles.detail]}>{`Renewal`}</Text>
              </View>
              {connections.map((value, index) => {
                const quoteSuffix = `${suffix}-${value.provider}-${index}`;
                return (
                  <View key={`${value.provider}-${index}`} {...elementProps(`domain-discovery-platform`, quoteSuffix)} style={styles.platformRow}>
                    <Text numberOfLines={1} {...elementProps(`domain-discovery-platform-name`, quoteSuffix)} style={styles.platformLabel}>{value.label}</Text>
                    <Text {...elementProps(`domain-discovery-registration-quote`, quoteSuffix)} style={styles.platformPrice}>{formatDiscoveryQuote(value.registration).text}</Text>
                    <Text {...elementProps(`domain-discovery-renewal-quote`, quoteSuffix)} style={styles.platformPrice}>{formatDiscoveryQuote(value.renewal).text}</Text>
                  </View>
                );
              })}
              <Text {...elementProps(`domain-discovery-comparison-note`, suffix)} style={styles.detail}>
                {missingCurrency || missingTerm ? `? ${missingCurrency && missingTerm ? `Currency or term` : missingCurrency ? `Currency` : `Term`} not supplied · Open comparison` : `Open Full Comparison`}
              </Text>
            </View>
          </>
        )}
      </View>
      <View
        {...elementProps(`domain-discovery-watch-action`, suffix)}
        style={[styles.watchAction, density !== `full` && styles.compactWatchAction, density === `pill` && styles.pillWatchAction]}
      >
        <WatchButton
          compact
          result={result}
          disabled={disabled}
          suffix={`discovery-${suffix}`}
          iconOnly={density !== `full`}
          onPromptChange={onWatchPromptChange}
          hiddenFromAccessibility={hiddenFromAccessibility}
        />
      </View>
    </View>
  );
};

export default DiscoveryCard;
