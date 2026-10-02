import { Link } from 'expo-router';
import { Roles } from '../../types/types';
import { useAccountPage } from './useAccountPage';
import ProfileSettings from '../ProfileSettings';
import AccountConnections from '../AccountConnections';
import { elementProps } from '../../shared/elementProps';
import { Text, Pressable, View, StyleSheet } from 'react-native';
import { PlugZap, UserRound, LayoutDashboard, ShieldCheck } from 'lucide-react-native';

const AccountPage = ({ page = `profile` }: { page?: `profile` | `connections` | `dashboard` }) => {
  const state = useAccountPage(page);
  const { styles, palette, user } = state;
  const fields = [
    { key: `name`, label: `Name`, value: user?.name },
    { key: `email`, label: `Email`, value: user?.email },
    { key: `role`, label: `Role`, value: user?.role },
    { key: `created`, label: `Joined`, value: user?.created ? new Date(user.created).toLocaleDateString() : `` },
    { key: `id`, label: `Account ID`, value: user?.id },
  ];
  const headings = {
    profile: { eyebrow: `A LITTLE ABOUT YOU`, title: `Your profile.`, copy: `Set your profile visibility and keep your account details together.` },
    connections: { eyebrow: `PRIVATE CONNECTIONS`, title: `Connections.`, copy: `Prepare your registrar connections in one place.` },
    dashboard: { eyebrow: `ON THIS DEVICE`, title: `Dashboard.`, copy: `Local account activity and an overview of your own portfolio.` },
  };
  return (
    <View {...elementProps(`account-page`, page)} style={[styles.root, state.compact && styles.compact]}>
      <View {...elementProps(`account-sidebar`)} style={[styles.sidebar, state.compact && styles.compactSidebar]}>
        <Text {...elementProps(`account-sidebar-title`)} style={styles.eyebrow}>{`YOUR ACCOUNT`}</Text>
        <Link href={`/profile`} asChild>
          <Pressable {...elementProps(`account-sidebar-profile`)} style={StyleSheet.flatten([styles.link, page === `profile` && styles.activeLink])}>
            <UserRound {...elementProps(`account-profile-icon`)} size={16} color={page === `profile` ? palette.accent : palette.muted} />
            <Text {...elementProps(`account-profile-text`)} style={styles.linkText}>{`Profile`}</Text>
          </Pressable>
        </Link>
        <Link href={`/profile/connections`} asChild>
          <Pressable {...elementProps(`account-sidebar-connections`)} style={StyleSheet.flatten([styles.link, page === `connections` && styles.activeLink])}>
            <PlugZap {...elementProps(`account-connections-icon`)} size={16} color={page === `connections` ? palette.accent : palette.muted} />
            <Text {...elementProps(`account-connections-text`)} style={styles.linkText}>{`Connections`}</Text>
          </Pressable>
        </Link>
        {user?.role === Roles.Owner && (
          <Link href={`/dashboard`} asChild>
            <Pressable {...elementProps(`account-sidebar-dashboard`)} style={StyleSheet.flatten([styles.link, page === `dashboard` && styles.activeLink])}>
              <LayoutDashboard {...elementProps(`account-dashboard-icon`)} size={16} color={page === `dashboard` ? palette.accent : palette.muted} />
              <Text {...elementProps(`account-dashboard-text`)} style={styles.linkText}>{`Dashboard`}</Text>
            </Pressable>
          </Link>
        )}
      </View>
      <View {...elementProps(`account-content`)} style={styles.content}>
        <Text {...elementProps(`account-eyebrow`)} style={styles.eyebrow}>{headings[page].eyebrow}</Text>
        <Text {...elementProps(`account-title`)} style={styles.title} accessibilityRole={`header`}>{headings[page].title}</Text>
        <Text {...elementProps(`account-description`)} style={styles.description}>
          {headings[page].copy}
        </Text>
        {page === `profile` ? (
          <>
            <ProfileSettings />
            <View {...elementProps(`profile-details`)} style={styles.panel}>
              {fields.map(field => (
                <View key={field.key} {...elementProps(`profile-field`, field.key)} style={styles.field}>
                  <Text {...elementProps(`profile-label`, field.key)} style={styles.label}>{field.label}</Text>
                  <Text {...elementProps(`profile-value`, field.key)} style={styles.value} selectable>{field.value || `—`}</Text>
                </View>
              ))}
              <View {...elementProps(`profile-device-note`)} style={styles.note}>
                <ShieldCheck {...elementProps(`profile-device-icon`)} size={16} color={palette.accent} />
                <Text {...elementProps(`profile-device-text`)} style={styles.noteText}>{`Local sign-in keeps records separate on this device. Accounts do not sync between devices.`}</Text>
              </View>
            </View>
          </>
        ) : page === `connections` ? (
          <AccountConnections />
        ) : (
          <>
            <View {...elementProps(`dashboard-stats`)} style={styles.stats}>
              {state.stats.map(stat => (
                <View key={stat.id} {...elementProps(`dashboard-stat`, stat.id)} style={styles.stat}>
                  <Text {...elementProps(`dashboard-stat-label`, stat.id)} style={styles.label}>{stat.label}</Text>
                  {state.loading ? <View {...elementProps(`dashboard-stat-skeleton`, stat.id)} style={styles.skeleton} /> : (
                    <Text {...elementProps(`dashboard-stat-value`, stat.id)} style={styles.statValue}>{stat.value}</Text>
                  )}
                </View>
              ))}
            </View>
            {!!state.error && <Text {...elementProps(`dashboard-error`)} style={styles.error} accessibilityRole={`alert`}>{state.error}</Text>}
            <View {...elementProps(`dashboard-roles`)} style={styles.panel}>
              <Text {...elementProps(`dashboard-roles-title`)} style={styles.panelTitle}>{`Accounts by role`}</Text>
              {state.loading ? <View {...elementProps(`dashboard-roles-skeleton`)} style={styles.skeleton} /> : state.roles.map(item => (
                <View key={item.role} {...elementProps(`dashboard-role`, item.role.toLowerCase())} style={styles.roleRow}>
                  <Text {...elementProps(`dashboard-role-label`, item.role.toLowerCase())} style={styles.label}>{`${item.role} · ${item.count}`}</Text>
                  <View {...elementProps(`dashboard-role-track`, item.role.toLowerCase())} style={styles.track}>
                    <View {...elementProps(`dashboard-role-bar`, item.role.toLowerCase())} style={[styles.bar, { width: `${Math.round(item.count / Math.max(state.users.length, 1) * 100)}%` }]} />
                  </View>
                </View>
              ))}
            </View>
            <View {...elementProps(`dashboard-users`)} style={styles.panel}>
              <Text {...elementProps(`dashboard-users-title`)} style={styles.panelTitle}>{`Local users`}</Text>
              {state.loading ? <View {...elementProps(`dashboard-users-skeleton`)} style={styles.skeleton} /> : state.users.map(account => (
                <View key={account.id} {...elementProps(`dashboard-user`, account.id)} style={styles.userRow}>
                  <View {...elementProps(`dashboard-user-details`, account.id)} style={styles.userDetails}>
                    <Text {...elementProps(`dashboard-user-name`, account.id)} style={styles.value}>{account.name}</Text>
                    <Text {...elementProps(`dashboard-user-email`, account.id)} style={styles.label}>{account.email}</Text>
                  </View>
                  <View {...elementProps(`actionsCell`, account.id)} style={styles.statusCell}>
                    <View {...elementProps(`rowStatus`, account.id)} style={styles.statusCell}>
                      <View {...elementProps(`statusDotWrap`, account.id)}>
                        <View {...elementProps(`statusDot`, account.id)} style={[styles.dot, { backgroundColor: account.active ? palette.success : palette.muted }]} />
                      </View>
                      <Text {...elementProps(`statusText`, account.id)} style={styles.label}>{account.active ? `Active` : `Inactive`}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    </View>
  );
};

export default AccountPage;
