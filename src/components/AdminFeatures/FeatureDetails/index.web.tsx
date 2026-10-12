import '../../SegmentedControl/styles.scss';
import './styles.scss';
import type { FeatureDetailsProps } from './types';
import EditorModal from '../../AdminPlans/EditorModal/index.web';
import { Coins, Megaphone, CaseSensitive, Bell, Mail, X, SunMoon, MoveHorizontal } from 'lucide-react';

const featureIcons = { contact: Mail, ads: Megaphone, pricingTable: Coins, nameSwitch: CaseSensitive, themeToggle: SunMoon, notifications: Bell, domainMarquee: MoveHorizontal };

const FeatureDetails = ({ roles, feature, onClose }: FeatureDetailsProps) => {
  const id = `admin-feature-details-${feature.key}`;
  const Icon = featureIcons[feature.key];
  return <EditorModal id={id} busy={roles.saving} onClose={onClose} labelledBy={`${id}-title`}>
    {dismiss => <article id={`${id}-body`} className={`admin-feature-details`}>
      <div id={`${id}-heading`} className={`admin-feature-details-heading`}>
        <h2 id={`${id}-title`} className={`admin-feature-details-title`}><Icon id={`${id}-icon`} size={22} aria-hidden={`true`} />{feature.label}</h2>
        <button id={`${id}-close`} className={`admin-feature-details-close`} type={`button`} disabled={roles.saving} onClick={dismiss} aria-label={`Close ${feature.label} Details`}><X id={`${id}-close-icon`} size={17} aria-hidden={`true`} /></button>
      </div>
      <h3 id={`${id}-description-label`} className={`admin-feature-details-label`}>Description</h3>
      <p id={`${id}-description`} className={`admin-feature-details-description`}>{feature.description}</p>
      <section id={`${id}-roles`} className={`admin-feature-details-roles`} aria-labelledby={`${id}-roles-label`} aria-busy={roles.saving}>
        <h3 id={`${id}-roles-label`} className={`admin-feature-details-label`}>Roles</h3>
        <div id={`${id}-role-options`} className={`segmented-control admin-feature-details-role-options`} role={`group`} aria-labelledby={`${id}-roles-label`} aria-describedby={roles.error ? `${id}-roles-error` : `${id}-audience`}>
          {roles.options.map(({ value, label }) => <button
            key={value}
            type={`button`}
            id={`${id}-role-${value}`}
            className={`segmented-control-option`}
            disabled={roles.disabled || roles.saving}
            aria-label={`${label} Access To ${feature.label}`}
            aria-pressed={roles.ready && (roles.selected === null || roles.selected.includes(value))}
            onClick={() => roles.onToggle(value)}
          ><span id={`${id}-role-${value}-label`} className={`segmented-control-text`}>{label}</span></button>)}
        </div>
        {roles.saving ? <p id={`${id}-roles-saving`} className={`admin-feature-details-role-status`} role={`status`}>Saving</p> : null}
        {roles.error ? <p id={`${id}-roles-error`} className={`admin-feature-details-role-error`} role={`alert`}>{roles.error}</p> : null}
      </section>
      <p id={`${id}-audience`} className={`admin-feature-details-audience`}>When enabled, this feature is shown to selected roles. No plan selection allows Free and above; selecting a plan allows that tier and above. Select the same plan again to return to Free and above. Guests use the Guest role and Free plan</p>
    </article>}
  </EditorModal>;
};

export default FeatureDetails;
