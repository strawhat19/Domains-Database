import type { Plan } from '../../shared/models/plans/Plan';
import { useAuth } from '../../shared/authContext/useAuth';
import { getPlanAuthHref, resolveEnrollmentPlan, getPlanEnrollmentHref } from '../../shared/plans/enrollment';

export const usePricingEnrollment = () => {
  const { user, loading } = useAuth();
  const signedIn = !!user?.active && !user?.anonymous;
  const getAction = (plan: Plan, formatText: (value: string) => string) => {
    const slug = resolveEnrollmentPlan(plan.slug);
    if (!slug) return null;
    return {
      href: getPlanEnrollmentHref(slug, signedIn),
      signinHref: getPlanAuthHref(slug, `signin`),
      label: slug === `free` ? signedIn ? `Open Portfolio` : `Create Free Account` : signedIn ? `Review ${formatText(plan.name)} Plan` : `Continue With ${formatText(plan.name)}`,
    };
  };
  return { loading, signedIn, getAction };
};
