import { useRef, useState } from 'react';
import { Roles } from '../../types/types';
import { adminAPI } from '../../api/admin';
import { useAuth } from '../../shared/authContext/useAuth';
import type { User } from '../../shared/models/users/User';
import { useCollectionPage } from '../../shared/firebase/useCollectionPage';
import { canInspectAccounts, canManageRoles, canManageAccountStatus } from '../../shared/admin/permissions';

export const useAdminUsers = () => {
  const { user } = useAuth();
  const actor = canInspectAccounts(user) ? `${user?.id}:${user?.role}` : ``;
  const page = useCollectionPage(actor, adminAPI.subscribeUsersPage);
  const scope = useRef(actor);
  const saving = useRef(false);
  scope.current = actor;
  const [feedback, setFeedback] = useState({ actor, busy: ``, notice: ``, error: `` });
  const current = feedback.actor === actor ? feedback : { actor, busy: ``, notice: ``, error: `` };
  const save = async (target: User, input: { role?: Roles; active?: boolean }) => {
    if (saving.current) return false;
    saving.current = true;
    const requestScope = actor;
    setFeedback({ actor, busy: target.id, notice: ``, error: `` });
    try {
      await adminAPI.updateUserAccess(target.id, input);
      if (scope.current === requestScope) setFeedback({ actor, busy: ``, error: ``, notice: `Account Access Updated` });
      return scope.current === requestScope;
    } catch (failure) {
      if (scope.current === requestScope) setFeedback({ actor, busy: ``, notice: ``, error: failure instanceof Error ? failure.message : `Account Could Not Be Updated` });
      return false;
    } finally { saving.current = false; }
  };
  return { user, page, ...current, save, canEditRole: canManageRoles(user), canEditStatus: (target: User) => canManageAccountStatus(user, target) };
};
