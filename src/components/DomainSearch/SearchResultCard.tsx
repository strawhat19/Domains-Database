import { Link } from 'expo-router';
import { createStyles } from './styles.native';
import { ArrowUpRight, Globe2 } from 'lucide-react-native';
import { elementProps } from '../../shared/elementProps';
import { Text, View, Platform, Pressable } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';
import { getSearchStatus, getDomainSearchStatus, formatSearchPrice, getPurchaseHref, type SearchResult, type SearchDomainResult } from './resultPresentation';

type SearchStyles = ReturnType<typeof createStyles>;
type ResultCardProps = { suffix: string; styles: SearchStyles; palette: ThemePalette; result: SearchDomainResult };
type ConnectionResultProps = { suffix: string; result: SearchResult; styles: SearchStyles; palette: ThemePalette };

const ConnectionResult = ({ result, palette, styles, suffix }: ConnectionResultProps) => {
  const status = getSearchStatus(result);
  const renewal = formatSearchPrice(result.renewal);
  const registration = formatSearchPrice(result.registration);
  const purchaseHref = getPurchaseHref(result.purchaseUrl);
  const statusColor = status.state === `error` ? palette.danger : status.state === `available` ? palette.success : palette.muted;
  const action = status.state === `available` ? `Buy at ${result.label}` : `View at ${result.label}`;

  return (
    <View {...elementProps(`domain-search-connection`, suffix)} style={styles.connection}>
      <View {...elementProps(`domain-search-connection-heading`, suffix)} style={styles.resultHeading}>
        <View {...elementProps(`domain-search-registrar`, suffix)} style={styles.registrar}>
          <Globe2 {...elementProps(`domain-search-registrar-icon`, suffix)} size={16} color={palette.accent} />
          <Text {...elementProps(`domain-search-registrar-name`, suffix)} style={styles.registrarName}>
            {result.label}
          </Text>
        </View>
        <View {...elementProps(`actionsCell`, `search-${suffix}`)} style={styles.actionsCell}>
          <View {...elementProps(`rowStatus`, `search-${suffix}`)} style={styles.rowStatus}>
            <View {...elementProps(`statusDotWrap`, `search-${suffix}`)} style={styles.statusDotWrap}>
              <View {...elementProps(`statusDot`, `search-${suffix}`)} style={[styles.statusDot, { backgroundColor: statusColor }]} />
            </View>
            <Text {...elementProps(`statusText`, `search-${suffix}`)} style={[styles.statusText, { color: statusColor }]}>
              {status.label}
            </Text>
          </View>
        </View>
      </View>
      <View {...elementProps(`domain-search-result-prices`, suffix)} style={styles.prices}>
        {[{ id: `registration`, label: `Registration`, price: registration }, { id: `renewal`, label: `Renewal`, price: renewal }].map(item => (
          <View key={item.id} {...elementProps(`domain-search-price`, `${suffix}-${item.id}`)} style={styles.price}>
            <Text {...elementProps(`domain-search-price-label`, `${suffix}-${item.id}`)} style={styles.priceLabel}>
              {item.label}
            </Text>
            <Text {...elementProps(`domain-search-price-amount`, `${suffix}-${item.id}`)} style={styles.priceAmount}>
              {item.price.amount}
            </Text>
            {!!item.price.currencyNote && (
              <Text {...elementProps(`domain-search-price-currency-note`, `${suffix}-${item.id}`)} style={styles.currencyNote}>
                {item.price.currencyNote}
              </Text>
            )}
            <Text {...elementProps(`domain-search-price-term`, `${suffix}-${item.id}`)} style={styles.priceTerm}>
              {item.price.term}
            </Text>
          </View>
        ))}
      </View>
      {result.error && (
        <Text {...elementProps(`domain-search-result-error`, suffix)} style={styles.resultError} accessibilityRole={`alert`}>
          {result.error}
        </Text>
      )}
      {result.note && (
        <Text {...elementProps(`domain-search-result-note`, suffix)} style={styles.resultNote}>
          {result.note}
        </Text>
      )}
      {purchaseHref && (
        <Link href={purchaseHref} asChild target={`_blank`} rel={`noopener noreferrer`}>
          <Pressable
            {...elementProps(`domain-search-purchase-link`, suffix)}
            {...(Platform.OS === `web` ? { hrefAttrs: { target: `_blank`, rel: `noopener noreferrer` } } : {})}
            style={styles.purchaseLink}
            accessibilityRole={`link`}
            accessibilityLabel={`${action} — ${Platform.OS === `web` ? `Opens In A New Tab` : `Opens Registrar Website`}`}
          >
            <Text {...elementProps(`domain-search-purchase-text`, suffix)} style={styles.purchaseText}>
              {action}
            </Text>
            <ArrowUpRight {...elementProps(`domain-search-purchase-icon`, suffix)} size={15} color={palette.accent} />
          </Pressable>
        </Link>
      )}
    </View>
  );
};

const SearchResultCard = ({ result, palette, styles, suffix }: ResultCardProps) => {
  const status = getDomainSearchStatus(result);
  const statusColor = status.state === `error` ? palette.danger : status.state === `available` ? palette.success : palette.muted;

  return (
    <View {...elementProps(`domain-search-result`, suffix)} style={styles.resultCard}>
      <View {...elementProps(`domain-search-result-heading`, suffix)} style={styles.resultHeading}>
        <Text {...elementProps(`domain-search-result-domain`, suffix)} style={styles.resultDomain} numberOfLines={1}>
          {result.domain}
        </Text>
        <View {...elementProps(`actionsCell`, `search-${suffix}`)} style={styles.actionsCell}>
          <View {...elementProps(`rowStatus`, `search-${suffix}`)} style={styles.rowStatus}>
            <View {...elementProps(`statusDotWrap`, `search-${suffix}`)} style={styles.statusDotWrap}>
              <View {...elementProps(`statusDot`, `search-${suffix}`)} style={[styles.statusDot, { backgroundColor: statusColor }]} />
            </View>
            <Text {...elementProps(`statusText`, `search-${suffix}`)} style={[styles.statusText, { color: statusColor }]}>
              {status.label}
            </Text>
          </View>
        </View>
      </View>
      <Text {...elementProps(`domain-search-result-summary`, suffix)} style={styles.resultNote}>
        {status.summary}
      </Text>
      <View {...elementProps(`domain-search-result-connections`, suffix)} style={styles.connections}>
        {result.connections.map((connection, index) => (
          <ConnectionResult
            key={`${connection.provider}-${index}`}
            styles={styles}
            palette={palette}
            result={connection}
            suffix={`${suffix}-${connection.provider}-${index}`}
          />
        ))}
      </View>
    </View>
  );
};

export const SearchResultSkeleton = ({ styles, suffix }: { styles: SearchStyles; suffix: string }) => (
  <View {...elementProps(`domain-search-result-skeleton`, suffix)} style={styles.resultCard} accessibilityLabel={`Checking Registrar Availability`}>
    <View {...elementProps(`domain-search-skeleton-heading`, suffix)} style={[styles.skeleton, styles.skeletonHeading]} />
    <View {...elementProps(`domain-search-skeleton-domain`, suffix)} style={[styles.skeleton, styles.skeletonDomain]} />
    <View {...elementProps(`domain-search-skeleton-prices`, suffix)} style={styles.prices}>
      {[`registration`, `renewal`].map(id => (
        <View key={id} {...elementProps(`domain-search-skeleton-price`, `${suffix}-${id}`)} style={styles.price}>
          <View {...elementProps(`domain-search-skeleton-label`, `${suffix}-${id}`)} style={[styles.skeleton, styles.skeletonLabel]} />
          <View {...elementProps(`domain-search-skeleton-amount`, `${suffix}-${id}`)} style={[styles.skeleton, styles.skeletonAmount]} />
        </View>
      ))}
    </View>
    <View {...elementProps(`domain-search-skeleton-link`, suffix)} style={[styles.skeleton, styles.skeletonLink]} />
  </View>
);

export default SearchResultCard;
