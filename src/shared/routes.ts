import { Roles } from '../types/types';

export const routes = {
  home: { href: `/`, label: `Home`, icon: `House` },
  search: { href: `/search`, label: `Search`, icon: `Search`, requiresConnection: true },
  domains: { href: `/domains`, label: `Domains`, icon: `Globe2` },
  auction: { beta: true, href: `/auction`, label: `Auction`, icon: `Gavel` },
  watching: { href: `/watching`, label: `Watching`, icon: `Eye`, minRole: Roles.Subscriber },
  notifications: { href: `/notifications`, label: `Notifications`, icon: `Bell`, redirects: [`alerts`, `updates`, `notification`, `announcement`, `announcements`] },
  community: { beta: true, href: `/community`, label: `Community`, icon: `UsersRound`, minRole: Roles.Subscriber },
  connections: { href: `/profile/connections`, label: `Connections`, icon: `PlugZap`, minRole: Roles.Subscriber },
  profile: { href: `/profile`, label: `Profile`, icon: `UserRound`, minRole: Roles.Subscriber, redirects: [`account`] },
  dashboard: { href: `/dashboard`, label: `Overview`, icon: `LayoutDashboard`, adminSection: `overview` },
  adminUsers: { href: `/admin/users`, label: `Users`, icon: `UsersRound`, adminSection: `users` },
  adminDomains: { href: `/admin/domains`, label: `Domains`, icon: `Globe2`, adminSection: `domains` },
  adminPlans: { href: `/admin/plans`, label: `Plans`, icon: `Wallet`, adminSection: `plans` },
  adminNotifications: { href: `/admin/notifications`, label: `Notifications`, icon: `Bell`, adminSection: `notifications` },
  adminRequests: { href: `/admin/requests`, label: `Requests`, icon: `MessageCircle`, adminSection: `requests` },
  adminReports: { href: `/admin/reports`, label: `Reports`, icon: `FileText`, adminSection: `reports` },
  adminAnalytics: { href: `/admin/analytics`, label: `Analytics`, icon: `ChartNoAxesCombined`, adminSection: `analytics` },
  adminObservability: { href: `/admin/observability`, label: `Runtime Health`, icon: `Activity`, adminSection: `observability` },
  signin: { href: `/signin`, label: `Sign In`, icon: `LogIn`, redirects: [`login`, `log-in`, `sign-in`] },
  signup: { href: `/signup`, label: `Sign Up`, icon: `UserPlus`, redirects: [`register`, `sign-up`] },
  about: { href: `/about`, label: `About`, icon: `Info`, redirects: [`about-us`] },
  blog: { href: `/blog`, label: `Blog`, icon: `BookOpen` },
  pricing: { href: `/pricing`, label: `Pricing`, icon: `Wallet` },
  terms: { href: `/terms`, label: `Terms`, icon: `FileText`, redirects: [`terms-of-service`] },
  contact: { href: `/contact`, label: `Contact`, icon: `Mail`, redirects: [`contact-us`] },
  privacy: { href: `/privacy`, label: `Privacy`, icon: `ShieldCheck`, redirects: [`privacy-policy`] },
} as const;

export const getNotificationHref = (id: string) => ({
  params: { id },
  pathname: `/notifications/[id]` as const,
});

export type AuthReturnPath = Exclude<(typeof routes)[keyof typeof routes][`href`], `/signin` | `/signup`>;
const authReturnPaths = Object.values(routes).map(route => route.href)
  .filter((href): href is AuthReturnPath => href !== routes.signin.href && href !== routes.signup.href);
export const resolveAuthReturnTo = (value: unknown): AuthReturnPath => authReturnPaths.find(href => href === value) ?? routes.domains.href;

export const navigation = [routes.home, routes.about, routes.blog, routes.pricing, routes.domains, routes.search, routes.watching, routes.auction, routes.community, routes.contact];
export const footerLinks = [routes.terms, routes.privacy];
