import { Types } from '../../types/types';
import { useFocusEffect, useRouter } from 'expo-router';
import { useLocalStorage } from '../../shared/config';
import { marketplaceAPI } from '../../api/marketplace';
import { useCallback, useState } from 'react';
import { isAppCollectionID } from '../../shared/common/ids';
import { getPublicProfileHref } from '../../shared/routes';
import type { PublicProfile } from '../../shared/models/users/User';
import { sellerUsernamePattern } from '../../shared/marketplace/paths';
import { readPublicProfileById } from '../../shared/publicDirectory/readPublicProfileById';

type ProfileResult = { id: string; profile: PublicProfile | null; error: boolean };

export const usePublicProfile = (id: string) => {
  const router = useRouter();
  const [result, setResult] = useState<ProfileResult | null>(null);
  const [revision, setRevision] = useState(0);
  const current = result?.id === id ? result : null;
  const profile = current?.profile ?? null;

  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    setResult(null);
    const load = async () => {
      if (!useLocalStorage && id.length <= 250 && !/[/\u0000-\u001f\u007f]/.test(id) && isAppCollectionID(id, Types.User)) {
        const handle = await marketplaceAPI.getPublicProfileHandle(id, controller.signal).catch(() => null);
        if (controller.signal.aborted) return;
        if (typeof handle?.username === `string` && sellerUsernamePattern.test(handle.username)) {
          router.replace(getPublicProfileHref(handle.username));
          return;
        }
      }
      return readPublicProfileById(id);
    };
    void load().then(profile => {
      if (!controller.signal.aborted && profile !== undefined) setResult({ id, profile, error: false });
    }, () => {
      if (!controller.signal.aborted) setResult({ id, profile: null, error: true });
    });
    return () => controller.abort();
  }, [id, revision, router]));

  return {
    profile,
    loading: !current,
    error: current?.error ?? false,
    retry: () => setRevision(value => value + 1),
  };
};
