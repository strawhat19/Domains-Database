import { Link } from 'expo-router';
import { useMemo } from 'react';
import { createStyles } from './styles.native';
import { useDomainParking } from './useDomainParking';
import type { DomainRecord } from '../../shared/types';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { ChartNoAxesCombined, Network, Store, Tags } from 'lucide-react-native';
import { getParkingMetricsLabels } from '../../shared/domainParking/presentation';
import { getDnsDetailLabels, useGoDaddyDns } from '../../shared/registrarSync/useGoDaddyDns';
import { Pressable, StyleSheet, Text, View, ActivityIndicator, type StyleProp, type ViewStyle } from 'react-native';
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
  const { status, details, appraisal, priceLabel, transferLabel, estimateLabel, showEstimateAction } = usePortfolioMarketplace(domain);
  const parking = useDomainParking(domain);
  const dns = useGoDaddyDns(domain);
  if (!status && !details.length && !showEstimateAction && !parking.available && !parking.result && !dns.available) return null;
  return <View {...elementProps(id)} style={styles.metadata}>
    {status ? <Text {...elementProps(`${id}-status`)} style={styles.status}>{status}</Text> : null}
    {priceLabel ? <Text {...elementProps(`${id}-price`)} style={styles.value}>{priceLabel}</Text> : null}
    {transferLabel ? <Text {...elementProps(`${id}-fast-transfer`)} style={styles.value}>{transferLabel}</Text> : null}
    {estimateLabel ? <Text {...elementProps(`${id}-estimate`)} style={styles.value}>{estimateLabel}</Text> : null}
    {details.map(detail => <Text key={detail.id} {...elementProps(id, detail.id)} style={styles.value}>{detail.label}</Text>)}
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
    {(parking.available || parking.result) && <View {...elementProps(`${id}-parking`)} style={styles.metadata}>
      {parking.available && <Pressable {...elementProps(`${id}-check-parking`)} style={styles.button} accessibilityRole={`button`} disabled={disabled || parking.busy}
        onPress={() => void parking.lookup()} accessibilityLabel={`Check Parking Metrics For ${domain.name}`}
        accessibilityState={{ busy: parking.busy, disabled: disabled || parking.busy }}>
        {parking.busy ? <ActivityIndicator size={`small`} color={palette.accent} /> : <ChartNoAxesCombined size={13} color={palette.accent} />}
        <Text {...elementProps(`${id}-check-parking-label`)} style={styles.buttonText}>{parking.busy ? `Checking Parking…` : `Check Parking Metrics`}</Text>
      </Pressable>}
      {parking.accounts.length > 0 && <View {...elementProps(`${id}-parking-accounts`)} style={styles.metadata}>
        <Text {...elementProps(`${id}-parking-accounts-label`)} style={styles.value}>{`GoDaddy Connection`}</Text>
        {parking.accounts.map(account => <Pressable key={account.id} {...elementProps(`${id}-parking-account`, String(account.number))} style={styles.button}
          disabled={disabled} accessibilityRole={`button`} onPress={() => void parking.lookup(account.id)}>
          <Text {...elementProps(`${id}-parking-account-label`, String(account.number))} style={styles.buttonText}>{`Account ${account.number}`}</Text>
        </Pressable>)}
      </View>}
      {parking.error ? <Text {...elementProps(`${id}-parking-error`)} style={styles.error} accessibilityLiveRegion={`polite`}>{parking.error}</Text> : null}
      {parking.notice ? <Text {...elementProps(`${id}-parking-notice`)} style={styles.value} accessibilityLiveRegion={`polite`}>{parking.notice}</Text> : null}
      {parking.result && <View {...elementProps(`${id}-parking-result`)} style={styles.metadata} accessibilityLiveRegion={`polite`}>
        {getParkingMetricsLabels(parking.result).map(detail => <Text key={detail.id} {...elementProps(`${id}-parking`, detail.id)} style={styles.value}>{detail.label}</Text>)}
      </View>}
    </View>}
    {dns.available && <View {...elementProps(`${id}-dns`)} style={styles.dns}>
      <Pressable {...elementProps(`${id}-check-dns`)} style={styles.button} accessibilityRole={`button`} disabled={disabled || dns.loading}
        onPress={() => void dns.check()} accessibilityLabel={`Check GoDaddy DNS For ${domain.name}`}
        accessibilityState={{ busy: dns.loading, disabled: disabled || dns.loading }}>
        {dns.loading ? <ActivityIndicator size={`small`} color={palette.accent} /> : <Network size={13} color={palette.accent} />}
        <Text {...elementProps(`${id}-check-dns-label`)} style={styles.buttonText}>{dns.loading ? `Checking GoDaddy DNS…` : `Check GoDaddy DNS`}</Text>
      </Pressable>
      {dns.error ? <Text {...elementProps(`${id}-dns-error`)} style={styles.error} accessibilityLiveRegion={`polite`}>{dns.error}</Text> : null}
      {dns.result && <View {...elementProps(`${id}-dns-results`)} style={styles.dns}>
        {getDnsDetailLabels(dns.result).map(detail => <Text key={detail.id} {...elementProps(`${id}-dns`, detail.id)} style={styles.value}>{detail.label}</Text>)}
      </View>}
    </View>}
  </View>;
};
