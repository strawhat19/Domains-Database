import '../AdminUsers/records.scss';
import './styles.scss';
import { useState } from 'react';
import { AdminLoading } from '../AdminWidgets';
import { featureDefinitions, type AdminFeatureKey } from './features';
import TableStatus from '../AdminUsers/TableStatus';
import { useAdminFeatures } from './useAdminFeatures';
import FeatureDetails from './FeatureDetails/index.web';
import SegmentedControl from '../SegmentedControl/index.web';
import { tableElementProps } from '../AdminUsers/tableElements';
import { Coins, Megaphone, CaseSensitive, Bell, Mail, Check, Minus, Store, SunMoon, Settings, RotateCcw, MoveHorizontal } from 'lucide-react';

const columns = [`No.`, `Feature`, `Description`, `Value`, `Plans`, `Actions`];
const featureIcons = { contact: Mail, ads: Megaphone, pricingTable: Coins, nameSwitch: CaseSensitive, themeToggle: SunMoon, notifications: Bell, domainMarquee: MoveHorizontal, marketplaceListings: Store };
const featureOptions = [
  { value: `off`, label: `Disable`, Icon: Minus },
  { value: `on`, label: `Enable`, Icon: Check },
] as const;

const AdminFeatures = () => {
  const state = useAdminFeatures();
  const [detailsKey, setDetailsKey] = useState<AdminFeatureKey | null>(null);
  const details = featureDefinitions.find(feature => feature.key === detailsKey);
  return <section {...tableElementProps(`admin-features`)} className={`admin-features admin-records`} aria-label={`Feature Flags`} aria-busy={state.loading}>
    {state.error ? <div {...tableElementProps(`admin-records-heading`, `features`)}>
      <button {...tableElementProps(`admin-feature-toggle`, `refresh`)} type={`button`} disabled={state.loading} onClick={state.refresh}><RotateCcw {...tableElementProps(`admin-feature-refresh-icon`)} size={12} aria-hidden={`true`} />Refresh</button>
    </div> : null}
    {state.error ? <p {...tableElementProps(`admin-records-error`, `features`)} role={`alert`}>{state.error}</p> : null}
    <div {...tableElementProps(`admin-records-table-wrap`, `features`)} tabIndex={0} role={`region`} aria-label={`Feature Flags Table`}>
      <table {...tableElementProps(`admin-records-table`, `features`)}>
        <caption {...tableElementProps(`admin-records-table-caption`, `features`)}>Owner Feature Controls</caption>
        <thead {...tableElementProps(`admin-records-table-head`, `features`)}>
          <tr {...tableElementProps(`admin-records-column-row`, `features`)}>{columns.map((label, index) => <th key={label} {...tableElementProps(`admin-records-column`, `features-${index}`)} scope={`col`}>{label}</th>)}</tr>
        </thead>
        <tbody {...tableElementProps(`admin-records-table-body`, `features`)}>
          {state.loading ? <tr {...tableElementProps(`admin-feature-loading-row`)}><td {...tableElementProps(`admin-records-state-cell`, `features-loading`)} colSpan={columns.length}><AdminLoading id={`features`} label={`Loading Feature Flags`} /></td></tr> : featureDefinitions.map(({ key, label, description }, index) => {
            const Icon = featureIcons[key];
            const enabled = state.flags[key];
            const saving = !!state.pending[key];
            const ready = state.featureReady(key);
            const disabled = state.featureDisabled(key);
            const policyLoading = key === `marketplaceListings` && state.policyLoading;
            return <tr key={key} {...tableElementProps(`admin-feature-row`, key)} aria-busy={saving}>
              <td {...tableElementProps(`admin-record-number`, key)}><span {...tableElementProps(`admin-record-number-badge`, key)}>{index + 1}</span></td>
              <td {...tableElementProps(`admin-feature-identity`, key)}>
                <span {...tableElementProps(`admin-feature-name`, key)}><Icon {...tableElementProps(`admin-feature-icon`, key)} size={16} aria-hidden={`true`} /><strong {...tableElementProps(`admin-feature-label`, key)}>{label}</strong></span>
              </td>
              <td {...tableElementProps(`admin-feature-description`, key)}>{description}</td>
              <td {...tableElementProps(`admin-feature-value`, key)}><TableStatus id={`features-${key}`} label={policyLoading ? `Loading` : !ready ? `Unavailable` : enabled ? `True` : `False`} tone={policyLoading ? `gray` : !ready ? `red` : enabled ? `green` : `gray`} /></td>
              <td {...tableElementProps(`admin-feature-plans`, key)}>
                {state.planLoading ? <span {...tableElementProps(`admin-feature-plans-loading`, key)} className={`admin-feature-plan-state`} role={`status`}>Loading Plans</span> : state.planError ? <div {...tableElementProps(`admin-feature-plans-state`, key)}>
                  <p {...tableElementProps(`admin-feature-plans-error`, key)} className={`admin-feature-error`} role={`alert`}>{state.planError}</p>
                  <button {...tableElementProps(`admin-feature-plans-retry`, key)} className={`admin-feature-toggle`} type={`button`} onClick={state.refreshPlans}><RotateCcw {...tableElementProps(`admin-feature-plans-retry-icon`, key)} size={11} aria-hidden={`true`} />Refresh Plans</button>
                </div> : state.planOptions.length ? <div {...tableElementProps(`admin-feature-plan-segments`, key)} className={`admin-feature-plan-segments segmented-control admin-feature-segments admin-feature-audience-segments`} role={`group`} aria-label={`${label} Minimum Plan`} title={`No Selection: Free And Above · Select A Plan To Allow That Tier And Above`} aria-describedby={state.errors[key] ? `admin-feature-error-${key}` : undefined}>
                  {state.planOptions.map(({ value, label: planLabel }) => {
                    const selected = ready && state.selectedPlan(key) === value;
                    const unavailable = !state.isPlanAvailable(value);
                    return <button key={value} {...tableElementProps(`admin-feature-plan-option`, `${key}-${value}`)} className={`admin-feature-plan-option segmented-control-option`} type={`button`} aria-pressed={selected} title={unavailable ? selected ? `Plan Unavailable · Select Again To Return To Free And Above` : `Plan Unavailable` : undefined} aria-label={`${planLabel} And Above Access To ${label}`} disabled={disabled || saving || (unavailable && !selected)} onClick={() => { void state.togglePlan(key, value); }}>
                      <span {...tableElementProps(`admin-feature-plan-text`, `${key}-${value}`)} className={`admin-feature-plan-text segmented-control-text`}>{planLabel}</span>
                    </button>;
                  })}
                </div> : ready ? <span {...tableElementProps(`admin-feature-plan-baseline`, key)} className={`admin-feature-plan-state`}>Free And Above</span> : null}
              </td>
              <td {...tableElementProps(`admin-feature-actions`, key)}>
                <div {...tableElementProps(`admin-feature-action-controls`, key)} className={`admin-feature-action-controls`}>
                  <SegmentedControl
                    label={label}
                    options={featureOptions}
                    id={`admin-feature-toggle-${key}`}
                    className={`admin-feature-segments`}
                    disabled={disabled || saving}
                    value={!ready ? `unknown` : enabled ? `on` : `off`}
                    onChange={value => { void state.save(key, value === `on`); }}
                    describedBy={state.errors[key] ? `admin-feature-error-${key}` : undefined}
                  />
                  <button {...tableElementProps(`admin-feature-settings`, key)} type={`button`} className={`admin-feature-settings`} aria-label={`${label} Settings`} aria-haspopup={`dialog`} aria-controls={`admin-feature-details-${key}`} onClick={() => setDetailsKey(key)}><Settings {...tableElementProps(`admin-feature-settings-icon`, key)} size={14} aria-hidden={`true`} /></button>
                </div>
                {saving ? <span {...tableElementProps(`admin-feature-saving`, key)} role={`status`}>Saving</span> : null}
                {state.errors[key] ? <p {...tableElementProps(`admin-feature-error`, key)} role={`alert`}>{state.errors[key]}</p> : null}
                {key === `marketplaceListings` && state.policyError ? <div {...tableElementProps(`admin-feature-policy-error`, key)}>
                  <p role={`alert`}>{state.policyError}</p>
                  {state.source === `firestore` ? <button {...tableElementProps(`admin-feature-toggle`, `marketplace-refresh`)} type={`button`} onClick={state.refreshPolicy}><RotateCcw size={12} aria-hidden={`true`} />Refresh Marketplace Policy</button> : null}
                </div> : null}
              </td>
            </tr>;
          })}
        </tbody>
      </table>
    </div>
    {details ? <FeatureDetails
      feature={details}
      onClose={() => setDetailsKey(null)}
      roles={{
        ready: state.featureReady(details.key),
        disabled: state.featureDisabled(details.key),
        options: state.roleOptions,
        saving: !!state.pending[details.key],
        selected: state.audiences[details.key].roles,
        error: state.errors[details.key] || (details.key === `marketplaceListings` ? state.policyError : state.error),
        onToggle: value => { void state.toggleRole(details.key, value); },
      }}
    /> : null}
  </section>;
};

export default AdminFeatures;
