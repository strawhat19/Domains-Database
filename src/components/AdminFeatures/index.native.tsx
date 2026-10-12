import { useMemo, useState } from 'react';
import { createStyles } from './styles.native';
import { featureDefinitions } from './features';
import { Text, View, Pressable } from 'react-native';
import { useAdminFeatures } from './useAdminFeatures';
import FeatureDetails from './FeatureDetails/index.native';
import { elementProps } from '../../shared/elementProps';
import type { FeatureFlagKey } from '../../shared/featureFlags/types';
import { StatusCell, AdminButton, AdminLoading, useAdminWidgetStyles } from '../AdminWidgets';
import { Coins, Megaphone, CaseSensitive, Bell, Mail, Check, Minus, SunMoon, Settings, RotateCcw, MoveHorizontal } from 'lucide-react-native';

const featureIcons = { contact: Mail, ads: Megaphone, pricingTable: Coins, nameSwitch: CaseSensitive, themeToggle: SunMoon, notifications: Bell, domainMarquee: MoveHorizontal };
const featureToggleOptions = [{ value: `off`, enabled: false, label: `Disable`, Icon: Minus }, { value: `on`, enabled: true, label: `Enable`, Icon: Check }];

const AdminFeatures = () => {
  const state = useAdminFeatures();
  const { palette, styles: widgetStyles } = useAdminWidgetStyles();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [detailsKey, setDetailsKey] = useState<FeatureFlagKey | null>(null);
  const details = featureDefinitions.find(feature => feature.key === detailsKey);
  return <View {...elementProps(`admin-panel`, `features`)} style={widgetStyles.panel}>
    <View {...elementProps(`admin-panel-body`, `features`)} style={widgetStyles.panelBody}>
      {state.error ? <Text {...elementProps(`admin-features-error`)} style={styles.error} accessibilityRole={`alert`}>{state.error}</Text> : null}
      {state.error ? <AdminButton id={`features-refresh`} label={`Refresh`} Icon={RotateCcw} disabled={state.loading} onPress={state.refresh} /> : null}
      {state.loading ? <AdminLoading id={`features`} label={`Loading Feature Flags`} /> : <View {...elementProps(`admin-feature-rows`)} style={styles.rows}>
        {featureDefinitions.map(({ key, label, description }) => {
          const Icon = featureIcons[key];
          const enabled = state.flags[key];
          const saving = !!state.pending[key];
          const toggleDisabled = state.disabled || saving;
          const plansDisabled = toggleDisabled || state.planLoading || !!state.planError;
          return <View key={key} {...elementProps(`admin-feature-row`, key)} style={styles.row}>
            <View {...elementProps(`admin-feature-identity`, key)} style={styles.identity}>
              <View {...elementProps(`admin-feature-heading`, key)} style={styles.heading}>
                <Icon {...elementProps(`admin-feature-icon`, key)} size={16} color={palette.accent} />
                <Text {...elementProps(`admin-feature-label`, key)} style={styles.label}>{label}</Text>
              </View>
              <Text {...elementProps(`admin-feature-description`, key)} style={styles.description}>{description}</Text>
            </View>
            <View {...elementProps(`admin-feature-actions`, key)} style={styles.actions}>
              <StatusCell id={`features-${key}`} label={!state.ready ? `Unavailable` : enabled ? `True` : `False`} tone={!state.ready ? `red` : enabled ? `green` : `gray`} />
              <View {...elementProps(`admin-feature-toggle`, key)} style={styles.segments} accessibilityRole={`radiogroup`} accessibilityLabel={label} accessibilityState={{ busy: saving, disabled: toggleDisabled }}>
                {featureToggleOptions.map(({ value, enabled: optionEnabled, label: optionLabel, Icon: OptionIcon }) => {
                  const selected = state.ready && enabled === optionEnabled;
                  return <Pressable key={value} {...elementProps(`admin-feature-toggle-option`, `${key}-${value}`)} hitSlop={4} disabled={toggleDisabled} accessibilityRole={`radio`} accessibilityLabel={`${optionLabel} ${label}`} accessibilityState={{ checked: selected, disabled: toggleDisabled, busy: saving }} onPress={() => { if (!selected) void state.save(key, optionEnabled); }} style={[styles.segment, selected && styles.selectedSegment, toggleDisabled && !selected && styles.disabled]}>
                    <OptionIcon {...elementProps(`admin-feature-toggle-icon`, `${key}-${value}`)} size={12} color={selected ? palette.contrast : palette.muted} />
                    <Text {...elementProps(`admin-feature-toggle-label`, `${key}-${value}`)} style={[styles.segmentLabel, selected && styles.selectedSegmentLabel]}>{optionLabel}</Text>
                  </Pressable>;
                })}
              </View>
              <Pressable {...elementProps(`admin-feature-details`, key)} style={styles.detailsButton} hitSlop={6} accessibilityRole={`button`} accessibilityLabel={`${label} Details`} onPress={() => setDetailsKey(key)}>
                <Settings {...elementProps(`admin-feature-details-icon`, key)} size={14} color={palette.muted} />
              </Pressable>
              {saving ? <Text {...elementProps(`admin-feature-saving`, key)} style={styles.progress} accessibilityLiveRegion={`polite`}>Saving</Text> : null}
            </View>
            <View {...elementProps(`admin-feature-audiences`, key)} style={styles.audiences}>
              <View {...elementProps(`admin-feature-audience`, `${key}-plans`)} style={styles.audience}>
                <Text {...elementProps(`admin-feature-audience-label`, `${key}-plans`)} style={styles.audienceLabel}>Plans</Text>
                {!state.planLoading && !state.planError ? <View {...elementProps(`admin-feature-audience-options`, `${key}-plans`)} style={styles.audienceOptions} accessibilityLabel={`${label} Plans`}>
                  {state.planOptions.map(({ value, label: optionLabel }) => {
                    const selectedPlan = state.selectedPlan(key);
                    const selected = state.ready && selectedPlan === value;
                    const optionDisabled = plansDisabled || (!state.isPlanAvailable(value) && selectedPlan !== value);
                    return <Pressable key={value} {...elementProps(`admin-feature-audience-option`, `${key}-plans-${value}`)} hitSlop={4} disabled={optionDisabled} accessibilityRole={`button`} accessibilityLabel={`${optionLabel} Plan Or Higher For ${label}`} accessibilityState={{ selected, disabled: optionDisabled, busy: saving }} onPress={() => { void state.togglePlan(key, value); }} style={[styles.audienceOption, selected && styles.selectedSegment, optionDisabled && !selected && styles.disabled]}>
                      <Text {...elementProps(`admin-feature-audience-option-label`, `${key}-plans-${value}`)} style={[styles.audienceOptionLabel, selected && styles.selectedSegmentLabel]}>{optionLabel}</Text>
                    </Pressable>;
                  })}
                  {!state.planOptions.length ? <Text {...elementProps(`admin-feature-plans-baseline`, key)} style={styles.progress}>Free And Above</Text> : null}
                </View> : null}
                {state.planLoading ? <Text {...elementProps(`admin-feature-plans-loading`, key)} style={styles.progress}>Loading Plans</Text> : null}
                {state.planError ? <View {...elementProps(`admin-feature-plans-error`, key)} style={styles.planError}>
                  <Text {...elementProps(`admin-feature-plans-error-label`, key)} style={styles.error} accessibilityRole={`alert`}>{state.planError}</Text>
                  <AdminButton id={`features-plans-refresh-${key}`} label={`Refresh Plans`} Icon={RotateCcw} disabled={state.planLoading} onPress={state.refreshPlans} />
                </View> : null}
              </View>
            </View>
            {state.errors[key] ? <Text {...elementProps(`admin-feature-error`, key)} style={styles.error} accessibilityRole={`alert`}>{state.errors[key]}</Text> : null}
          </View>;
        })}
      </View>}
    </View>
    {details ? <FeatureDetails
      feature={details}
      onClose={() => setDetailsKey(null)}
      roles={{
        ready: state.ready,
        options: state.roleOptions,
        saving: !!state.pending[details.key],
        error: state.errors[details.key] ?? ``,
        selected: state.audiences[details.key].roles,
        disabled: state.disabled || !!state.pending[details.key],
        onToggle: value => { void state.toggleRole(details.key, value); },
      }}
    /> : null}
  </View>;
};

export default AdminFeatures;
