import WatchButton from '../WatchButton';
import { Platform, Pressable, Text, View } from 'react-native';
import type { createStyles } from './styles.native';
import type { DiscoveryCardDensity } from './useDiscoveryShelf';
import { elementProps } from '../../shared/elementProps';
import { discoveryIcons, getDiscoveryStatusTone } from './presentation';
import type { ThemePalette } from '../../shared/themeContext/theme';
import { discoveryStatuses, isValueRegistration } from '../../shared/domainSearch/discovery';
import { formatSearchPrice, getAvailableConnections } from '../DomainSearch/resultPresentation';
import type { DomainDiscoveryResult, DomainDiscoveryStatus } from '../../shared/domainSearch/discovery';

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

const DiscoveryCard = ({ result, styles, suffix, palette, disabled, onSearch, onWatchPromptChange, sidebar = false, fillShelf = false, density = `full`, hiddenFromAccessibility = false }: DiscoveryCardProps) => {
  const connections = getAvailableConnections(result);
  const valueConnection = result.statuses.includes(`value`)
    ? connections.find(value => isValueRegistration(value.registration))
    : undefined;
  const connection = valueConnection ?? connections.find(value => value.registration) ?? connections[0];
  if (!connection) return null;
  const price = formatSearchPrice(connection.registration);
  const statusDefinitions = discoveryStatuses.filter(value => result.statuses.includes(value.id));
  const category = result.statuses.find(status => status === `hot` || status === `trending` || status === `new`);
  const years = connection.registration?.years;
  const term = years && Number.isInteger(years) && years > 0 ? `${years}y` : ``;
  const concisePrice = connection.registration ? `${price.amount}${term ? ` · ${term}` : ``}` : `At registrar`;

  return (
    <View
      {...elementProps(`domain-discovery-card`, suffix)}
      style={[styles.card, sidebar && styles.sidebarCard, density === `compact` && styles.compactCard, density === `pill` && styles.pillCard, fillShelf && styles.filledSidebarCard, disabled && styles.faded]}
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
        accessibilityHint={statusDefinitions.map(value => `${value.label}: ${value.description}`).join(`. `)}
        accessibilityLabel={`Compare ${result.domain}, ${statusDefinitions.map(value => value.label).join(`, `)}, Available At ${connection.label}, Registration ${connection.registration ? `${price.amount}, ${price.term}${price.currencyNote ? `, ${price.currencyNote}` : ``}` : `Price At Registrar`}`}
      />
      <View
        accessibilityElementsHidden
        importantForAccessibility={`no-hide-descendants`}
        {...elementProps(`domain-discovery-card-content`, suffix)}
        style={[styles.cardContent, sidebar && styles.sidebarContent, density === `compact` && styles.compactContent, density === `pill` && styles.pillContent, { pointerEvents: `none` }]}
      >
        {density === `pill` && (
          <>
            <AvailabilityStatus styles={styles} suffix={suffix} showLabel={false} providerLabel={connection.label} />
            <Text numberOfLines={1} {...elementProps(`domain-discovery-domain`, suffix)} style={[styles.domain, styles.pillDomain]}>
              {result.domain}
            </Text>
            {!!category && <DiscoveryBadge small iconOnly status={category} styles={styles} suffix={suffix} palette={palette} />}
            <Text numberOfLines={1} {...elementProps(`domain-discovery-price-amount`, suffix)} style={[styles.priceAmount, styles.pillPriceAmount]}>
              {connection.registration ? price.amount : `At registrar`}
            </Text>
          </>
        )}
        {density !== `pill` && (
          <View {...elementProps(`domain-discovery-card-heading`, suffix)} style={[styles.cardHeading, density === `full` ? styles.watchHeading : styles.compactWatchHeading]}>
            <Text
              numberOfLines={1}
              style={[styles.domain, density === `compact` && styles.compactDomain]}
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
            </View>
          </>
        )}
        {density === `full` && (
          <>
            <View {...elementProps(`domain-discovery-badges`, suffix)} style={styles.badges}>
              {result.statuses.map(status => (
                <DiscoveryBadge key={status} status={status} styles={styles} suffix={suffix} palette={palette} />
              ))}
            </View>
            <AvailabilityStatus styles={styles} suffix={suffix} providerLabel={connection.label} />
            <View {...elementProps(`domain-discovery-price`, suffix)} style={styles.price}>
              <Text {...elementProps(`domain-discovery-price-label`, suffix)} style={styles.detail}>
                {`Registration`}
              </Text>
              <Text
                style={styles.priceAmount}
                {...elementProps(`domain-discovery-price-amount`, suffix)}
              >
                {connection.registration ? price.amount : `Price at registrar`}
              </Text>
              {!!connection.registration && (
                <Text {...elementProps(`domain-discovery-price-term`, suffix)} style={styles.detail}>
                  {`${price.term}${price.currencyNote ? ` · ${price.currencyNote}` : ``}`}
                </Text>
              )}
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
