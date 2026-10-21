import { useMemo, useState, useEffect } from 'react';
import Svg, { Line, Path } from 'react-native-svg';
import { createStyles } from './styles.native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { Text, View, Pressable, TextInput, ScrollView } from 'react-native';
import { MARKET_COUNTRIES } from '../../shared/domainMarket/values';
import { Search, Link2, TrendingUp, ChevronDown, ChevronUp, ArrowUpRight } from 'lucide-react-native';
import { useDomainMarketInsights, formatMarketDate, formatMarketPointDate, type DomainMarketInsightsProps } from './useDomainMarketInsights';

const DomainMarketInsights = ({ domain, suffix }: DomainMarketInsightsProps) => {
  const { palette } = useTheme();
  const state = useDomainMarketInsights(domain, suffix);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const id = state.scope;
  const ratingResult = state.rating.result;
  const searchResult = state.search.result;
  const [showPoints, setShowPoints] = useState(false);
  useEffect(() => { setShowPoints(false); }, [domain, state.keyword, state.country]);

  return (
    <View {...elementProps(`domain-market`, id)} style={styles.root}>
      <View {...elementProps(`domain-market-heading`, id)} style={styles.row}>
        <TrendingUp {...elementProps(`domain-market-title-icon`, id)} size={16} color={palette.accent} accessible={false} />
        <Text {...elementProps(`domain-market-title`, id)} style={styles.title} accessibilityRole={`header`}>{`Market & Search Interest`}</Text>
      </View>
      <Text {...elementProps(`domain-market-description`, id)} style={styles.note}>{`Free provider lookups run only when you request them. Recent results are reused to conserve the free allowance.`}</Text>
      <View {...elementProps(`domain-market-rating`, id)} style={styles.panel}>
        <View {...elementProps(`domain-market-rating-heading`, id)} style={styles.row}>
          <Text {...elementProps(`domain-market-rating-title`, id)} style={styles.subtitle} accessibilityRole={`header`}>{`Backlink Strength`}</Text>
          <Pressable
            disabled={state.rating.loading}
            accessibilityRole={`button`}
            onPress={() => void state.loadRating()}
            accessibilityState={{ busy: state.rating.loading, disabled: state.rating.loading }}
            {...elementProps(`domain-market-rating-load`, id)}
            style={[styles.button, state.rating.loading && styles.disabled]}
          >
            <Link2 {...elementProps(`domain-market-rating-load-icon`, id)} size={14} color={palette.accent} accessible={false} />
            <Text {...elementProps(`domain-market-rating-load-label`, id)} style={styles.buttonText}>{state.rating.loading ? `Loading Domain Rating…` : `Load Domain Rating`}</Text>
          </Pressable>
        </View>
        {ratingResult?.status === `ready` && typeof ratingResult.rating === `number` && (
          <View {...elementProps(`domain-market-rating-result`, id)} style={styles.row}>
            <Text {...elementProps(`domain-market-rating-value`, id)} style={styles.score}>{`${ratingResult.rating} / 100`}</Text>
            <Pressable
              accessibilityRole={`link`}
              {...elementProps(`domain-market-rating-attribution`, id)}
              onPress={() => void state.openLink(`https://ahrefs.com/`)}
              accessibilityLabel={`Domain Rating by Ahrefs, Opens In Browser`}
            >
              <Text {...elementProps(`domain-market-rating-attribution-label`, id)} style={styles.link}>{`Domain Rating by Ahrefs`}</Text>
            </Pressable>
          </View>
        )}
        {!ratingResult && !state.rating.loading && !state.rating.notice && !state.rating.error && <Text {...elementProps(`domain-market-rating-empty`, id)} style={styles.note}>{`Load a score for this domain when you need it.`}</Text>}
        {!!state.rating.error && <Text {...elementProps(`domain-market-rating-error`, id)} style={styles.error} accessibilityRole={`alert`}>{state.rating.error}</Text>}
        {!!state.ratingNotice && <Text {...elementProps(`domain-market-rating-notice`, id)} style={styles.warning} accessibilityLiveRegion={`polite`}>{state.ratingNotice}</Text>}
        <Text {...elementProps(`domain-market-rating-note`, id)} style={styles.note}>{`Domain Rating is Ahrefs’ logarithmic backlink-strength score. It does not measure visitor traffic or search demand.`}</Text>
        {ratingResult && <Text {...elementProps(`domain-market-rating-date`, id)} style={styles.note}>{`Source: ${ratingResult.source} · Checked ${formatMarketDate(ratingResult.checkedAt)}${ratingResult.expiresAt ? ` · Cached until ${formatMarketDate(ratingResult.expiresAt)}` : ``}`}</Text>}
      </View>
      <View {...elementProps(`domain-market-search`, id)} style={styles.panel}>
        <Text {...elementProps(`domain-market-search-title`, id)} style={styles.subtitle} accessibilityRole={`header`}>{`Search Interest · Past 12 Months`}</Text>
        <Text {...elementProps(`domain-market-keyword-note`, id)} style={styles.note}>{`Choose the phrase people would search for. A domain name may need spaces or a different phrase.`}</Text>
        <View {...elementProps(`domain-market-keyword-field`, id)} style={styles.field}>
          <Text {...elementProps(`domain-market-keyword-label`, id)} style={styles.label}>{`Search Phrase`}</Text>
          <TextInput
            maxLength={80}
            autoCorrect={false}
            autoCapitalize={`none`}
            style={styles.input}
            value={state.keywordValue}
            accessibilityLabel={`Search Phrase`}
            onChangeText={state.setKeyword}
            {...elementProps(`domain-market-keyword`, id)}
            placeholderTextColor={palette.placeholder}
          />
          {!!state.keywordError && <Text {...elementProps(`domain-market-keyword-error`, id)} style={styles.warning}>{state.keywordError}</Text>}
        </View>
        <View {...elementProps(`domain-market-country-field`, id)} style={styles.field}>
          <Text {...elementProps(`domain-market-country-label`, id)} style={styles.label}>{`Location`}</Text>
          <View {...elementProps(`domain-market-countries`, id)} style={styles.actions} accessibilityRole={`radiogroup`}>
            {MARKET_COUNTRIES.map(country => (
              <Pressable
                key={country.value}
                accessibilityRole={`radio`}
                accessibilityLabel={country.label}
                onPress={() => state.setCountry(country.value)}
                accessibilityState={{ checked: state.country === country.value }}
                {...elementProps(`domain-market-country`, `${id}-${country.value || `worldwide`}`)}
                style={[styles.country, state.country === country.value && styles.selectedCountry]}
              >
                <Text {...elementProps(`domain-market-country-label`, `${id}-${country.value || `worldwide`}`)} style={[styles.countryText, state.country === country.value && styles.selectedCountryText]}>{country.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View {...elementProps(`domain-market-search-actions`, id)} style={styles.actions}>
          <Pressable
            accessibilityRole={`button`}
            onPress={() => void state.loadSearch()}
            disabled={state.search.loading || !!state.keywordError}
            {...elementProps(`domain-market-search-load`, id)}
            style={[styles.button, (state.search.loading || !!state.keywordError) && styles.disabled]}
            accessibilityState={{ busy: state.search.loading, disabled: state.search.loading || !!state.keywordError }}
          >
            <Search {...elementProps(`domain-market-search-load-icon`, id)} size={14} color={palette.accent} accessible={false} />
            <Text {...elementProps(`domain-market-search-load-label`, id)} style={styles.buttonText}>{state.search.loading ? `Analyzing Search Interest…` : `Analyze Search Interest`}</Text>
          </Pressable>
          <Pressable
            disabled={!!state.keywordError}
            accessibilityRole={`link`}
            accessibilityState={{ disabled: !!state.keywordError }}
            {...elementProps(`domain-market-trends-link`, id)}
            style={[styles.button, !!state.keywordError && styles.disabled]}
            onPress={() => void state.openLink(state.trendsUrl)}
            accessibilityLabel={`Open Google Trends In Browser`}
          >
            <Text {...elementProps(`domain-market-trends-label`, id)} style={styles.buttonText}>{`Open Google Trends`}</Text>
            <ArrowUpRight {...elementProps(`domain-market-trends-icon`, id)} size={14} color={palette.accent} accessible={false} />
          </Pressable>
        </View>
        {state.hasChart && (
          <View {...elementProps(`domain-market-chart`, id)} style={styles.chart}>
            <Text {...elementProps(`domain-market-chart-caption`, id)} style={styles.label}>{`Latest Interest: ${state.latest?.value} / 100 · ${state.countryLabel}`}</Text>
            <Svg
              accessible
              height={112}
              width={`100%`}
              viewBox={`0 0 360 112`}
              accessibilityRole={`image`}
              accessibilityLabel={state.chartSummary}
              {...elementProps(`domain-market-chart-svg`, id)}
            >
              {[0, 50, 100].map(value => <Line key={value} {...elementProps(`domain-market-chart-grid`, `${id}-${value}`)} x1={12} x2={348} y1={100 - value * .84} y2={100 - value * .84} stroke={palette.line} strokeDasharray={`4 5`} />)}
              <Path {...elementProps(`domain-market-chart-line`, id)} d={state.chartPath} fill={`none`} strokeWidth={2.5} stroke={palette.accent} strokeLinecap={`round`} strokeLinejoin={`round`} />
            </Svg>
            <View {...elementProps(`domain-market-chart-dates`, id)} style={styles.chartDates}>
              <Text {...elementProps(`domain-market-chart-first`, id)} style={styles.note}>{state.firstDate}</Text>
              <Text {...elementProps(`domain-market-chart-last`, id)} style={styles.note}>{state.latestDate}</Text>
            </View>
            <Pressable
              accessibilityRole={`button`}
              onPress={() => setShowPoints(!showPoints)}
              accessibilityState={{ expanded: showPoints }}
              {...elementProps(`domain-market-data-toggle`, id)}
              style={styles.dataToggle}
            >
              {showPoints ? <ChevronUp {...elementProps(`domain-market-data-toggle-icon`, id)} size={13} color={palette.accent} accessible={false} /> : <ChevronDown {...elementProps(`domain-market-data-toggle-icon`, id)} size={13} color={palette.accent} accessible={false} />}
              <Text {...elementProps(`domain-market-data-toggle-label`, id)} style={styles.buttonText}>{showPoints ? `Hide Interest Data` : `View Interest Data`}</Text>
            </Pressable>
            {showPoints && (
              <View {...elementProps(`domain-market-data`, id)} style={styles.field}>
                <Text {...elementProps(`domain-market-data-caption`, id)} style={styles.note}>{`Relative Search Interest · 0–100`}</Text>
                <View {...elementProps(`domain-market-data-head`, id)} style={styles.dataRow}>
                  <Text {...elementProps(`domain-market-data-date-heading`, id)} style={styles.label}>{`Date`}</Text>
                  <Text {...elementProps(`domain-market-data-value-heading`, id)} style={styles.label}>{`Interest`}</Text>
                </View>
                <ScrollView nestedScrollEnabled {...elementProps(`domain-market-data-scroll`, id)} style={styles.dataScroll} accessibilityLabel={`Search Interest Data`}>
                  {state.points.map((point, index) => (
                    <View {...elementProps(`domain-market-data-row`, `${id}-${index}`)} style={styles.dataRow} key={`${point.timestamp}-${index}`} accessible accessibilityLabel={`${formatMarketPointDate(point.timestamp)}, interest ${point.value} of 100`}>
                      <Text {...elementProps(`domain-market-data-date`, `${id}-${index}`)} style={styles.note}>{formatMarketPointDate(point.timestamp)}</Text>
                      <Text {...elementProps(`domain-market-data-value`, `${id}-${index}`)} style={styles.note}>{point.value}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}
        {!!state.search.error && <Text {...elementProps(`domain-market-search-error`, id)} style={styles.error} accessibilityRole={`alert`}>{state.search.error}</Text>}
        {!!state.searchNotice && <Text {...elementProps(`domain-market-search-notice`, id)} style={styles.warning} accessibilityLiveRegion={`polite`}>{state.searchNotice}</Text>}
        <Text {...elementProps(`domain-market-search-note`, id)} style={styles.note}>{`Google Trends scores show relative interest from 0–100. Each query is scaled independently; scores are not visits or monthly search counts. The Google Trends link works without a provider connection.`}</Text>
        {searchResult && <Text {...elementProps(`domain-market-search-date`, id)} style={styles.note}>{`Source: ${searchResult.source} · Checked ${formatMarketDate(searchResult.checkedAt)}${searchResult.expiresAt ? ` · Cached until ${formatMarketDate(searchResult.expiresAt)}` : ``}`}</Text>}
      </View>
      {!!state.linkError && <Text {...elementProps(`domain-market-link-error`, id)} style={styles.error} accessibilityRole={`alert`}>{state.linkError}</Text>}
    </View>
  );
};

export default DomainMarketInsights;
