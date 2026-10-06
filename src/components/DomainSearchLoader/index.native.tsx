import { Search } from 'lucide-react-native';
import { Text, View, Animated } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import type { DomainSearchLoaderProps } from './types';
import { elementProps } from '../../shared/elementProps';
import { useDomainSearchLoader } from './useDomainSearchLoader';
import type { createStyles } from './styles.native';

type SkeletonStyles = ReturnType<typeof createStyles>;
type SkeletonBarProps = {
  suffix: string;
  style?: StyleProp<ViewStyle>;
  styles: SkeletonStyles;
};

const SkeletonBar = ({ suffix, style, styles }: SkeletonBarProps) => (
  <View
    {...elementProps(`domain-search-loader-bar`, suffix)}
    style={[styles.bar, style]}
  />
);

const DomainSearchLoader = ({
  results = false,
  sidebar = false,
  availableHeight,
  suffix = results ? `results` : `page`,
}: DomainSearchLoaderProps) => {
  const state = useDomainSearchLoader({ sidebar, availableHeight });
  const { styles } = state;
  const label = results ? `Checking domain availability…` : `Loading domain search…`;

  return (
    <View
      accessible
      onLayout={state.onLayout}
      accessibilityLabel={label}
      accessibilityRole={`progressbar`}
      accessibilityLiveRegion={`polite`}
      accessibilityState={{ busy: true }}
      {...elementProps(`domain-search-loader`, suffix)}
      style={[styles.root, results && styles.resultsPanel]}
    >
      <View
        accessibilityElementsHidden
        style={styles.status}
        importantForAccessibility={`no-hide-descendants`}
        {...elementProps(`domain-search-loader-status`, suffix)}
      >
        <View {...elementProps(`domain-search-loader-status-icon`, suffix)} style={styles.statusIcon}>
          <Search {...elementProps(`domain-search-loader-search-icon`, suffix)} size={14} color={state.palette.accent} />
        </View>
        <Text {...elementProps(`domain-search-loader-label`, suffix)} style={styles.statusLabel}>
          {label}
        </Text>
      </View>
      <Animated.View
        accessibilityElementsHidden
        importantForAccessibility={`no-hide-descendants`}
        {...elementProps(`domain-search-loader-preview`, suffix)}
        style={[
          styles.preview,
          !results && state.wide && styles.widePreview,
          !results && state.wide && state.budget !== undefined && { minHeight: Math.max(0, state.budget - 36) },
          state.skeletonMotion,
        ]}
      >
        {results ? (
          <View {...elementProps(`domain-search-loader-comparisons`, suffix)} style={styles.comparisons}>
            {Array.from({ length: state.resultCount }, (_, index) => (
              <View
                key={index}
                {...elementProps(`domain-search-loader-comparison`, `${suffix}-${index}`)}
                style={[styles.comparison, state.compact && styles.compactComparison]}
              >
                <SkeletonBar suffix={`${suffix}-comparison-title-${index}`} styles={styles} style={styles.comparisonTitle} />
                <View {...elementProps(`domain-search-loader-comparison-rows`, `${suffix}-${index}`)} style={styles.comparisonRows}>
                  {Array.from({ length: state.compact ? 1 : 2 }, (_, registrar) => (
                    <View
                      key={registrar}
                      {...elementProps(`domain-search-loader-comparison-row`, `${suffix}-${index}-${registrar}`)}
                      style={styles.comparisonRow}
                    >
                      <View {...elementProps(`domain-search-loader-registrar-heading`, `${suffix}-${index}-${registrar}`)} style={styles.headingRow}>
                        <SkeletonBar suffix={`${suffix}-registrar-${index}-${registrar}`} styles={styles} style={styles.registrar} />
                        <SkeletonBar suffix={`${suffix}-availability-${index}-${registrar}`} styles={styles} style={styles.availability} />
                      </View>
                      <View {...elementProps(`domain-search-loader-prices`, `${suffix}-${index}-${registrar}`)} style={styles.prices}>
                        {[0, 1].map(price => (
                          <View key={price} {...elementProps(`domain-search-loader-price`, `${suffix}-${index}-${registrar}-${price}`)} style={styles.price}>
                            <SkeletonBar suffix={`${suffix}-price-label-${index}-${registrar}-${price}`} styles={styles} style={styles.priceLabel} />
                            <SkeletonBar suffix={`${suffix}-price-amount-${index}-${registrar}-${price}`} styles={styles} style={styles.priceAmount} />
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
                <SkeletonBar suffix={`${suffix}-comparison-action-${index}`} styles={styles} style={styles.comparisonAction} />
              </View>
            ))}
          </View>
        ) : (
          <>
            <View
              {...elementProps(`domain-search-loader-controls`, suffix)}
              style={[styles.controls, state.wide && styles.wideControls]}
            >
              {(state.showIntro || state.showRecents) && (
                <View
                  {...elementProps(`domain-search-loader-intro-row`, suffix)}
                  style={[styles.introRow, state.wide && styles.wideIntroRow]}
                >
                  {state.showIntro && (
                    <View
                      {...elementProps(`domain-search-loader-intro`, suffix)}
                      style={[styles.intro, state.wide && styles.wideIntro, state.compact && styles.compactIntro]}
                    >
                      <SkeletonBar suffix={`${suffix}-eyebrow`} styles={styles} style={styles.eyebrow} />
                      <SkeletonBar suffix={`${suffix}-title`} styles={styles} style={[styles.title, state.compact && styles.compactTitle]} />
                      <SkeletonBar suffix={`${suffix}-description`} styles={styles} style={styles.description} />
                      {!state.compact && <SkeletonBar suffix={`${suffix}-short-description`} styles={styles} style={styles.shortDescription} />}
                    </View>
                  )}
                  {state.showRecents && (
                    <View
                      {...elementProps(`domain-search-loader-recents`, suffix)}
                      style={[styles.recents, state.wide && styles.wideRecents]}
                    >
                      <View {...elementProps(`domain-search-loader-recents-heading`, suffix)} style={styles.headingRow}>
                        <SkeletonBar suffix={`${suffix}-recents-label`} styles={styles} style={styles.recentLabel} />
                        <SkeletonBar suffix={`${suffix}-recents-action`} styles={styles} style={styles.recentAction} />
                      </View>
                      {[0, 1].map(row => (
                        <View key={row} {...elementProps(`domain-search-loader-recents-row`, `${suffix}-${row}`)} style={styles.recentRow}>
                          {[0, 1].map(pill => (
                            <SkeletonBar
                              key={pill}
                              styles={styles}
                              suffix={`${suffix}-recent-${row}-${pill}`}
                              style={[styles.recentPill, row === pill && styles.shortRecentPill]}
                            />
                          ))}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
              <View
                {...elementProps(`domain-search-loader-form`, suffix)}
                style={[styles.form, state.compact && styles.compactForm]}
              >
                <View {...elementProps(`domain-search-loader-form-heading`, suffix)} style={styles.headingRow}>
                  <SkeletonBar suffix={`${suffix}-form-label`} styles={styles} style={styles.formLabel} />
                  <SkeletonBar suffix={`${suffix}-form-status`} styles={styles} style={styles.formStatus} />
                </View>
                <View {...elementProps(`domain-search-loader-form-row`, suffix)} style={styles.formRow}>
                  <SkeletonBar suffix={`${suffix}-input`} styles={styles} style={[styles.input, state.compact && styles.compactInput]} />
                  <SkeletonBar suffix={`${suffix}-submit`} styles={styles} style={[styles.submit, state.compact && styles.compactSubmit]} />
                </View>
                <View {...elementProps(`domain-search-loader-form-footer`, suffix)} style={styles.headingRow}>
                  <SkeletonBar suffix={`${suffix}-form-hint`} styles={styles} style={styles.formHint} />
                  <SkeletonBar suffix={`${suffix}-form-link`} styles={styles} style={styles.formLink} />
                </View>
              </View>
              {state.showShelf && (
                <View {...elementProps(`domain-search-loader-shelf`, suffix)} style={styles.shelf}>
                  <View {...elementProps(`domain-search-loader-shelf-heading`, suffix)} style={styles.headingRow}>
                    <SkeletonBar suffix={`${suffix}-shelf-title`} styles={styles} style={styles.shelfTitle} />
                    <SkeletonBar suffix={`${suffix}-shelf-action`} styles={styles} style={styles.shelfAction} />
                  </View>
                  <View {...elementProps(`domain-search-loader-filters`, suffix)} style={styles.filters}>
                    {[0, 1, 2, 3].map(index => (
                      <SkeletonBar key={index} suffix={`${suffix}-filter-${index}`} styles={styles} style={styles.filter} />
                    ))}
                  </View>
                  <View {...elementProps(`domain-search-loader-pill-rows`, suffix)} style={styles.pillRows}>
                    {Array.from({ length: state.rowCount }, (_, row) => (
                      <View
                        key={row}
                        {...elementProps(`domain-search-loader-pill-row`, `${suffix}-${row}`)}
                        style={[styles.pillRow, row % 2 === 1 && styles.offsetRow]}
                      >
                        {Array.from({ length: state.pillCount }, (_, index) => (
                          <View key={index} {...elementProps(`domain-search-loader-pill`, `${suffix}-${row}-${index}`)} style={styles.pill}>
                            <SkeletonBar suffix={`${suffix}-pill-dot-${row}-${index}`} styles={styles} style={styles.pillDot} />
                            <SkeletonBar suffix={`${suffix}-pill-name-${row}-${index}`} styles={styles} style={styles.pillName} />
                            <SkeletonBar suffix={`${suffix}-pill-price-${row}-${index}`} styles={styles} style={styles.pillPrice} />
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
            {state.wide && (
              <View {...elementProps(`domain-search-loader-sidebar`, suffix)} style={styles.sidebar}>
                <View {...elementProps(`domain-search-loader-sidebar-heading`, suffix)} style={styles.headingRow}>
                  <SkeletonBar suffix={`${suffix}-sidebar-title`} styles={styles} style={styles.sidebarTitle} />
                  <SkeletonBar suffix={`${suffix}-sidebar-count`} styles={styles} style={styles.sidebarCount} />
                </View>
                <View {...elementProps(`domain-search-loader-sidebar-filters`, suffix)} style={styles.sidebarFilters}>
                  {[0, 1, 2].map(index => (
                    <SkeletonBar key={index} suffix={`${suffix}-sidebar-filter-${index}`} styles={styles} style={styles.sidebarFilter} />
                  ))}
                </View>
                <SkeletonBar suffix={`${suffix}-sidebar-description`} styles={styles} style={styles.sidebarDescription} />
                <View {...elementProps(`domain-search-loader-sidebar-cards`, suffix)} style={styles.sidebarCards}>
                  {Array.from({ length: state.sidebarCount }, (_, index) => (
                    <View key={index} {...elementProps(`domain-search-loader-sidebar-card`, `${suffix}-${index}`)} style={styles.sidebarCard}>
                      <View {...elementProps(`domain-search-loader-sidebar-card-heading`, `${suffix}-${index}`)} style={styles.headingRow}>
                        <SkeletonBar suffix={`${suffix}-card-name-${index}`} styles={styles} style={styles.cardName} />
                        <SkeletonBar suffix={`${suffix}-card-badge-${index}`} styles={styles} style={styles.cardBadge} />
                      </View>
                      <View {...elementProps(`domain-search-loader-sidebar-card-footer`, `${suffix}-${index}`)} style={styles.headingRow}>
                        <SkeletonBar suffix={`${suffix}-card-price-${index}`} styles={styles} style={styles.cardPrice} />
                        <SkeletonBar suffix={`${suffix}-card-registrar-${index}`} styles={styles} style={styles.cardRegistrar} />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </Animated.View>
    </View>
  );
};

export default DomainSearchLoader;
