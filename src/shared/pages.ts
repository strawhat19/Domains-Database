import { useSampleData } from './config';

export type PageName = `about` | `terms` | `contact` | `privacy` | `api`;
export type PageSection = { title: string; body: string[] };
export type PageContent = { title: string; eyebrow: string; description: string; sections: PageSection[] };

export const pageContent: Record<PageName, PageContent> = {
  about: {
    title: `Your domains, together.`,
    eyebrow: `ABOUT DOMAINS DATABASE`,
    description: `One place to keep track of the names you own, wherever you registered them.`,
    sections: [
      { title: `Your names, together`, body: [`Domains Database brings your personal domain inventory into one calm, readable view. Keep names, registrars, owners, renewal dates, and yearly costs together. Search your portfolio in seconds and see which renewals deserve attention.`] },
      { title: `Bring in your domains`, body: [`Save GoDaddy, Hostinger, Namecheap, Porkbun, or NameSilo values in Profile → Connections to check your accounts and import their registered domains. The same check runs when you sign in. Review externally hosted names before confirming ownership and including them. You can also enter records manually or import a CSV. Your combined inventory stays in this browser or device.`] },
      { title: `Find your next name`, body: [`Search available registrars without signing in when public search is enabled. Otherwise, sign in and save a registrar connection to unlock Search. Enter a name without an extension to explore domain variants, with popular extensions first, or enter a full domain to check that address. Each domain has one card comparing available registrars, with purchase links that open in a new browser tab. Refresh Website Info adds public performance scores and popularity ranks to your portfolio; those values do not measure visitors.`] },
      { title: `Make it yours`, body: [useSampleData ? `Start with a guest portfolio or create a local account to keep separate records. Sample domains are fictional. Add your own records and export a CSV whenever you need a portable copy.` : `Start with a guest portfolio or create a local account to keep separate records. Add your own domains, edit their records, and export a CSV whenever you need a portable copy.`] },
      { title: `A local Community`, body: [`Choose a public profile to share posts with other accounts on this device. Profiles start private, and sharing domain names is a separate choice. Community does not publish to the internet or sync between devices.`] },
    ],
  },
  privacy: {
    title: `Your data. Your control.`,
    eyebrow: `PRIVACY POLICY`,
    description: `How this local portfolio and its registrar connections handle your information.`,
    sections: [
      { title: `What is saved`, body: [`Your local account name, email, profile, password verifier, and session are saved on this device, along with domain records and portfolio preferences. Passwords are stored as salted hashes. Guest records and account portfolios use separate storage. Posts and follows form a device-local Community; registrar connection values use separate private account storage. There is no remote account database.`] },
      { title: `What leaves your device`, body: [`Saving connections, signing in, or restoring your session sends configured credentials through the app's server to their registrar for read-only domain requests. Hostinger discovery checks accessible website names with public registry RDAP services to identify the registrar; those registry requests contain domain names and no account credentials. The relay does not store credentials or upload your portfolio or Community records. Returned domains are saved to your local account. Export creates a CSV you can download or share. Public image URLs and domain favicons contact external hosting sites when displayed. External links open providers with their own privacy practices.`] },
      { title: `Domain search and website information`, body: [`Submitting Search sends the requested domain and saved connection credentials through the server to each supported connected registrar. Refresh Website Info sends chosen domain names to Google PageSpeed Insights and Tranco for public performance and rank lookups, without registrar credentials. Results and source dates are saved in your local portfolio. These services and registrar purchase links have their own privacy practices.`] },
      { title: `Profile visibility`, body: [`Profiles start private. Choose Public in Profile to share your name, bio, and public posts with other local accounts. Domain sharing is disabled by default and includes only domain names and registrar labels. Followers can see follower-only posts while your profile is public. Choosing Private hides your profile, posts, and shared domains from other accounts.`] },
      { title: `Your controls`, body: [`Edit or remove your records in the portfolio, and sign out from your avatar menu. Clearing this site's browser data or removing the mobile app can remove accounts and records. Export a backup before doing so. Records are not synchronized between devices. Local sign-in is a device-only demo; it does not secure records against someone who can edit this device's app storage.`] },
      { title: `Credentials`, body: [`Connections optionally saves registrar values privately for your local account. Values are excluded from public profiles, posts, domain summaries, and exports. Local storage is accessible to someone with access to this device; use a private backend for production credentials. Do not put passwords or API keys in posts, domain notes, or CSV files.`] },
    ],
  },
  terms: {
    title: `A clear understanding.`,
    eyebrow: `TERMS OF USE`,
    description: `These terms describe the current local portfolio MVP.`,
    sections: [
      { title: `An inventory, not a registrar`, body: [`Domains Database helps you organize information you provide. It does not register, renew, transfer, buy, or sell domains. Editing auto-renew here updates your inventory preference only; it does not change the setting in your registrar account.`] },
      { title: `Keep registrar records authoritative`, body: [`Check your registrar account for actual ownership, expiration dates, pricing, and renewal settings. Status labels in this app are calculated from the dates in your inventory.`] },
      { title: `Your responsibility`, body: [`Enter information you are authorized to use and keep your own backups. Browser or device storage can be cleared. This MVP is provided as-is; no guarantee is made that a reminder or renewal will occur.`] },
    ],
  },
  contact: {
    title: `Let's talk.`,
    eyebrow: `CONTACT`,
    description: `Ideas, feedback, or a detail you would like to improve?`,
    sections: [
      { title: `Get in touch with Piratechs`, body: [`Visit piratechs.com to find the current ways to contact the team. Please do not include registrar passwords or API keys in any message.`] },
      { title: `Need help with a domain?`, body: [`For ownership, billing, renewals, auction purchases, or account access, contact the registrar holding the domain. This app only maintains your local inventory.`] },
    ],
  },
  api: {
    title: `The app interface.`,
    eyebrow: `DEVELOPER DIRECTORY`,
    description: `Local asynchronous services and the read-only registrar relay. Account data uses device storage; registrar requests run on the Expo server.`,
    sections: [
      { title: `GET /api`, body: [`This page documents the local service directory and storage mode exposed through api.getRoutes(). Most listed operations are internal services; the registrar relay below is an actual HTTP endpoint.`] },
      { title: `GET /api/health and /api/status`, body: [`api.getHealth() and api.getStatus() describe the local service mode. authAPI.getStatus() also reports whether a local session is active.`] },
      { title: `POST /api/auth/sign-up and /api/auth/sign-in`, body: [`authAPI.signUp(input) creates a Subscriber account; authAPI.signIn(input) checks its local password verifier. Both are consumed by the authentication context and form.`] },
      { title: `GET /api/auth/session and POST /api/auth/sign-out`, body: [`authAPI.restoreSession() restores a valid local session; authAPI.signOut() removes it and revokes its token. Sessions expire after thirty days.`] },
      { title: `GET /api/users`, body: [`authAPI.getUsers() lists public local user profiles for the Owner role. Password verifiers remain outside public User records. New sign-ups remain Subscribers.`] },
      { title: `GET /api/domains`, body: [`api.getDomains() reads the current account's inventory or the isolated guest portfolio from local storage.`] },
      { title: `Profile privacy and sharing`, body: [`authAPI.updateProfile(input) edits the current user's allowed profile fields. authAPI.getPublicProfiles() projects eligible public profiles without emails or credentials. api.getPublicDomainSummaries(userIds) includes only opted-in public profiles' domain names and registrars.`] },
      { title: `Private account connections`, body: [`connectionsAPI.getConnections(), saveConnections(values), and clearConnections() restore the session and use account-private storage. The shared domain context checks configured connections after a save and on sign-in, then merges returned domains into the current account.`] },
      { title: `POST /api/registrars/sync`, body: [`Accepts a supported registrar and its connection values, authenticates a read-only portfolio request, and returns allowlisted domain fields. Secrets stay out of responses, public records, and exports. Valid results populate the local table through api.syncRegistrarDomains(). Failed providers leave existing rows intact.`] },
      { title: `GET /api/registrars/search`, body: [`Lists supported registrars configured for public search, without returning credentials. Configured providers allow domain searches without signing in.`] },
      { title: `POST /api/registrars/search`, body: [`Accepts a domain and a supported registrar. When connection values are omitted, the server uses that registrar's configured environment credentials; supplied values use the existing account connection. It performs read-only availability and pricing lookups and returns normalized results with a registrar purchase link. The Search page combines independently queried providers. It does not register a domain or charge an account.`] },
      { title: `POST /api/registrars/extensions`, body: [`Accepts a supported registrar and optional connection values, using server environment credentials when values are omitted. Returns its domain extension catalog, including multi-part extensions. Name-only searches combine these catalogs, show popular extensions first, and check availability in batches as more variants are requested. Catalog failures are shown and common extensions provide a fallback.`] },
      { title: `POST /api/website-insights`, body: [`Accepts a public domain name and queries fixed Google PageSpeed Insights and Tranco endpoints. It returns dated performance/rank data and source-specific failures, without visitor estimates. api.saveWebsiteInsights() merges results into the current account's local domain metadata.`] },
      { title: `Local Community`, body: [`socialAPI.getCommunity(view) returns an audience-filtered feed; social mutations derive identity from the current session. Public, followers, and private audiences are enforced by the service rather than only by the screen.`] },
      { title: `POST /api/domains`, body: [`api.createDomain(input) adds a domain and assigns its app-owned ID and sequence number.`] },
      { title: `PATCH /api/domains/:id`, body: [`api.updateDomain(id, input) updates an inventory record.`] },
      { title: `DELETE /api/domains/:id`, body: [`api.deleteDomain(id) removes an inventory record.`] },
      { title: `POST /api/domains/import`, body: [`api.importDomains(inputs) imports normalized CSV records into the local inventory.`] },
      { title: `POST /api/domains/export`, body: [`api.prepareExport() records the first export time and returns the inventory for CSV creation.`] },
      { title: `/api/notifications and /api/notifications/:id`, body: [`notificationsAPI provides getNotifications(), createNotification(input), updateNotification(id, input), and deleteNotification(id) for the signed-in user's local notification collection. It starts empty.`] },
      ...(useSampleData ? [{ title: `POST /api/domains/sample`, body: [`api.resetSampleData() replaces the local inventory with the fictional sample portfolio.`] }] : []),
    ],
  },
};
