import { Roles } from '../../types/types';
import { useMemo, useState } from 'react';
import { createStyles } from './styles.native';
import { useAdminUsers } from './useAdminUsers';
import { useLocalStorage } from '../../shared/config';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { firebaseEnabled } from '../../shared/firebase/config';
import { Text, View, Pressable, TextInput } from 'react-native';
import { AdminStats, StatusCell, AdminPanel, AdminButton, AdminLoading } from '../AdminWidgets';
import { Users, X, Shield, Check, Power, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react-native';

const AdminUsers = () => {
  const state = useAdminUsers();
  const { palette } = useTheme();
  const [search, setSearch] = useState(``);
  const [editingId, setEditingId] = useState(``);
  const [selectedRole, setSelectedRole] = useState<Roles>(Roles.Subscriber);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const accounts = state.page.records;
  const filter = search.trim().toLowerCase();
  const visible = accounts.filter(account => `${account.name} ${account.email} ${account.role}`.toLowerCase().includes(filter));
  const connected = firebaseEnabled && !useLocalStorage;
  const saveRole = async (account: typeof accounts[number]) => {
    if (await state.save(account, { role: selectedRole })) setEditingId(``);
  };
  return <View {...elementProps(`admin-users`)} style={styles.root}>
    <AdminStats id={`users`} loading={state.page.loading} stats={[
      { id: `loaded`, Icon: Users, label: `Accounts On This Page`, value: accounts.length },
      { id: `active`, label: `Active`, value: accounts.filter(account => account.active).length },
      { id: `inactive`, label: `Inactive`, value: accounts.filter(account => !account.active).length },
    ]} />
    <AdminPanel id={`users`} title={`Account Directory`} note={`Realtime Page ${state.page.page} · Search Applies To This Page · Role Changes Require Owner Access`}>
      {!connected ? <Text {...elementProps(`admin-users-mode`)} style={styles.detail}>{useLocalStorage ? `Local Account Preview · Connect Firebase To Manage Access` : `Firebase Configuration Required To Manage Access`}</Text> : null}
      <TextInput {...elementProps(`admin-user-search`)} value={search} onChangeText={setSearch} style={styles.input} placeholder={`Search Name, Email, Or Role`} placeholderTextColor={palette.placeholder} accessibilityLabel={`Search Accounts On This Page`} />
      {state.error || state.page.error ? <Text {...elementProps(`admin-users-error`)} style={styles.error} accessibilityRole={`alert`}>{state.error || state.page.error}</Text> : null}
      {state.notice ? <Text {...elementProps(`admin-users-notice`)} style={styles.success} accessibilityLiveRegion={`polite`}>{state.notice}</Text> : null}
      {state.page.loading ? <AdminLoading id={`users`} /> : visible.length ? <View {...elementProps(`admin-users-rows`)} style={styles.rows}>
        {visible.map(account => <View key={account.id} {...elementProps(`admin-user-row`, account.id)} style={styles.row}>
          <View {...elementProps(`admin-user-heading`, account.id)} style={styles.heading}>
            <View {...elementProps(`admin-user-avatar`, account.id)} style={styles.avatar}><Text {...elementProps(`admin-user-initial`, account.id)} style={styles.initial}>{account.name?.[0]?.toUpperCase() || `U`}</Text></View>
            <View {...elementProps(`admin-user-identity`, account.id)} style={styles.identity}><Text {...elementProps(`admin-user-name`, account.id)} style={styles.name}>{account.name || `Unnamed Account`}</Text><Text {...elementProps(`admin-user-email`, account.id)} style={styles.detail} selectable>{account.email || `—`}</Text></View>
            <View {...elementProps(`admin-user-role-badge`, account.id)} style={styles.badge}><Text {...elementProps(`admin-user-role-label`, account.id)} style={styles.detail}>{account.role === `Administrator` ? `Admin (Legacy)` : account.role}</Text></View>
            <StatusCell id={account.id} label={account.active ? `Active` : `Inactive`} tone={account.active ? `green` : `gray`} />
          </View>
          <Text {...elementProps(`admin-user-metadata`, account.id)} style={styles.detail}>{`#${account.number} · Joined ${new Date(account.created).toLocaleDateString()} · ${account.provider}`}</Text>
          {connected && account.id !== state.user?.id ? <View {...elementProps(`admin-user-actions`, account.id)} style={styles.actions}>
            {state.canEditRole ? <AdminButton id={`${account.id}-role`} Icon={Shield} label={`Change Role`} disabled={!!state.busy} onPress={() => { setEditingId(editingId === account.id ? `` : account.id); setSelectedRole(account.role as Roles); }} /> : null}
            {state.canEditStatus(account) ? <AdminButton id={`${account.id}-status`} Icon={Power} label={state.busy === account.id ? `Saving` : account.active ? `Deactivate` : `Reactivate`} disabled={!!state.busy} onPress={() => { void state.save(account, { active: !account.active }); }} /> : null}
          </View> : null}
          {editingId === account.id && state.canEditRole ? <View {...elementProps(`admin-user-role-editor`, account.id)} style={styles.actions}>
            {Object.values(Roles).filter(role => role !== Roles.Guest && role !== Roles.Administrator).map(role => <Pressable key={role} {...elementProps(`admin-user-role-option`, `${account.id}-${role}`)} disabled={!!state.busy} accessibilityRole={`button`} accessibilityState={{ selected: selectedRole === role }} onPress={() => setSelectedRole(role)} style={[styles.badge, selectedRole === role && { borderWidth: 1, borderColor: palette.accent }]}><Text {...elementProps(`admin-user-role-text`, `${account.id}-${role}`)} style={styles.detail}>{role}</Text></Pressable>)}
            <AdminButton id={`${account.id}-save-role`} Icon={Check} label={`Save Role`} disabled={!!state.busy || selectedRole === account.role} onPress={() => { void saveRole(account); }} />
            <AdminButton id={`${account.id}-cancel-role`} Icon={X} label={`Cancel`} disabled={!!state.busy} onPress={() => setEditingId(``)} />
          </View> : null}
        </View>)}
      </View> : !state.page.error ? <Text {...elementProps(`admin-users-empty`)} style={styles.detail}>{filter ? `No Matching Accounts On This Page` : `No Accounts Yet`}</Text> : null}
      <View {...elementProps(`admin-users-pagination`)} style={styles.actions}>
        <AdminButton id={`users-previous`} Icon={ArrowLeft} label={`Previous`} disabled={state.page.loading || !!state.busy || !state.page.hasPrevious} onPress={state.page.previousPage} />
        <Text {...elementProps(`admin-users-page-number`)} style={styles.detail}>{`Page ${state.page.page}`}</Text>
        <AdminButton id={`users-next`} Icon={ArrowRight} label={`Next`} disabled={state.page.loading || !!state.busy || !state.page.hasNext} onPress={state.page.nextPage} />
        <AdminButton id={`users-refresh`} Icon={RotateCcw} label={`Latest`} disabled={state.page.loading || !!state.busy} onPress={state.page.refresh} />
      </View>
    </AdminPanel>
  </View>;
};

export default AdminUsers;
