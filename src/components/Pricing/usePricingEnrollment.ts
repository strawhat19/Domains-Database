import type { Plan } from '../../shared/models/plans/Plan';
import { useAuth } from '../../shared/authContext/useAuth';
import { useStarterAccess } from '../../shared/plans/useStarterAccess';
import { getPlanAuthHref, resolveEnrollmentPlan, getPlanEnrollmentHref } from '../../shared/plans/enrollment';

export const usePricingEnrollment = () => {
  const { user, loading } = useAuth();
  const access = useStarterAccess();
  const signedIn = !!user?.active && !user?.anonymous;
  const getAction = (plan: Plan, formatText: (value: string) => string) => {
    const slug = resolveEnrollmentPlan(plan.slug);
    if (!slug) return null;
    return {
      href: getPlanEnrollmentHref(slug, signedIn),
      signinHref: getPlanAuthHref(slug, `signin`),
      label: slug === `free` ? signedIn ? `Open Portfolio` : `Sign Up`
        : access.owner ? `View Owner Access` : signedIn && access.allowed ? `Manage Subscription`
        : signedIn ? `Review ${formatText(plan.name)} Plan` : `Sign Up`,
    };
  };
  return { loading: loading || access.loading, signedIn, getAction };
};
