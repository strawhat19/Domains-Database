import { useState } from 'react';
import { Roles } from '../../types/types';
import { useAdminUsers } from './useAdminUsers';
import { useLocalStorage } from '../../shared/config';
import type { User } from '../../shared/models/users/User';
import { firebaseEnabled } from '../../shared/firebase/config';

export const useAdminUserTable = () => {
  const state = useAdminUsers();
  const [search, setSearch] = useState(``);
  const [roleFilter, setRoleFilter] = useState(`all`);
  const actor = `${state.user?.id ?? ``}:${state.user?.role ?? ``}`;
  const [editor, setEditor] = useState({ actor, id: ``, role: Roles.Subscriber });
  const connected = firebaseEnabled && !useLocalStorage;
  const filter = search.trim().toLocaleLowerCase();
  const accounts = state.page.records;
  const roleOptions: Roles[] = Object.values(Roles).filter(role => role !== Roles.Guest && role !== Roles.Administrator);
  const editingId = editor.actor === actor ? editor.id : ``;
  const selectedRole = editor.actor === actor ? editor.role : Roles.Subscriber;
  const visible = accounts.filter(account => (roleFilter === `all` || account.role === roleFilter) && `${account.number} ${account.name} ${account.email} ${account.role} ${account.provider} ${account.active ? `active` : `inactive`}`.toLocaleLowerCase().includes(filter)).sort((first, second) => first.number - second.number);
  const canEdit = (account: User) => connected && account.id !== state.user?.id;
  const cancelEdit = () => setEditor({ actor, id: ``, role: Roles.Subscriber });
  const selectRole = (role: Roles) => setEditor({ actor, id: editingId, role });
  const beginEdit = (account: User) => {
    if (state.busy || !state.canEditRole || !canEdit(account)) return;
    setEditor({ actor, id: editingId === account.id ? `` : account.id, role: account.role as Roles });
  };
  const saveRole = async (account: User) => {
    if (!state.canEditRole || !canEdit(account) || editingId !== account.id || state.busy) return;
    if (await state.save(account, { role: selectedRole })) cancelEdit();
  };
  return { ...state, search, filter, visible, accounts, canEdit, connected, editingId, roleFilter, roleOptions, selectedRole, setSearch, beginEdit, cancelEdit, selectRole, saveRole, setRoleFilter, localPreview: useLocalStorage };
};
