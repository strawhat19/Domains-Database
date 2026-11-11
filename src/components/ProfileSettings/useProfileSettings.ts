import { authAPI } from '../../api/auth';
import { useFocusEffect } from 'expo-router';
import { Providers } from '../../types/types';
import { useCallback, useEffect, useState } from 'react';
import { useLocalStorage } from '../../shared/config';
import { marketplaceAPI } from '../../api/marketplace';
import { getPublicProfileHref } from '../../shared/routes';
import { useAuth } from '../../shared/authContext/useAuth';
import type { ProfilePrivacy } from '../../shared/models/users/User';
import { sellerUsernamePattern } from '../../shared/marketplace/paths';

export const useProfileSettings = () => {
  const { user, refreshUser, loginRevision } = useAuth();
  const [name, setName] = useState(``);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(``);
  const [notice, setNotice] = useState(``);
  const [description, setDescription] = useState(``);
  const [publicDomains, setPublicDomains] = useState(false);
  const [privacy, setPrivacy] = useState<ProfilePrivacy>(`private`);
  const [profileHandle, setProfileHandle] = useState<{ scope: string; username: string } | null>(null);
  const publicProfileId = user?.active && user.profilePrivacy === `public` ? user.id : null;
  const handleScope = !useLocalStorage && publicProfileId ? `${publicProfileId}:${loginRevision}:${user?.updated ?? ``}` : null;
  useEffect(() => {
    setName(user?.name ?? ``);
    setDescription(user?.description ?? ``);
    setPublicDomains(user?.publicDomains ?? false);
    setPrivacy(user?.profilePrivacy ?? `private`);
  }, [user?.id, user?.updated]);
  useFocusEffect(useCallback(() => {
    setProfileHandle(null);
    if (!publicProfileId || !handleScope) return;
    const controller = new AbortController();
    void marketplaceAPI.getPublicProfileHandle(publicProfileId, controller.signal).then(({ username }) => {
      if (!controller.signal.aborted && typeof username === `string` && sellerUsernamePattern.test(username)) {
        setProfileHandle({ scope: handleScope, username });
      }
    }, () => undefined);
    return () => controller.abort();
  }, [handleScope, publicProfileId]));
  const dismiss = () => { setError(``); setNotice(``); };
  const dirty = name.trim() !== user?.name || description !== (user?.description ?? ``) || privacy !== user?.profilePrivacy || publicDomains !== Boolean(user?.publicDomains);
  const canPublish = privacy === `public`;
  const profileUsername = profileHandle?.scope === handleScope ? profileHandle?.username : undefined;
  const publicProfileHref = publicProfileId ? getPublicProfileHref(profileUsername ?? publicProfileId) : null;
  const cancel = () => {
    dismiss();
    setName(user?.name ?? ``);
    setDescription(user?.description ?? ``);
    setPublicDomains(user?.publicDomains ?? false);
    setPrivacy(user?.profilePrivacy ?? `private`);
  };
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
  return { name, busy, dirty, error, cancel, notice, privacy, canPublish, description, publicDomains, publicProfileHref, save, dismiss, setName, setDescription, changePrivacy, setPublicDomains, email: user?.email ?? ``, isGoogle: user?.provider === Providers.Google || Boolean(user?.providerId?.includes(`google`)) };
};
