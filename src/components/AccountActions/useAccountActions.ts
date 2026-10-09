import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { accountActions } from './actions';
import { routes } from '../../shared/routes';
import { useWindowDimensions } from 'react-native';
import { useAuth } from '../../shared/authContext/useAuth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AccountAction } from '../../shared/authentication/types';

export { accountActions } from './actions';

export const useAccountActions = () => {
  const auth = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const pending = useRef(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(``);
  const [signOutError, setSignOutError] = useState(``);
  const [selectedId, setSelectedId] = useState<AccountAction | null>(null);
  const selected = accountActions.find(action => action.id === selectedId);
  const disabled = auth.busy || auth.loading;
  const roomy = width >= 1100;

  const selectAction = (id: AccountAction) => {
    if (disabled || pending.current) return;
    auth.clearError();
    auth.clearNotice();
    setError(``);
    setSignOutError(``);
    setSelectedId(id);
  };
  const closeConfirmation = () => {
    if (disabled) return;
    setError(``);
    setSelectedId(null);
  };
  const signOut = async () => {
    if (disabled || pending.current) return;
    pending.current = true;
    setSignOutError(``);
    auth.clearError();
    auth.clearNotice();
    try {
      await auth.signOut();
      router.replace(routes.home.href);
    } catch (failure) {
      setSignOutError(failure instanceof Error ? failure.message : `Could Not Sign Out`);
    } finally {
      pending.current = false;
    }
  };
  const confirmAction = async () => {
    if (disabled || pending.current || !selectedId) return;
    pending.current = true;
    setError(``);
    try {
      await auth.manageAccount(selectedId);
      setSelectedId(null);
      router.replace(routes.signin.href);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : `Could Not Update Your Account`);
    } finally {
      pending.current = false;
    }
  };

  const dialogPadding = {
    paddingTop: Math.max(16, insets.top), paddingLeft: Math.max(16, insets.left),
    paddingRight: Math.max(16, insets.right), paddingBottom: Math.max(16, insets.bottom),
  };
  return {
    open, error, roomy, signOut, selected, disabled, signOutError, selectAction, confirmAction, closeConfirmation,
    dialogPadding, wideDialog: width >= 800, compactDialog: height < 500, extraWideDialog: width >= 1200,
    dialogMaxHeight: Math.max(0, Math.min(height * .92, height - dialogPadding.paddingTop - dialogPadding.paddingBottom)),
    expanded: roomy || open, toggleOpen: () => setOpen(current => !current),
  };
};
