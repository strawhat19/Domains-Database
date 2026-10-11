import { Text, View } from 'react-native';
import { Roles } from '../../types/types';
import AccountSidebar from '../AccountSidebar';
import AccountActions from '../AccountActions';
import ProfileSettings from '../ProfileSettings';
import { useAccountPage } from './useAccountPage';
import AccountConnections from '../AccountConnections';
import { elementProps } from '../../shared/elementProps';
import ProfileThemePreference from '../ProfileThemePreference';
import { canAccessAdmin } from '../../shared/admin/permissions';
import { hasUnlimitedPlanAccess } from '../../shared/accountPlans';
import { Crown, Globe2, UserRound, BadgeCheck, LockKeyhole, ShieldCheck, CalendarDays } from 'lucide-react-native';

const AccountPage = ({ page = `profile` }: { page?: `profile` | `connections` }) => {
  const state = useAccountPage();
  const { styles, palette, user } = state;
  if (!user) return null;
  const profile = page === `profile`;
  const TitleIcon = profile ? UserRound : ShieldCheck;
  const RoleIcon = user.role === Roles.Owner ? Crown : canAccessAdmin(user) ? ShieldCheck : UserRound;
  const PrivacyIcon = user.profilePrivacy === `public` ? Globe2 : LockKeyhole;
  const fields = [
    { id: `role`, label: `Role`, Icon: RoleIcon, value: user.role },
    ...(!hasUnlimitedPlanAccess(user) ? [{ id: `plan`, label: `Plan`, Icon: BadgeCheck, value: user.plan === `free` ? `Free` : user.plan }] : []),
    { id: `privacy`, label: `Profile`, Icon: PrivacyIcon, value: user.profilePrivacy === `public` ? `Public` : `Private` },
    { id: `joined`, label: `Joined`, Icon: CalendarDays, value: new Date(user.created).toLocaleDateString(`en-US`, { day: `numeric`, year: `numeric`, month: `long`, timeZone: `America/New_York` }) },
  ];
  return <View {...elementProps(`account-page`, page)} style={[styles.root, state.compact && styles.compact]}>
    <AccountSidebar section={page} />
    <View {...elementProps(`account-content`)} style={[styles.content, state.compact && styles.compactContent]}>
      <View {...elementProps(`profile-content`)} style={[styles.columns, state.narrow && styles.stackedColumns]}>
        <View {...elementProps(`profile-details`)} style={[styles.main, state.narrow && styles.stackedMain]}>
          <View {...elementProps(`account-eyebrow-heading`)} style={styles.eyebrowHeading}>
            <View {...elementProps(`account-eyebrow-line`)} style={styles.eyebrowLine} />
            <Text {...elementProps(`account-eyebrow`)} style={styles.eyebrow}>{`YOUR ACCOUNT`}</Text>
          </View>
          <View {...elementProps(`account-heading`)} style={styles.heading}>
            <TitleIcon {...elementProps(`account-title-icon`)} size={28} color={palette.accent} />
            <Text {...elementProps(`account-title`)} style={[styles.title, { fontSize: state.titleSize }]} accessibilityRole={`header`}>
              {profile ? <>{`Hello, `}<Text {...elementProps(`account-title-name`)} style={styles.name}>{`${user.name}.`}</Text></> : `Connections`}
            </Text>
          </View>
          {!profile && <Text {...elementProps(`account-description`)} style={styles.description}>{`Manage registrar connections securely for your own account.`}</Text>}
          {profile ? <>
            <ProfileSettings />
            <View {...elementProps(`profile-account-record`)} style={styles.accountRecord}>
              <Text {...elementProps(`profile-account-label`)} style={styles.accountLabel}>{`Account`}</Text>
              <View {...elementProps(`profile-account-value`)} style={styles.accountValue}><AccountActions stacked /></View>
            </View>
          </> : <AccountConnections />}
        </View>
        {profile && <View {...elementProps(`profile-sidebar`)} style={[styles.panel, state.narrow && styles.fullDetails]}>
          <Text {...elementProps(`profile-sidebar-title`)} style={styles.panelTitle} accessibilityRole={`header`}>{`Account Details`}</Text>
          <View {...elementProps(`profile-sidebar-record`)} style={styles.record}>
            {fields.map(({ id, label, Icon, value }, index) => <View key={id} {...elementProps(`profile-record-row`, id)} style={[styles.field, index > 0 && styles.separatedField]}>
              <Text {...elementProps(`profile-label`, id)} style={styles.label}>{label}</Text>
              <View {...elementProps(`profile-value-row`, id)} style={styles.valueRow}>
                <Icon {...elementProps(`profile-value-icon`, id)} size={18} color={palette.accent} />
                <Text {...elementProps(`profile-value`, id)} style={styles.value} selectable>{value}</Text>
              </View>
            </View>)}
          </View>
          <ProfileThemePreference />
          <View {...elementProps(`profile-portfolio`)} style={styles.portfolio}>
            <Text {...elementProps(`profile-portfolio-title`)} style={styles.eyebrow}>{`YOUR PORTFOLIO`}</Text>
            {state.stats.map(({ id, Icon, label, value }, index) => <View key={id} {...elementProps(`profile-portfolio-row`, id)} style={[styles.field, index > 0 && styles.separatedField]}>
              <Text {...elementProps(`profile-portfolio-label`, id)} style={styles.portfolioLabel}>{label}</Text>
              <View {...elementProps(`profile-portfolio-value`, id)} style={styles.statValueRow}>
                <Icon {...elementProps(`profile-portfolio-icon`, id)} size={15} color={palette.accent} />
                <Text {...elementProps(`profile-portfolio-stat`, id)} style={styles.value}>{value}</Text>
              </View>
            </View>)}
            {!!state.error && <Text {...elementProps(`profile-portfolio-error`)} style={styles.error} accessibilityRole={`alert`}>{state.error}</Text>}
          </View>
          <View {...elementProps(`profile-account-identity`)} style={styles.identity}>
            <Text {...elementProps(`profile-account-mode`)} style={styles.identityText}>{state.connectionMode}</Text>
            <Text {...elementProps(`profile-account-id`)} style={styles.identityText} selectable>{user.id}</Text>
          </View>
        </View>}
      </View>
    </View>
  </View>;
};

export default AccountPage;
