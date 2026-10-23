import type { PropsWithChildren } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { useAuth } from '../../shared/authContext/useAuth';
import { routes, resolveAuthReturnTo } from '../../shared/routes';
import { useStarterAccess } from '../../shared/plans/useStarterAccess';

export type StarterPlanGateProps = PropsWithChildren<{ feature: `auction` | `community` }>;

export const useStarterPlanGate = (feature: StarterPlanGateProps[`feature`]) => {
  const auth = useAuth();
  const router = useRouter();
  const access = useStarterAccess();
  const returnTo = resolveAuthReturnTo(usePathname());
  const signedIn = Boolean(auth.user);
  const title = feature === `auction` ? `Auction` : `Community`;
  const description = feature === `auction`
    ? `Explore auction listings, filter inventory, and research domains with Starter or a higher plan.`
    : `Explore domain portfolios, follow builders, and share updates with Starter or a higher plan.`;
  const viewPlans = () => router.push(routes.pricing.href);
  const signIn = () => router.push({ params: { returnTo }, pathname: routes.signin.href });
  return { ...access, title, signIn, signedIn, viewPlans, description };
};
