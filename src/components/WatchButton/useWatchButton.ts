import { useEffect, useState } from 'react';
import { routes } from '../../shared/routes';
import { usePathname, useRouter } from 'expo-router';
import { useAuth } from '../../shared/authContext/useAuth';
import { useWatching } from '../../shared/watching/useWatching';
import type { DomainSearchDomainResult } from '../../shared/domainSearch/types';

export const useWatchButton = (result: DomainSearchDomainResult) => {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const watching = useWatching();
  const [saving, setSaving] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const watched = watching.isWatching(result.domain);
  const disabled = auth.loading || Boolean(auth.user && (watching.loading || watching.busy));

  useEffect(() => setPromptOpen(false), [pathname, auth.user?.id]);

  const watch = async () => {
    if (disabled || saving) return;
    if (!auth.user) { setPromptOpen(true); return; }
    if (watched) { router.push(routes.watching.href); return; }
    setSaving(true);
    try {
      await watching.watchDomain(result);
    } catch {
      // The shared watching context displays persistence failures.
    } finally {
      setSaving(false);
    }
  };

  const signIn = (pathname: `/signin` | `/signup`) => {
    setPromptOpen(false);
    router.push({ pathname, params: { q: result.domain, returnTo: routes.search.href } });
  };

  return { watch, signIn, saving, watched, disabled, promptOpen, dismissPrompt: () => setPromptOpen(false) };
};
