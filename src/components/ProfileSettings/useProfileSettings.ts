import { authAPI } from '../../api/auth';
import { useEffect, useState } from 'react';
import { useAuth } from '../../shared/authContext/useAuth';
import type { ProfilePrivacy } from '../../shared/models/users/User';

export const useProfileSettings = () => {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(``);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(``);
  const [notice, setNotice] = useState(``);
  const [description, setDescription] = useState(``);
  const [publicDomains, setPublicDomains] = useState(false);
  const [privacy, setPrivacy] = useState<ProfilePrivacy>(`private`);
  useEffect(() => {
    setName(user?.name ?? ``);
    setDescription(user?.description ?? ``);
    setPublicDomains(user?.publicDomains ?? false);
    setPrivacy(user?.profilePrivacy ?? `private`);
  }, [user?.id, user?.updated]);
  const dismiss = () => { setError(``); setNotice(``); };
  const changePrivacy = (value: ProfilePrivacy) => {
    dismiss();
    setPrivacy(value);
    if (value === `private`) setPublicDomains(false);
  };
  const save = async () => {
    if (busy || !user) return;
    dismiss();
    setBusy(true);
    try {
      await authAPI.updateProfile({ name, description, publicDomains, profilePrivacy: privacy }, user.id);
      await refreshUser();
      setNotice(`Profile Saved`);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : `Could Not Save Profile`);
    } finally { setBusy(false); }
  };
  return { name, busy, error, notice, privacy, description, publicDomains, save, dismiss, setName, setDescription, changePrivacy, setPublicDomains };
};
