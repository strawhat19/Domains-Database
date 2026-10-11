import { useMemo, type ReactElement } from 'react';
import { Link } from 'expo-router';
import { createStyles } from './styles.native';
import { elementProps } from '../../shared/elementProps';
import { ChevronDown, ChevronLeft } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAccountSidebar, type AccountSidebarProps, type SidebarLink } from './useAccountSidebar';

const AccountSidebar = (props: AccountSidebarProps) => {
  const state = useAccountSidebar(props);
  const { palette, collapsed, compact } = state;
  const styles = useMemo(() => createStyles(palette), [palette]);
  const iconOnly = collapsed && !compact;
  const renderLink = (link: SidebarLink, child = false) => {
    const Icon = link.Icon;
    const active = state.isActive(link);
    const highlighted = active || Boolean(link.children?.length && state.isGroupActive(link));
    return <Link key={link.id} href={link.href} asChild><Pressable
      accessibilityRole={`link`}
      accessibilityLabel={state.getCountLabel(link)}
      accessibilityState={{ selected: active }}
      {...elementProps(`account-sidebar-link`, link.id)}
      style={StyleSheet.flatten([styles.link, highlighted && styles.activeLink, iconOnly && styles.iconLink, child && !iconOnly && styles.childLink])}
    >
      <Icon {...elementProps(`account-sidebar-link-icon`, link.id)} size={15} color={highlighted ? palette.accent : palette.muted} />
      {!iconOnly && <Text {...elementProps(`account-sidebar-link-label`, link.id)} style={[styles.linkLabel, highlighted && styles.activeLabel]} numberOfLines={1}>{link.label}</Text>}
      {!iconOnly && (link.countLoading ? <View {...elementProps(`account-sidebar-count-skeleton`, link.id)} style={styles.skeleton} /> : (link.count ?? 0) > 0 && <View {...elementProps(`account-sidebar-count`, link.id)} style={[styles.badge, active && styles.activeBadge]}><Text {...elementProps(`account-sidebar-count-label`, link.id)} style={[styles.badgeLabel, active && styles.activeBadgeLabel]}>{link.count}</Text></View>)}
    </Pressable></Link>;
  };
  const renderItem = (link: SidebarLink, depth = 0): ReactElement => {
    const expanded = iconOnly || state.expandedRoutes.includes(link.id);
    const hasChildren = Boolean(link.children?.length);
    return <View key={link.id} {...elementProps(`account-sidebar-item`, link.id)} style={styles.group}>
      <View {...elementProps(`account-sidebar-heading`, link.id)} style={styles.heading}>
        <View {...elementProps(`account-sidebar-parent`, link.id)} style={styles.parentLink}>{renderLink(link, depth > 0)}</View>
        {hasChildren && !iconOnly && <Pressable {...elementProps(`account-sidebar-toggle`, link.id)} style={styles.submenuToggle} onPress={() => state.toggleSubmenu(link.id)} accessibilityRole={`button`} accessibilityLabel={`${expanded ? `Collapse` : `Expand`} ${link.label} Submenu`} accessibilityState={{ expanded }}><ChevronDown {...elementProps(`account-sidebar-toggle-icon`, link.id)} size={16} color={palette.accent} style={{ transform: [{ rotate: expanded ? `180deg` : `0deg` }] }} /></Pressable>}
      </View>
      {expanded && hasChildren && <View {...elementProps(`account-sidebar-submenu`, link.id)} style={[styles.children, depth > 0 && styles.nestedChildren, iconOnly && styles.railChildren]}>{link.children?.map(child => renderItem(child, depth + 1))}</View>}
    </View>;
  };
  return <View {...elementProps(`account-sidebar`)} accessibilityLabel={`Account Navigation`} style={[styles.root, compact && styles.compact, iconOnly && styles.collapsed]}>
    {!!state.preferenceError && !iconOnly && <Text {...elementProps(`account-sidebar-preference-error`)} style={styles.error} accessibilityRole={`alert`}>{state.preferenceError}</Text>}
    {!(compact && collapsed) && <View {...elementProps(`account-sidebar-links`)} style={styles.links}>
      {state.groups.map(group => <View key={group.id} {...elementProps(`account-sidebar-group`, group.id)} style={styles.group}>
        {!iconOnly && <Text {...elementProps(`account-sidebar-group-label`, group.id)} style={styles.groupLabel}>{group.label}</Text>}
        {group.links.map(link => renderItem(link))}
      </View>)}
    </View>}
    <View {...elementProps(`account-sidebar-footer`)} style={styles.footer}>
      {!collapsed && <Link href={state.profileLink.href} asChild><Pressable {...elementProps(`account-sidebar-profile-summary`)} style={styles.profile} accessibilityRole={`link`} accessibilityLabel={`Profile`}>
        <View {...elementProps(`account-sidebar-avatar`)} style={[styles.avatar, { backgroundColor: palette.accent }]}>
          <Text {...elementProps(`account-sidebar-initial`)} style={styles.initial}>{state.initial}</Text>
          {state.photoURL && <Image {...elementProps(`account-sidebar-photo`)} style={styles.photo} source={{ uri: state.photoURL }} onError={state.handlePhotoError} accessible={false} accessibilityElementsHidden />}
        </View>
        <Text {...elementProps(`account-sidebar-profile-label`)} style={styles.linkLabel}>{`Profile`}</Text>
      </Pressable></Link>}
      <Pressable {...elementProps(`account-sidebar-collapse`)} style={[styles.toggle, iconOnly && styles.fullToggle]} accessibilityRole={`button`} onPress={state.toggleCollapsed} accessibilityState={{ expanded: !collapsed }} accessibilityLabel={`${collapsed ? `Expand` : `Collapse`} Sidebar`}><ChevronLeft {...elementProps(`account-sidebar-collapse-icon`)} size={19} color={palette.accent} style={{ transform: [{ rotate: compact ? collapsed ? `-90deg` : `90deg` : collapsed ? `180deg` : `0deg` }] }} /></Pressable>
    </View>
  </View>;
};

export default AccountSidebar;
