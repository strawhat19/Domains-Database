import { Link } from 'expo-router';
import { Roles } from '../../types/types';
import { useUserMenu } from './useUserMenu';
import { routes } from '../../shared/routes';
import { elementProps } from '../../shared/elementProps';
import { canAccessAdmin } from '../../shared/admin/permissions';
import { Image, Platform, Pressable, Text, View } from 'react-native';
import { Crown, LogIn, LogOut, PlugZap, UserRound, BadgeCheck, ShieldCheck, UserRoundPlus, LayoutDashboard } from 'lucide-react-native';

const decorativeIconProps = Platform.OS === `web` ? { 'aria-hidden': true } : { accessible: false };

const UserMenu = () => {
  const state = useUserMenu();
  const { user, styles, palette } = state;
  const isOwner = user?.role === Roles.Owner;
  const RoleIcon = isOwner ? Crown : canAccessAdmin(user) ? ShieldCheck : UserRound;
  const GuestIcon = state.guestAuth.href === routes.signin.href ? LogIn : UserRoundPlus;
  if (state.loading && !user) return (
    <View {...elementProps(`user-menu-loading`)} style={styles.skeleton} accessibilityLabel={`Loading Account`} accessibilityRole={`progressbar`}>
      <UserRound {...elementProps(`user-menu-loading-icon`)} size={20} color={palette.muted} />
    </View>
  );
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
        <View {...elementProps(`user-menu-avatar`)} style={[styles.avatar, { backgroundColor: user.color?.color || `#138b8b` }]}>
          <Text {...elementProps(`user-menu-initial`)} style={[styles.initial, { color: user.color?.type === `light` ? `#133b50` : `#ffffff` }]}>
            {(user.name?.trim()?.[0] || `U`).toUpperCase()}
          </Text>
          {!!state.photoURL && (
            Platform.OS === `web` ? (
              <img
                alt={``}
                aria-hidden
                draggable={false}
                id={`user-menu-photo`}
                src={state.photoURL}
                key={state.photoRequestKey}
                referrerPolicy={`no-referrer`}
                onError={state.onPhotoError}
                onLoad={event => event.currentTarget.naturalWidth > 0 ? state.onPhotoLoad() : state.onPhotoError()}
                className={`user-menu-photo${state.photoLoaded ? ` user-menu-photo-loaded` : ``}`}
              />
            ) : (
              <Image
                resizeMode={`cover`}
                key={state.photoRequestKey}
                onLoad={state.onPhotoLoad}
                onError={state.onPhotoError}
                source={{ uri: state.photoURL }}
                accessibilityElementsHidden
                style={[styles.photo, { opacity: state.photoLoaded ? 1 : 0 }]}
                importantForAccessibility={`no-hide-descendants`}
                {...elementProps(`user-menu-photo`)}
              />
            )
          )}
        </View>
      </Pressable>
      {state.open && (
        <View {...elementProps(`user-menu-options`)} style={styles.options}>
          <View {...elementProps(`user-menu-heading`)} style={styles.heading}>
            <View {...elementProps(`user-menu-identity`)} style={styles.identity}>
              <Text {...elementProps(`user-menu-name`)} style={styles.name} numberOfLines={1}>{user.name}</Text>
              <Text {...elementProps(`user-menu-email`)} style={styles.email} numberOfLines={1}>{user.email}</Text>
            </View>
            <View {...elementProps(`user-menu-pills`)} style={styles.pills}>
              <View {...elementProps(`user-menu-role-pill`)} style={styles.pill}>
                <RoleIcon {...elementProps(`user-menu-role-icon`)} size={10} color={palette.ink} style={styles.pillIcon} {...decorativeIconProps} />
                <Text {...elementProps(`user-menu-role-text`)} style={styles.pillText} numberOfLines={1} accessibilityLabel={`Role: ${user.role}`}>{user.role}</Text>
              </View>
              {!isOwner && (
                <View {...elementProps(`user-menu-plan-pill`)} style={[styles.pill, styles.planPill]}>
                  <BadgeCheck {...elementProps(`user-menu-plan-icon`)} size={10} color={palette.contrast} style={styles.pillIcon} {...decorativeIconProps} />
                  <Text {...elementProps(`user-menu-plan-text`)} style={[styles.pillText, styles.planPillText]} numberOfLines={1} accessibilityLabel={`Plan: ${state.planLabel}`}>{state.planLabel}</Text>
                </View>
              )}
            </View>
          </View>
          <Link href={`/profile`} asChild>
            <Pressable {...elementProps(`user-menu-profile`)} style={styles.item} accessibilityRole={`link`}>
              <UserRound {...elementProps(`user-menu-profile-icon`)} size={16} color={palette.ink} />
              <Text {...elementProps(`user-menu-profile-text`)} style={styles.linkText}>{`Profile`}</Text>
            </Pressable>
          </Link>
          {canAccessAdmin(user) && (
            <Link href={routes.dashboard.href} asChild>
              <Pressable {...elementProps(`user-menu-dashboard`)} style={styles.item} accessibilityRole={`link`} onPress={state.close}>
                <LayoutDashboard {...elementProps(`user-menu-dashboard-icon`)} size={16} color={palette.ink} />
                <Text {...elementProps(`user-menu-dashboard-text`)} style={styles.linkText}>{`Dashboard`}</Text>
              </Pressable>
            </Link>
          )}
          <Link href={`/profile/connections`} asChild>
            <Pressable
              style={styles.item}
              onPress={state.close}
              accessibilityRole={`link`}
              {...elementProps(`user-menu-connections`)}
              accessibilityLabel={state.verifiedConnectionCount ? `Connections, ${state.verifiedConnectionCount} Verified Saved Connection${state.verifiedConnectionCount === 1 ? `` : `s`}` : `Connections`}
            >
              <PlugZap {...elementProps(`user-menu-connections-icon`)} size={16} color={palette.ink} />
              <Text {...elementProps(`user-menu-connections-text`)} style={styles.linkText}>{`Connections`}</Text>
              {!state.connectionsCountLoading && state.verifiedConnectionCount > 0 && (
                <View {...elementProps(`user-menu-connections-badge`)} style={[styles.badge, { backgroundColor: state.badgeColors.backgroundColor }]} accessibilityElementsHidden importantForAccessibility={`no-hide-descendants`}>
                  <Text {...elementProps(`user-menu-connections-count`)} style={[styles.badgeText, { color: state.badgeColors.color }]}>{state.verifiedConnectionCount}</Text>
                </View>
              )}
            </Pressable>
          </Link>
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
