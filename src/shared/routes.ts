import { Roles } from '../types/types';

export const routes = {
  home: { href: `/`, label: `Home`, icon: `House` },
  search: { href: `/search`, label: `Search`, icon: `Search`, minRole: Roles.Subscriber, requiresConnection: true },
  domains: { href: `/domains`, label: `Domains`, icon: `Globe2` },
  community: { href: `/community`, label: `Community`, icon: `UsersRound`, minRole: Roles.Subscriber },
  connections: { href: `/profile/connections`, label: `Connections`, icon: `PlugZap`, minRole: Roles.Subscriber },
  profile: { href: `/profile`, label: `Profile`, icon: `UserRound`, minRole: Roles.Subscriber, redirects: [`account`] },
  dashboard: { href: `/dashboard`, label: `Dashboard`, icon: `LayoutDashboard`, minRole: Roles.Owner },
  signin: { href: `/signin`, label: `Sign In`, icon: `LogIn`, redirects: [`login`, `log-in`, `sign-in`] },
  signup: { href: `/signup`, label: `Sign Up`, icon: `UserPlus`, redirects: [`register`, `sign-up`] },
  about: { href: `/about`, label: `About`, icon: `Info`, redirects: [`about-us`] },
  terms: { href: `/terms`, label: `Terms`, icon: `FileText`, redirects: [`terms-of-service`] },
  contact: { href: `/contact`, label: `Contact`, icon: `Mail`, redirects: [`contact-us`] },
  privacy: { href: `/privacy`, label: `Privacy`, icon: `ShieldCheck`, redirects: [`privacy-policy`] },
} as const;

export type AuthReturnPath = Exclude<(typeof routes)[keyof typeof routes][`href`], `/signin` | `/signup`>;
const authReturnPaths = Object.values(routes).map(route => route.href)
  .filter((href): href is AuthReturnPath => href !== routes.signin.href && href !== routes.signup.href);
export const resolveAuthReturnTo = (value: unknown): AuthReturnPath => authReturnPaths.find(href => href === value) ?? routes.domains.href;

export const navigation = [routes.home, routes.about, routes.domains, routes.search, routes.community, routes.contact];
export const footerLinks = [routes.terms, routes.privacy];
