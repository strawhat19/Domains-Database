import { Link } from 'expo-router';
import { useMemo } from 'react';
import { createStyles } from './styles.native';
import { Store, Tags } from 'lucide-react-native';
import type { DomainRecord } from '../../shared/types';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { getPortfolioSellHref, useOwnedMarketplaceDomain, usePortfolioMarketplace } from './usePortfolioMarketplace';

export const PortfolioSellLink = ({ id, domain, style, disabled }: { id: string; domain: DomainRecord; style: StyleProp<ViewStyle>; disabled?: boolean }) => {
  const { palette } = useTheme();
  const owned = useOwnedMarketplaceDomain(domain);
  if (!owned || disabled) return null;
  return <Link asChild href={getPortfolioSellHref(domain)}>
    <Pressable {...elementProps(id)} style={StyleSheet.flatten(style)} accessibilityRole={`link`} accessibilityLabel={`List ${domain.name} For Sale`}>
      <Store {...elementProps(`${id}-icon`)} size={15} color={palette.accent} />
    </Pressable>
  </Link>;
};

export const PortfolioMarketplace = ({ id, domain, disabled }: { id: string; domain: DomainRecord; disabled?: boolean }) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const { status, appraisal, priceLabel, transferLabel, estimateLabel, suggestedPriceLabel, showEstimateAction } = usePortfolioMarketplace(domain);
  if (!status && !estimateLabel && !showEstimateAction) return null;
  return <View {...elementProps(id)} style={styles.metadata}>
    {status ? <Text {...elementProps(`${id}-status`)} style={styles.status}>{status}</Text> : null}
    {priceLabel ? <Text {...elementProps(`${id}-price`)} style={styles.value}>{priceLabel}</Text> : null}
    {transferLabel ? <Text {...elementProps(`${id}-fast-transfer`)} style={styles.value}>{transferLabel}</Text> : null}
    {estimateLabel ? <Text {...elementProps(`${id}-estimate`)} style={styles.value}>{estimateLabel}</Text> : null}
    {suggestedPriceLabel ? <Text {...elementProps(`${id}-suggested-price`)} style={styles.value}>{suggestedPriceLabel}</Text> : null}
    {showEstimateAction && <Pressable
      {...elementProps(`${id}-get-estimate`)}
      style={styles.button}
      accessibilityRole={`button`}
      disabled={disabled || appraisal.estimating}
      onPress={() => void appraisal.estimate()}
      accessibilityLabel={`Get GoValue Estimate For ${domain.name}`}
      accessibilityState={{ busy: appraisal.estimating, disabled: disabled || appraisal.estimating }}
    >
      <Tags {...elementProps(`${id}-estimate-icon`)} size={13} color={palette.accent} />
      <Text {...elementProps(`${id}-estimate-label`)} style={styles.buttonText}>{appraisal.estimating ? `Estimating…` : `Get GoValue Estimate`}</Text>
    </Pressable>}
    {showEstimateAction && appraisal.error ? <Text {...elementProps(`${id}-error`)} style={styles.error} accessibilityLiveRegion={`polite`}>{appraisal.error}</Text> : null}
  </View>;
};
