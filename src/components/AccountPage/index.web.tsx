import './styles.scss';
import { Roles } from '../../types/types';
import AccountSidebar from '../AccountSidebar';
import AccountActions from '../AccountActions';
import ProfileSettings from '../ProfileSettings';
import { useAccountPage } from './useAccountPage';
import AccountConnections from '../AccountConnections';
import ProfileThemePreference from '../ProfileThemePreference';
import { canAccessAdmin } from '../../shared/admin/permissions';
import { hasUnlimitedPlanAccess } from '../../shared/accountPlans';
import { Crown, Globe2, UserRound, BadgeCheck, LockKeyhole, ShieldCheck, CalendarDays } from 'lucide-react';

const AccountPage = ({ page = `profile` }: { page?: `profile` | `connections` }) => {
  const state = useAccountPage();
  const { user } = state;
  if (!user) return null;
  const RoleIcon = user.role === Roles.Owner ? Crown : canAccessAdmin(user) ? ShieldCheck : UserRound;
  const PrivacyIcon = user.profilePrivacy === `public` ? Globe2 : LockKeyhole;
  const fields = [
    { id: `role`, label: `Role`, Icon: RoleIcon, value: user.role },
    ...(!hasUnlimitedPlanAccess(user) ? [{ id: `plan`, label: `Plan`, Icon: BadgeCheck, value: user.plan === `free` ? `Free` : user.plan }] : []),
    { id: `privacy`, label: `Profile`, Icon: PrivacyIcon, value: user.profilePrivacy === `public` ? `Public` : `Private` },
    { id: `joined`, label: `Joined`, Icon: CalendarDays, value: new Date(user.created).toLocaleDateString(`en-US`, { day: `numeric`, year: `numeric`, month: `long`, timeZone: `America/New_York` }) },
  ];
  return (
    <section id={`account-page-${page}`} className={`account-page account-layout`} data-page={page} aria-labelledby={`account-title`}>
      <AccountSidebar section={page} />
      {page === `profile` ? <div id={`account-content`} className={`account-content profile-content`}>
        <div id={`profile-details`} className={`profile-details`}>
          <span id={`account-eyebrow`} className={`account-eyebrow`}>{`Your Account`}</span>
          <h1 id={`account-title`} className={`account-title`}><UserRound size={28} aria-hidden id={`account-title-icon`} className={`account-title-icon`} /><span id={`account-title-copy`} className={`account-title-copy`}>{`Hello, `}<em id={`account-title-name`} className={`account-title-name`}>{`${user.name}.`}</em></span></h1>
          <ProfileSettings />
          <dl id={`profile-account-record`} className={`profile-record profile-account-record`}>
            <div id={`profile-account-row`} className={`profile-record-row profile-input-row`}>
              <dt id={`profile-account-label`} className={`profile-record-label`}>{`Account`}</dt>
              <dd id={`profile-account-value`} className={`profile-record-value`}><AccountActions stacked /></dd>
            </div>
          </dl>
        </div>
        <aside id={`profile-sidebar`} className={`profile-sidebar`} aria-labelledby={`profile-sidebar-title`}>
          <h2 id={`profile-sidebar-title`} className={`profile-sidebar-title`}>{`Account Details`}</h2>
          <dl id={`profile-sidebar-record`} className={`profile-record profile-sidebar-record`}>
            {fields.map(({ id, label, Icon, value }) => <div key={id} id={`profile-row-${id}`} className={`profile-record-row`}><dt id={`profile-label-${id}`} className={`profile-record-label`}>{label}</dt><dd id={`profile-value-${id}`} className={`profile-record-value profile-metadata`}><Icon size={18} aria-hidden id={`profile-${id}-icon`} className={`profile-metadata-icon`} /><span id={`profile-${id}-label`} className={`profile-metadata-label`}>{value}</span></dd></div>)}
          </dl>
          <ProfileThemePreference />
          <section id={`profile-portfolio`} className={`profile-portfolio`} aria-labelledby={`profile-portfolio-title`}>
            <h3 id={`profile-portfolio-title`} className={`profile-portfolio-title`}>{`Your Portfolio`}</h3>
            <dl id={`profile-portfolio-record`} className={`profile-record profile-sidebar-record`}>
              {state.stats.map(({ id, label, value, Icon }) => <div key={id} id={`profile-portfolio-row-${id}`} className={`profile-record-row`}><dt id={`profile-portfolio-label-${id}`} className={`profile-record-label`}>{label}</dt><dd id={`profile-portfolio-value-${id}`} className={`profile-record-value profile-metadata`}><Icon size={15} aria-hidden id={`profile-portfolio-icon-${id}`} className={`profile-metadata-icon`} /><span id={`profile-portfolio-stat-${id}`} className={`profile-portfolio-stat`}>{value}</span></dd></div>)}
            </dl>
            {state.error && <p id={`profile-portfolio-error`} className={`profile-error`} role={`alert`}>{state.error}</p>}
          </section>
          <div id={`profile-account-identity`} className={`profile-account-identity`}><span id={`profile-account-mode`} className={`profile-account-mode`}>{state.connectionMode}</span><span id={`profile-account-id`} className={`profile-account-id`}>{user.id}</span></div>
        </aside>
      </div> : <div id={`account-content`} className={`account-content connections-content`}>
        <span id={`account-eyebrow`} className={`account-eyebrow`}>{`Your Account`}</span>
        <h1 id={`account-title`} className={`account-title`}><ShieldCheck size={28} aria-hidden id={`account-title-icon`} className={`account-title-icon`} />{`Connections`}</h1>
        <p id={`account-description`} className={`account-description`}>{`Manage registrar connections securely for your own account.`}</p>
        <AccountConnections />
      </div>}
    </section>
  );
};

export default AccountPage;
