import { useMemo, useState } from 'react';
import { createStyles } from './styles.native';
import { elementProps } from '../../shared/elementProps';
import { useAfternicActivity } from './useAfternicActivity';
import { useTheme } from '../../shared/themeContext/useTheme';
import { Activity, RefreshCw, Search, X, type LucideIcon } from 'lucide-react-native';
import { afternicActivityRanges } from '../../shared/marketplaceAfternic/activity';
import { Text, View, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { activityCheckedAt, activitySaleDetails, activitySalesCoverage, activityStatsPresentation } from './activityPresentation';

const AfternicActivity = () => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette, false), [palette]);
  const [open, setOpen] = useState(false);
  const [showDaily, setShowDaily] = useState(false);
  const [showDomainDaily, setShowDomainDaily] = useState(false);
  const state = useAfternicActivity();
  const stats = state.stats ? activityStatsPresentation(state.stats) : null;
  const domainStats = state.domainStats ? activityStatsPresentation(state.domainStats) : null;
  const sales = state.sales;
  const note = (id: string, value: string, error = false) => <Text {...elementProps(`afternic-activity`, id)} style={error ? styles.error : styles.note}>{value}</Text>;
  const button = (id: string, label: string, onPress: () => void, options?: { icon?: LucideIcon; busy?: boolean; selected?: boolean; expanded?: boolean; disabled?: boolean }) => {
    const Icon = options?.icon;
    return <Pressable key={id} {...elementProps(`afternic-activity`, id)} onPress={onPress} disabled={options?.disabled} accessibilityRole={`button`}
      accessibilityState={{ busy: options?.busy, selected: options?.selected, expanded: options?.expanded, disabled: options?.disabled }}
      style={[styles.button, options?.selected && styles.activeChoice]}>
      {options?.busy ? <ActivityIndicator size={`small`} color={palette.accent} /> : Icon && <Icon size={15} color={palette.accent} accessible={false} />}
      <Text {...elementProps(`afternic-activity-label`, id)} style={styles.buttonText}>{label}</Text>
    </Pressable>;
  };

  return <View {...elementProps(`afternic-activity`)} style={styles.activity}>
    {button(`toggle`, `Afternic Activity`, () => { if (!open && !state.stats && !sales && !state.busy) void state.load(state.days); setOpen(!open); }, { icon: Activity, expanded: open })}
    {open && <View {...elementProps(`afternic-activity-content`)} style={styles.list}>
      <View {...elementProps(`afternic-activity-actions`)} style={styles.actions}>
        {afternicActivityRanges.map(days => button(`range-${days}`, `${days} Days`, () => { if (state.days !== days) void state.load(days); }, { selected: state.days === days }))}
        {button(`refresh`, state.busy ? `Checking Afternic…` : `Refresh Activity`, () => void state.load(state.days), { icon: RefreshCw, busy: state.busy, disabled: state.busy })}
      </View>
      <Text {...elementProps(`afternic-activity-stats-title`)} accessibilityRole={`header`} style={styles.title}>{`Account Views And Leads`}</Text>
      {!!state.statsError && note(`stats-error`, state.statsError, true)}
      {stats && state.stats && <>
        {note(`stats-counts`, `${stats.views} · ${stats.leads} · ${stats.reported}`)}
        {note(`stats-freshness`, `${stats.range} · ${activityCheckedAt(state.stats.checkedAt)}`)}
        {stats.rows.length > 0 && button(`days-toggle`, `Daily Breakdown`, () => setShowDaily(!showDaily), { expanded: showDaily })}
        {showDaily && stats.rows.length > 0 && <ScrollView {...elementProps(`afternic-activity-days-scroll`)} nestedScrollEnabled style={styles.activityDaily}>
          {stats.rows.map(row => <View key={row.date} {...elementProps(`afternic-activity-day`, row.date)} style={styles.row}>
            {note(`date-${row.date}`, row.label)}
            {note(`views-${row.date}`, `Views ${row.viewsLabel}`)}
            {note(`leads-${row.date}`, `Leads ${row.leadsLabel}`)}
          </View>)}
        </ScrollView>}
      </>}
      <Text {...elementProps(`afternic-activity-sales-title`)} accessibilityRole={`header`} style={styles.title}>{`Sales History`}</Text>
      <View {...elementProps(`afternic-activity-sales-filter`)} style={styles.actions}>
        <TextInput {...elementProps(`afternic-activity-sales-domain`)} style={styles.activityDomainInput} placeholder={`example.com`} placeholderTextColor={palette.muted}
          accessibilityLabel={`Choose A Domain For Afternic Sales And Activity`} value={state.domainInput} onChangeText={state.setDomainInput} autoCapitalize={`none`} autoCorrect={false}
          maxLength={253} returnKeyType={`search`} onSubmitEditing={() => { if (!state.busy) state.filterSales(); }} />
        {button(`sales-apply`, `Filter Sales`, state.filterSales, { icon: Search, disabled: state.busy || !state.domainInput.trim() })}
        {state.domain && button(`sales-clear`, `Clear Filter`, state.clearSalesFilter, { icon: X, disabled: state.busy })}
      </View>
      {!!state.salesError && note(`sales-error`, state.salesError, true)}
      {sales && <>
        {note(`sales-freshness`, `${activitySalesCoverage(sales)} · ${activityCheckedAt(sales.checkedAt)}`)}
        {sales.skipped > 0 && note(`sales-skipped`, `${sales.skipped} Unreadable Or Duplicate Row(s)`)}
        {sales.sales.map(sale => <View key={sale.id} {...elementProps(`afternic-sale`, sale.id)} style={styles.listingCard}>
          <Text {...elementProps(`afternic-sale-domain`, sale.id)} style={styles.title}>{sale.domain}</Text>
          {activitySaleDetails(sale).map(detail => <Text key={detail.id} {...elementProps(`afternic-sale-${detail.id}`, sale.id)} style={styles.note}>{detail.label}</Text>)}
        </View>)}
        {sales.nextOffset !== null && button(`sales-more`, `Load More Sales`, () => void state.load(state.days, sales), { disabled: state.busy })}
      </>}
      {state.domain && <View {...elementProps(`afternic-activity-domain-stats`)} style={styles.list}>
        <Text {...elementProps(`afternic-activity-domain-stats-title`)} accessibilityRole={`header`} style={styles.title}>{`Afternic Views And Leads · ${state.domain}`}</Text>
        {button(`domain-stats-load`, state.domainStatsBusy ? `Checking Domain Activity…` : domainStats ? `Refresh Domain Activity` : `Check Domain Activity`,
          () => void state.loadDomainStats(), { icon: Activity, busy: state.domainStatsBusy, disabled: state.busy || state.domainStatsBusy })}
        {!!state.domainStatsError && note(`domain-stats-error`, state.domainStatsError, true)}
        {domainStats && state.domainStats && <>
          {note(`domain-stats-counts`, `${domainStats.views} · ${domainStats.leads} · ${domainStats.reported}`)}
          {note(`domain-stats-freshness`, `${domainStats.range} · ${activityCheckedAt(state.domainStats.checkedAt)}`)}
          {domainStats.rows.length > 0 && button(`domain-days-toggle`, `Daily Breakdown`, () => setShowDomainDaily(!showDomainDaily), { expanded: showDomainDaily })}
          {showDomainDaily && domainStats.rows.length > 0 && <ScrollView {...elementProps(`afternic-activity-domain-days-scroll`)} nestedScrollEnabled style={styles.activityDaily}>
            {domainStats.rows.map(row => <View key={row.date} {...elementProps(`afternic-activity-domain-day`, row.date)} style={styles.row}>
              {note(`domain-date-${row.date}`, row.label)}
              {note(`domain-views-${row.date}`, `Views ${row.viewsLabel}`)}
              {note(`domain-leads-${row.date}`, `Leads ${row.leadsLabel}`)}
            </View>)}
          </ScrollView>}
        </>}
      </View>}
    </View>}
  </View>;
};

export default AfternicActivity;
