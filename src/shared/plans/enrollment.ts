import { routes } from '../routes';

export type EnrollmentPlan = `free` | `starter`;
export const resolveEnrollmentPlan = (value: unknown): EnrollmentPlan | `` => value === `free` || value === `starter` ? value : ``;
export const getPlanAuthHref = (plan: EnrollmentPlan, mode: `signin` | `signup` = `signup`) => ({
  pathname: mode === `signin` ? routes.signin.href : routes.signup.href,
  params: { plan, returnTo: plan === `free` ? routes.domains.href : routes.subscription.href },
});
export const getPlanEnrollmentHref = (plan: EnrollmentPlan, signedIn: boolean) => !signedIn
  ? getPlanAuthHref(plan)
  : plan === `free` ? routes.domains.href : { pathname: routes.subscription.href, params: { plan } };
