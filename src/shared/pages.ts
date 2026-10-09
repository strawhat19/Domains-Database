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
      { title: `Bring in your domains`, body: [`Save registrar values in Profile → Connections to check your accounts and import their registered domains. The same check runs when you sign in. Hostinger also discovers eligible externally registered domains from its accessible websites. You can enter records manually or import a CSV. Signed-in domains, custom details, groups, collections, and project statuses are saved privately with your Firebase account.`] },
      { title: `Find your next name`, body: [`Search available registrars without signing in when public search is enabled. Otherwise, sign in and save a registrar connection to unlock Search. Enter a name without an extension to explore domain variants, with popular extensions first, or enter a full domain to check that address. Each domain has one card comparing available registrars, with purchase links that open in a new browser tab. Refresh Website Info adds public performance scores and popularity ranks to your portfolio; those values do not measure visitors.`] },
      { title: `Make it yours`, body: [useSampleData ? `Browse a separate guest portfolio or sign in with email and password, or Google on the website, to load your saved account data across devices. Sample domains are fictional. Export a CSV whenever you need a portable copy.` : `Browse a separate guest portfolio or sign in with email and password, or Google on the website, to load your saved account data across devices. Guest and old local data are not automatically moved into your account; use CSV import to bring in domains explicitly.`] },
      { title: `Private account profiles`, body: [`Profiles start private. Community, public profile discovery, and public domain sharing are unavailable in cloud mode. A saved Public preference does not publish your account data. Optional local mode keeps its Community on the current browser or device.`] },
    ],
  },
  privacy: {
    title: `Your data. Your control.`,
    eyebrow: `PRIVACY POLICY`,
    description: `How your account portfolio and registrar connections handle your information.`,
    sections: [
      { title: `What is saved`, body: [`Firebase Authentication manages sign-in, passwords, and session credentials. Firestore saves your account profile, domain records and custom metadata, connections, groups, collections, project statuses, and portfolio preferences. Private account data is accessible to your authenticated account and trusted app Owners. Guest records and old local accounts remain separate in browser or device storage and are not automatically uploaded.`] },
      { title: `Contact messages`, body: [`The contact form saves your name, email address, subject, message, submission time, and signed-in Firebase user ID when available. Messages are stored in Firestore and can only be read and managed by trusted app Owners. You can submit without an account. Contact submissions are separate from your portfolio and are retained when account data is reset. No confirmation or notification emails are sent. Explicit local mode stores submissions on the current browser or device.`] },
      { title: `What leaves your device`, body: [`Account sign-in and saved account data are sent to Firebase. Your portfolio loads and registrar syncing starts after you open Domains. Syncing sends configured connection values through the app's server to their registrar for read-only domain requests. Hostinger discovery sends domain names, without account credentials, to public registry RDAP services to identify the registrar. The relay does not persist connection values; returned domains are saved to your account. CSV exports can be downloaded or shared. Domain favicons, external images, and provider links contact their hosting sites.`] },
      { title: `Domain search and website information`, body: [`Submitting Search sends the requested domain and saved connection values through the server to each supported connected registrar. Refresh Website Info sends chosen domain names to Google PageSpeed Insights and Tranco for public performance and rank lookups, without registrar credentials. Results and source dates are saved in your account portfolio. These services and registrar purchase links have their own privacy practices.`] },
      { title: `Profile visibility`, body: [`Profiles start private. Cloud Community, public profile discovery, and public domain sharing are unavailable until a safe public sharing service is connected. Selecting Public does not publish your Firestore profile or portfolio. Optional local mode shares eligible profiles and posts only between accounts on the same browser or device.`] },
      { title: `Your controls`, body: [`Edit or remove portfolio records and sign out from your avatar menu. Profile can delete saved cloud data while keeping connections, or delete data and connections together; both reset profile sharing and sign out after cleanup. Account deletion and deactivation are unavailable for Firebase accounts. Clearing browser data or removing the app does not delete Firestore account records, but can remove guest records and local sessions. Export a backup before deleting data.`] },
      { title: `Credentials`, body: [`Connections saves registrar values separately from account profile records. Your authenticated account and trusted app Owners can read those private Firestore records. The client sends the values to the read-only registrar relay when needed; this is not a server-only secret vault or app-managed credential encryption. Values are excluded from public projections and CSV exports. Optional local mode saves values on the current device. Do not put passwords or API keys in posts, domain notes, or CSV files.`] },
    ],
  },
  terms: {
    title: `A clear understanding.`,
    eyebrow: `TERMS OF USE`,
    description: `These terms describe the current account portfolio MVP.`,
    sections: [
      { title: `An inventory, not a registrar`, body: [`Domains Database helps you organize information you provide. It does not register, renew, transfer, buy, or sell domains. Editing auto-renew here updates your inventory preference only; it does not change the setting in your registrar account.`] },
      { title: `Keep registrar records authoritative`, body: [`Check your registrar account for actual ownership, expiration dates, pricing, and renewal settings. Status labels in this app are calculated from the dates in your inventory.`] },
      { title: `Your responsibility`, body: [`Enter information you are authorized to use and keep your own backups. Guest and local-mode storage can be cleared on your device. Bulk cloud changes can partially save if a later request fails; refresh and review before retrying. This MVP is provided as-is; no guarantee is made that a reminder or renewal will occur.`] },
      { title: `Current account features`, body: [`New accounts start as free Subscribers. Pricing gates, payments, file storage, uploads, and Cloud Functions are not integrated. Google sign-in is available on the website; native apps support email and password while native Google setup remains pending.`] },
    ],
  },
  contact: {
    title: `Let's talk.`,
    eyebrow: `CONTACT`,
    description: `Ideas, feedback, or a detail you would like to improve?`,
    sections: [
      { title: `Send us a message`, body: [`Use the contact form to share an idea, report an issue, or ask about Domains Database. Your message is saved privately for the team to review. Please do not include registrar passwords or API keys.`] },
      { title: `Need help with a domain?`, body: [`For ownership, billing, renewals, auction purchases, or registrar account access, contact the registrar holding the domain. This app maintains your inventory and project details.`] },
    ],
  },
  api: {
    title: `The app interface.`,
    eyebrow: `DEVELOPER DIRECTORY`,
    description: `Shared asynchronous services, Firebase account storage, and the read-only registrar relay. Registrar requests run on the Expo server.`,
    sections: [
      { title: `GET /api`, body: [`This page documents the service directory and storage mode exposed through api.getRoutes(). Most listed operations are internal services backed by private Firestore account storage; the registrar relay below is an actual HTTP endpoint. Guest records and optional local-mode data use device storage.`] },
      { title: `GET /api/health and /api/status`, body: [`api.getHealth() and api.getStatus() describe the configured storage mode. authAPI.getStatus() also reports whether an authenticated session is active.`] },
      { title: `POST /api/auth/sign-up and /api/auth/sign-in`, body: [`authAPI.signUp(input) and authAPI.signIn(input) use Firebase email/password authentication. authAPI.signInWithGoogle() uses Google sign-in on web; native Google requires additional OAuth setup. New Firestore accounts use app-owned IDs, the Subscriber role, and the free plan. Client updates cannot grant Owner or change a plan.`] },
      { title: `GET /api/auth/session and POST /api/auth/sign-out`, body: [`authAPI.restoreSession() restores Firebase authentication and loads its linked app account; authAPI.signOut() signs out through Firebase. Local accounts are not automatically claimed or migrated into Firebase.`] },
      { title: `GET /api/users`, body: [`authAPI.getUsers() lists saved Firestore user records for the trusted Owner role. Firebase manages passwords outside profile records. Owner is assigned by a trusted administrator, not a sign-up or profile form.`] },
      { title: `Contact form and submissions`, body: [`formSubmissionsAPI.submitContact(input) saves validated public contact submissions in the private formSubmissions collection. A Firestore transaction allocates a monotonic number and matching app-owned ID, and security rules require the counter and new submission to be committed together. Submissions cannot be read or edited by visitors. formSubmissionsAPI.getSubmissions() and updateSubmissionStatus(id, status) are Owner-only services used by the Dashboard table. These are internal services, not email or HTTP endpoints.`] },
      { title: `GET /api/domains`, body: [`api.getDomains() reads the current account's private Firestore inventory or the separate guest portfolio from device storage. Custom metadata, groups, collections, project statuses, and table preferences stay scoped to the account.`] },
      { title: `Profile privacy and sharing`, body: [`authAPI.updateProfile(input) edits allowed profile fields. Cloud authAPI.getPublicProfiles() and api.getPublicDomainSummaries(userIds) return no public records; safe cloud projections and Community are not connected. A saved Public preference does not publish private account data.`] },
      { title: `Private account connections`, body: [`connectionsAPI.getConnections(), saveConnections(values), and clearConnections() restore the session and use private Firestore account records, separate from profiles. The current account and trusted Owners can read them. The shared domain context sends configured values to the read-only relay after saving, signing in, or restoring a session, then merges returned domains into the account.`] },
      { title: `POST /api/registrars/sync`, body: [`Accepts a supported registrar and its connection values, authenticates a read-only portfolio request, and returns allowlisted domain fields. Secrets stay out of responses, public records, and exports. Valid results populate the account table through api.syncRegistrarDomains(). Failed providers leave existing rows intact.`] },
      { title: `GET /api/registrars/search`, body: [`Lists supported registrars configured for public search, without returning credentials. Configured providers allow domain searches without signing in.`] },
      { title: `POST /api/registrars/search`, body: [`Accepts a domain and a supported registrar. When connection values are omitted, the server uses that registrar's configured environment credentials; supplied values use the existing account connection. It performs read-only availability and pricing lookups and returns normalized results with a registrar purchase link. The Search page combines independently queried providers. It does not register a domain or charge an account.`] },
      { title: `POST /api/registrars/extensions`, body: [`Accepts a supported registrar and optional connection values, using server environment credentials when values are omitted. Returns its domain extension catalog, including multi-part extensions. Name-only searches combine these catalogs, show popular extensions first, and check availability in batches as more variants are requested. Catalog failures are shown and common extensions provide a fallback.`] },
      { title: `POST /api/website-insights`, body: [`Accepts a public domain name and queries fixed Google PageSpeed Insights and Tranco endpoints. It returns dated performance/rank data and source-specific failures, without visitor estimates. api.saveWebsiteInsights() merges results into the current account's domain metadata.`] },
      { title: `Community`, body: [`Cloud Community is unavailable and returns no shared profiles or posts. Optional local mode retains its device-local feed, with public, follower, and private audiences enforced by the service.`] },
      { title: `POST /api/domains`, body: [`api.createDomain(input) adds a domain and assigns its app-owned ID and sequence number.`] },
      { title: `PATCH /api/domains/:id`, body: [`api.updateDomain(id, input) updates an inventory record.`] },
      { title: `DELETE /api/domains/:id`, body: [`api.deleteDomain(id) removes an inventory record.`] },
      { title: `POST /api/domains/import`, body: [`api.importDomains(inputs) imports normalized CSV records into the current inventory. Large cloud record changes use sequential atomic chunks; a later failure can leave earlier chunks saved and asks you to refresh before retrying.`] },
      { title: `POST /api/domains/export`, body: [`api.prepareExport() records the first export time and returns the inventory for CSV creation.`] },
      { title: `/api/notifications and /api/notifications/:id`, body: [`notificationsAPI provides getNotifications(), createNotification(input), updateNotification(id, input), and deleteNotification(id) for the signed-in user's private saved notification collection. It starts empty.`] },
      { title: `Account data controls`, body: [`authAPI.manageAccount() supports deleting cloud account data while retaining connections, or deleting data and connections together. Cleanup resets profile sharing and signs out; Firebase Auth account deletion and deactivation are unavailable. Pricing gates, payments, file storage, uploads, and Cloud Functions are not integrated.`] },
      ...(useSampleData ? [{ title: `POST /api/domains/sample`, body: [`api.resetSampleData() replaces the current inventory with the fictional sample portfolio.`] }] : []),
    ],
  },
};
