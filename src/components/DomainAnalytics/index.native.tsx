import { useMemo } from 'react';
import { createStyles } from './styles.native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useReducedMotion } from '../../shared/common/useReducedMotion';
import { X, Globe, Search, RefreshCw, ChartNoAxesCombined, ArrowUpRight } from 'lucide-react-native';
import { Modal, Text, View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useDomainAnalytics, formatAnalyticsDate, type DomainAnalyticsProps } from './useDomainAnalytics';

const DomainAnalytics = ({ domain, suffix, onClose }: DomainAnalyticsProps) => {
  const state = useDomainAnalytics(domain, suffix);
  const reducedMotion = useReducedMotion();
  const { palette } = useTheme();
  const scope = state.scope;
  const styles = useMemo(() => createStyles(palette), [palette]);
  const statusColor = palette.muted;

  return (
    <Modal
      visible
      transparent
      onRequestClose={onClose}
      animationType={reducedMotion ? `none` : `fade`}
    >
      <View {...elementProps(`domain-analytics-overlay`, scope)} style={styles.overlay}>
        <Pressable
          onPress={onClose}
          style={styles.backdrop}
          accessibilityLabel={`Close Domain Analytics`}
          {...elementProps(`domain-analytics-backdrop`, scope)}
        />
        <View {...elementProps(`domain-analytics-dialog`, scope)} style={styles.dialog} accessibilityViewIsModal>
          <View {...elementProps(`domain-analytics-header`, scope)} style={styles.header}>
            <View {...elementProps(`domain-analytics-heading`, scope)} style={styles.heading}>
              <View {...elementProps(`domain-analytics-eyebrow`, scope)} style={styles.eyebrow}>
                <ChartNoAxesCombined {...elementProps(`domain-analytics-icon`, scope)} size={16} color={palette.accent} />
                <Text {...elementProps(`domain-analytics-eyebrow-text`, scope)} style={styles.eyebrowText}>{`DOMAIN ANALYTICS`}</Text>
              </View>
              <Text {...elementProps(`domain-analytics-title`, scope)} style={styles.title} accessibilityRole={`header`}>{domain}</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={styles.close}
              accessibilityRole={`button`}
              accessibilityLabel={`Close Domain Analytics`}
              {...elementProps(`domain-analytics-close`, scope)}
            >
              <X {...elementProps(`domain-analytics-close-icon`, scope)} size={19} color={palette.muted} />
            </Pressable>
          </View>
          <ScrollView {...elementProps(`domain-analytics-body`, scope)} contentContainerStyle={styles.body}>
            <Text {...elementProps(`domain-analytics-description`, scope)} style={styles.description}>
              {`Public registration and DNS checks, domain name statistics, and keyword research.`}
            </Text>
            {state.loading && (
              <View {...elementProps(`domain-analytics-loading`, scope)} style={styles.loading} accessibilityLiveRegion={`polite`}>
                <View {...elementProps(`domain-analytics-loading-heading`, scope)} style={styles.inline}>
                  <ActivityIndicator {...elementProps(`domain-analytics-loading-icon`, scope)} size={`small`} color={palette.accent} />
                  <Text {...elementProps(`domain-analytics-loading-text`, scope)} style={styles.note}>{`Checking public domain data…`}</Text>
                </View>
                <View {...elementProps(`domain-analytics-skeleton`, scope)} style={styles.skeleton} />
              </View>
            )}
            {!!state.error && <Text {...elementProps(`domain-analytics-error`, scope)} style={styles.error} accessibilityRole={`alert`}>{state.error}</Text>}
            {state.snapshot && (
              <>
                <View {...elementProps(`domain-analytics-registration`, scope)} style={styles.section}>
                  <View {...elementProps(`domain-analytics-registration-heading`, scope)} style={styles.inline}>
                    <Globe {...elementProps(`domain-analytics-registration-icon`, scope)} size={16} color={palette.accent} />
                    <Text {...elementProps(`domain-analytics-registration-title`, scope)} style={styles.sectionTitle} accessibilityRole={`header`}>{`Registration`}</Text>
                  </View>
                  <View {...elementProps(`actionsCell`, scope)} style={styles.actionsCell}>
                    <View {...elementProps(`rowStatus`, scope)} style={styles.rowStatus}>
                      <View {...elementProps(`statusDotWrap`, scope)} style={styles.statusDotWrap}>
                        <View {...elementProps(`statusDot`, scope)} style={[styles.statusDot, { backgroundColor: statusColor }]} />
                      </View>
                      <Text {...elementProps(`statusText`, scope)} style={[styles.statusText, { color: statusColor }]}>{state.registrationLabel}</Text>
                    </View>
                  </View>
                  <View {...elementProps(`domain-analytics-registration-fields`, scope)} style={styles.fields}>
                    {state.registrationFields.map(field => (
                      <View key={field.key} {...elementProps(`domain-analytics-registration-field`, `${scope}-${field.key}`)} style={styles.field}>
                        <Text {...elementProps(`domain-analytics-field-label`, `${scope}-${field.key}`)} style={styles.fieldLabel}>{field.label}</Text>
                        <Text {...elementProps(`domain-analytics-field-value`, `${scope}-${field.key}`)} style={styles.fieldValue}>{field.value}</Text>
                      </View>
                    ))}
                  </View>
                  {!!state.snapshot.registration.error && <Text {...elementProps(`domain-analytics-registration-error`, scope)} style={styles.warning}>{state.snapshot.registration.error}</Text>}
                  <Text {...elementProps(`domain-analytics-registration-note`, scope)} style={styles.note}>{`Registration data does not confirm purchase availability. Check the registrar for current availability and pricing.`}</Text>
                </View>
                {state.snapshot.inventory && (
                  <View {...elementProps(`domain-analytics-inventory`, scope)} style={styles.section}>
                    <Text {...elementProps(`domain-analytics-inventory-title`, scope)} style={styles.sectionTitle} accessibilityRole={`header`}>{`Inventory Statistics`}</Text>
                    <Text {...elementProps(`domain-analytics-inventory-source`, scope)} style={styles.note}>{state.snapshot.inventory.sourceLabel}</Text>
                    <View {...elementProps(`domain-analytics-inventory-fields`, scope)} style={styles.fields}>
                      {state.snapshot.inventory.metrics?.map((metric, index) => (
                        <View key={`${metric.key}-${index}`} {...elementProps(`domain-analytics-inventory-field`, `${scope}-${index}`)} style={styles.field}>
                          <Text {...elementProps(`domain-analytics-inventory-label`, `${scope}-${index}`)} style={styles.fieldLabel}>{metric.label}</Text>
                          <Text {...elementProps(`domain-analytics-inventory-value`, `${scope}-${index}`)} style={styles.fieldValue}>{metric.value}</Text>
                        </View>
                      ))}
                    </View>
                    {!state.snapshot.inventory.metrics?.length && <Text {...elementProps(`domain-analytics-inventory-empty`, scope)} style={styles.note}>{`No inventory metrics imported for this domain.`}</Text>}
                    <Text {...elementProps(`domain-analytics-inventory-date`, scope)} style={styles.note}>{state.inventoryTimestamp}</Text>
                    <Text {...elementProps(`domain-analytics-inventory-note`, scope)} style={styles.note}>{`Provider metrics reflect the imported inventory snapshot.`}</Text>
                  </View>
                )}
                <View {...elementProps(`domain-analytics-name`, scope)} style={styles.section}>
                  <Text {...elementProps(`domain-analytics-name-title`, scope)} style={styles.sectionTitle} accessibilityRole={`header`}>{`Name Statistics`}</Text>
                  <View {...elementProps(`domain-analytics-name-fields`, scope)} style={styles.fields}>
                    {state.metrics.map(metric => (
                      <View key={metric.key} {...elementProps(`domain-analytics-name-field`, `${scope}-${metric.key}`)} style={styles.field}>
                        <Text {...elementProps(`domain-analytics-field-label`, `${scope}-${metric.key}`)} style={styles.fieldLabel}>{metric.label}</Text>
                        <Text {...elementProps(`domain-analytics-field-value`, `${scope}-${metric.key}`)} style={styles.fieldValue}>{metric.value}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View {...elementProps(`domain-analytics-dns`, scope)} style={styles.section}>
                  <Text {...elementProps(`domain-analytics-dns-title`, scope)} style={styles.sectionTitle} accessibilityRole={`header`}>{`DNS Records`}</Text>
                  {!!state.snapshot.dns.error && <Text {...elementProps(`domain-analytics-dns-error`, scope)} style={styles.warning}>{state.snapshot.dns.error}</Text>}
                  {state.snapshot.dns.records?.map((record, index) => (
                    <View key={`${record.type}-${index}`} {...elementProps(`domain-analytics-dns-record`, `${scope}-${index}`)} style={styles.dnsRecord}>
                      <Text {...elementProps(`domain-analytics-dns-type`, `${scope}-${index}`)} style={styles.dnsType}>{record.type}</Text>
                      <Text {...elementProps(`domain-analytics-dns-value`, `${scope}-${index}`)} style={styles.dnsValue}>{record.value}</Text>
                    </View>
                  ))}
                  {!state.snapshot.dns.records?.length && !state.snapshot.dns.error && <Text {...elementProps(`domain-analytics-dns-empty`, scope)} style={styles.note}>{`No DNS records returned.`}</Text>}
                </View>
                <View {...elementProps(`domain-analytics-research`, scope)} style={styles.section}>
                  <View {...elementProps(`domain-analytics-research-heading`, scope)} style={styles.inline}>
                    <Search {...elementProps(`domain-analytics-research-icon`, scope)} size={16} color={palette.accent} />
                    <Text {...elementProps(`domain-analytics-research-title`, scope)} style={styles.sectionTitle} accessibilityRole={`header`}>{`Keyword Research`}</Text>
                  </View>
                  <Text {...elementProps(`domain-analytics-keywords-note`, scope)} style={styles.note}>{`Keyword suggestions come from the domain name. Research tools can help assess interest.`}</Text>
                  <View {...elementProps(`domain-analytics-keywords`, scope)} style={styles.keywords}>
                    {state.snapshot.name.keywords?.map((keyword, index) => (
                      <Text key={`${keyword}-${index}`} {...elementProps(`domain-analytics-keyword`, `${scope}-${index}`)} style={styles.keyword}>{keyword}</Text>
                    ))}
                  </View>
                  <View {...elementProps(`domain-analytics-research-links`, scope)} style={styles.researchLinks}>
                    {state.researchLinks.map((link, index) => (
                      <Pressable
                        key={link.url}
                        style={styles.researchLink}
                        accessibilityRole={`link`}
                        accessibilityLabel={`${link.label} — Opens Website`}
                        onPress={() => void state.openLink(link.url)}
                        {...elementProps(`domain-analytics-research-link`, `${scope}-${index}`)}
                      >
                        <Text {...elementProps(`domain-analytics-research-link-text`, `${scope}-${index}`)} style={styles.researchLinkText}>{link.label}</Text>
                        <ArrowUpRight {...elementProps(`domain-analytics-research-link-icon`, `${scope}-${index}`)} size={14} color={palette.accent} />
                      </Pressable>
                    ))}
                  </View>
                  {!!state.linkError && <Text {...elementProps(`domain-analytics-link-error`, scope)} style={styles.error} accessibilityRole={`alert`}>{state.linkError}</Text>}
                  <Text {...elementProps(`domain-analytics-provider-note`, scope)} style={styles.providerNote}>{`Live search volume, CPC, authority, and valuation need a provider connection. Imported inventory metrics, when present, retain their source date.`}</Text>
                </View>
                {!!state.snapshot.errors?.length && <Text {...elementProps(`domain-analytics-partial-errors`, scope)} style={styles.warning}>{state.snapshot.errors.join(` · `)}</Text>}
              </>
            )}
          </ScrollView>
          <View {...elementProps(`domain-analytics-footer`, scope)} style={styles.footer}>
            <Text {...elementProps(`domain-analytics-checked-at`, scope)} style={[styles.note, styles.checkedAt]}>
              {state.snapshot ? `Public Check: ${formatAnalyticsDate(state.snapshot.checkedAt)}` : `Public data · No API key required`}
            </Text>
            <Pressable
              onPress={state.refresh}
              disabled={state.loading}
              accessibilityRole={`button`}
              accessibilityState={{ disabled: state.loading }}
              {...elementProps(`domain-analytics-refresh`, scope)}
              style={[styles.refresh, state.loading && styles.disabled]}
            >
              <RefreshCw {...elementProps(`domain-analytics-refresh-icon`, scope)} size={14} color={palette.accent} />
              <Text {...elementProps(`domain-analytics-refresh-text`, scope)} style={styles.researchLinkText}>{state.retry ? `Retry` : `Refresh`}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DomainAnalytics;
