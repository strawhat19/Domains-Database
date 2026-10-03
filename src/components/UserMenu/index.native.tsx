import { Link } from 'expo-router';
import { Roles } from '../../types/types';
import { useUserMenu } from './useUserMenu';
import { elementProps } from '../../shared/elementProps';
import { Image, Pressable, Text, View } from 'react-native';
import { LogIn, LogOut, PlugZap, UserRound, UserRoundPlus, LayoutDashboard } from 'lucide-react-native';

const UserMenu = () => {
  const state = useUserMenu();
  const { user, styles, palette } = state;
  const GuestIcon = state.hasSavedAccount ? LogIn : UserRoundPlus;
  if (state.loading) return <View {...elementProps(`user-menu-loading`)} style={styles.skeleton} />;
  if (!user) return (
    <Link href={state.guestAuth.href} asChild>
      <Pressable {...elementProps(`user-menu-signin`)} style={styles.signin} accessibilityRole={`link`}>
        <GuestIcon {...elementProps(`user-menu-signin-icon`)} size={16} color={palette.ink} />
        <Text {...elementProps(`user-menu-signin-text`)} style={styles.linkText}>{state.guestAuth.label}</Text>
      </Pressable>
    </Link>
  );
  return (
    <View {...elementProps(`user-menu`)} style={styles.root}>
      <Pressable
        {...elementProps(`user-menu-button`)}
        disabled={state.busy}
        style={styles.button}
        onPress={state.toggle}
        accessibilityRole={`button`}
        accessibilityLabel={`${user.name} Account Menu`}
        accessibilityState={{ expanded: state.open }}
      >
        {user.photoURL ? (
          <Image {...elementProps(`user-menu-avatar`)} style={styles.avatar} source={{ uri: user.photoURL }} accessibilityLabel={user.name} />
        ) : (
          <View {...elementProps(`user-menu-avatar`)} style={[styles.avatar, { backgroundColor: user.color.color }]}>
            <Text {...elementProps(`user-menu-initial`)} style={[styles.initial, { color: user.color.type === `light` ? `#133b50` : `#ffffff` }]}>
              {(user.name?.[0] || `U`).toUpperCase()}
            </Text>
          </View>
        )}
      </Pressable>
      {state.open && (
        <View {...elementProps(`user-menu-options`)} style={styles.options}>
          <View {...elementProps(`user-menu-heading`)} style={styles.heading}>
            <Text {...elementProps(`user-menu-name`)} style={styles.name} numberOfLines={1}>{user.name}</Text>
            <Text {...elementProps(`user-menu-email`)} style={styles.email} numberOfLines={1}>{user.email}</Text>
          </View>
          <Link href={`/profile`} asChild>
            <Pressable {...elementProps(`user-menu-profile`)} style={styles.item} accessibilityRole={`link`}>
              <UserRound {...elementProps(`user-menu-profile-icon`)} size={16} color={palette.ink} />
              <Text {...elementProps(`user-menu-profile-text`)} style={styles.linkText}>{`Profile`}</Text>
            </Pressable>
          </Link>
          <Link href={`/profile/connections`} asChild>
            <Pressable {...elementProps(`user-menu-connections`)} style={styles.item} accessibilityRole={`link`}>
              <PlugZap {...elementProps(`user-menu-connections-icon`)} size={16} color={palette.ink} />
              <Text {...elementProps(`user-menu-connections-text`)} style={styles.linkText}>{`Connections`}</Text>
            </Pressable>
          </Link>
          {user.role === Roles.Owner && (
            <Link href={`/dashboard`} asChild>
              <Pressable {...elementProps(`user-menu-dashboard`)} style={styles.item} accessibilityRole={`link`}>
                <LayoutDashboard {...elementProps(`user-menu-dashboard-icon`)} size={16} color={palette.ink} />
                <Text {...elementProps(`user-menu-dashboard-text`)} style={styles.linkText}>{`Dashboard`}</Text>
              </Pressable>
            </Link>
          )}
          {!!state.error && <Text {...elementProps(`user-menu-error`)} style={styles.error} accessibilityRole={`alert`}>{state.error}</Text>}
          <Pressable {...elementProps(`user-menu-signout`)} style={[styles.item, styles.signout]} disabled={state.busy} onPress={() => void state.signOut()}>
            <LogOut {...elementProps(`user-menu-signout-icon`)} size={16} color={palette.danger} />
            <Text {...elementProps(`user-menu-signout-text`)} style={styles.signoutText}>{state.busy ? `Signing out…` : `Sign out`}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

export default UserMenu;
