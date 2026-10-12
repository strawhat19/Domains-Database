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
  adminUsers: { href: `/users`, label: `Users`, icon: `UsersRound`, adminSection: `users`, redirects: [`admin/users`] },
  adminFeatures: { href: `/features`, label: `Features`, icon: `SlidersHorizontal`, adminSection: `features`, redirects: [`admin/features`] },
  adminDomains: { href: `/admin/domains`, label: `Domains`, icon: `Globe2`, adminSection: `domains` },
  adminEvents: { href: `/events`, label: `Events`, icon: `CalendarDays`, adminSection: `events`, redirects: [`admin/events`] },
  adminPlans: { href: `/plans`, label: `Plans`, icon: `Wallet`, adminSection: `plans`, redirects: [`admin/plans`] },
  adminNotifications: { href: `/admin/notifications`, label: `Notifications`, icon: `Bell`, adminSection: `notifications` },
  adminFeedback: { href: `/feedback`, label: `Feedback`, icon: `MessageCircle`, adminSection: `feedback`, redirects: [`admin/feedback`] },
  adminReviews: { href: `/reviews`, label: `Reviews`, icon: `Star`, adminSection: `reviews`, redirects: [`admin/feedback/reviews`] },
  adminAIChats: { href: `/ai-chats`, label: `Chats`, icon: `Bot`, adminSection: `aiChats`, redirects: [`admin/feedback/ai-chats`] },
  adminMessages: { href: `/messages`, label: `Messages`, icon: `MessagesSquare`, adminSection: `messages`, redirects: [`admin/feedback/messages`] },
  adminRequests: { href: `/requests`, label: `Forms`, icon: `ClipboardList`, adminSection: `formSubmissions`, redirects: [`admin/requests`] },
  adminFormSubmissions: { href: `/form-submissions`, label: `Forms`, icon: `ClipboardList`, adminSection: `formSubmissions`, redirects: [`admin/feedback/form-submissions`] },
  adminReports: { href: `/reports`, label: `Reports`, icon: `FileText`, adminSection: `reports`, redirects: [`admin/reports`] },
  adminAnalytics: { href: `/analytics`, label: `Analytics`, icon: `ChartNoAxesCombined`, adminSection: `analytics`, redirects: [`admin/analytics`] },
  adminObservability: { href: `/observability`, label: `Health`, icon: `Activity`, adminSection: `observability`, redirects: [`admin/observability`] },
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

type AuthReturnRoute = (typeof routes)[Exclude<keyof typeof routes, `signin` | `signup`>];
export type AuthReturnPath = AuthReturnRoute[`href`];
const authReturnRoutes = Object.values(routes).filter((route): route is AuthReturnRoute => route.href !== routes.signin.href && route.href !== routes.signup.href);
export const resolveAuthReturnTo = (value: unknown): AuthReturnPath => authReturnRoutes.find(route => route.href === value
  || (`redirects` in route && route.redirects.some(alias => `/${alias}` === value)))?.href ?? routes.domains.href;
const adminPaths: readonly string[] = Object.values(routes).filter(route => `adminSection` in route).map(route => route.href);
export const isAdminPath = (pathname: string) => adminPaths.includes(pathname) || pathname === `/admin` || pathname.startsWith(`/admin/`);

export const navigation = [routes.home, routes.about, routes.blog, routes.domains, routes.search, routes.watching, routes.auction, routes.community, routes.contact];
export const footerLinks = [routes.terms, routes.privacy];
