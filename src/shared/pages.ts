import { useSampleData } from './config';

export type PageName = `about` | `terms` | `contact` | `privacy` | `api`;
export type PageSection = { title: string; body: string[] };
export type PageContent = { title: string; eyebrow: string; description: string; sections: PageSection[] };

export const pageContent: Record<PageName, PageContent> = {
  about: {
    title: `A little order. A lot of clarity.`,
    eyebrow: `ABOUT DOMAINS DATABASE`,
    description: `One place to keep track of the names you own, wherever you registered them.`,
    sections: [
      { title: `Your names, together`, body: [`Domains Database brings your personal domain inventory into one calm, readable view. Keep names, registrars, owners, renewal dates, and yearly costs together. Search your portfolio in seconds and see which renewals deserve attention.`] },
      { title: `Bring in your domains`, body: [`Choose GoDaddy, Namecheap, or Hostinger in Add Domain. Follow the account instructions, enter your actual domain details or import a registrar CSV, then review and save them. Your records stay in this browser or device; registrar accounts are not automatically synchronized.`] },
      { title: `Make it yours`, body: [useSampleData ? `Start with a guest portfolio or create a local account to keep separate records. Sample domains are fictional. Add your own records and export a CSV whenever you need a portable copy.` : `Start with a guest portfolio or create a local account to keep separate records. Add your own domains, edit their records, and export a CSV whenever you need a portable copy.`] },
      { title: `A local Community`, body: [`Choose a public profile to share posts with other accounts on this device. Profiles start private, and sharing domain names is a separate choice. Community does not publish to the internet or sync between devices.`] },
    ],
  },
  privacy: {
    title: `Your portfolio stays with you.`,
    eyebrow: `PRIVACY POLICY`,
    description: `A simple explanation of how this frontend MVP handles your information.`,
    sections: [
      { title: `What is saved`, body: [`Your local account name, email, profile, password verifier, and session are saved on this device, along with domain records and portfolio preferences. Passwords are stored as salted hashes. Guest records and account portfolios use separate storage. Posts and follows form a device-local Community; registrar connection values use separate private account storage. There is no remote account database or automatic registrar sync.`] },
      { title: `What leaves your device`, body: [`The app does not upload your portfolio or Community records. Export creates a CSV that you can choose to download or share. Public image URLs in posts and domain favicons contact external hosting sites when displayed. Following an external link opens that provider's website, which has its own privacy practices.`] },
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
    title: `Good things start with a conversation.`,
    eyebrow: `CONTACT`,
    description: `Ideas, feedback, or a detail you would like to improve?`,
    sections: [
      { title: `Get in touch with Piratechs`, body: [`Visit piratechs.com to find the current ways to contact the team. Please do not include registrar passwords or API keys in any message.`] },
      { title: `Need help with a domain?`, body: [`For ownership, billing, renewals, auction purchases, or account access, contact the registrar holding the domain. This app only maintains your local inventory.`] },
    ],
  },
  api: {
    title: `The local app interface.`,
    eyebrow: `DEVELOPER DIRECTORY`,
    description: `The app's internal asynchronous services. These operations use device storage; this page is a directory, not an HTTP server.`,
    sections: [
      { title: `GET /api`, body: [`Returns the local service directory and storage mode through api.getRoutes(). No HTTP server is running.`] },
      { title: `GET /api/health and /api/status`, body: [`api.getHealth() and api.getStatus() describe the local service mode. authAPI.getStatus() also reports whether a local session is active.`] },
      { title: `POST /api/auth/sign-up and /api/auth/sign-in`, body: [`authAPI.signUp(input) creates a Subscriber account; authAPI.signIn(input) checks its local password verifier. Both are consumed by the authentication context and form.`] },
      { title: `GET /api/auth/session and POST /api/auth/sign-out`, body: [`authAPI.restoreSession() restores a valid local session; authAPI.signOut() removes it and revokes its token. Sessions expire after thirty days.`] },
      { title: `GET /api/users`, body: [`authAPI.getUsers() lists public local user profiles for the Owner role. Password verifiers remain outside public User records. New sign-ups remain Subscribers.`] },
      { title: `GET /api/domains`, body: [`api.getDomains() reads the current account's inventory or the isolated guest portfolio from local storage.`] },
      { title: `Profile privacy and sharing`, body: [`authAPI.updateProfile(input) edits the current user's allowed profile fields. authAPI.getPublicProfiles() projects eligible public profiles without emails or credentials. api.getPublicDomainSummaries(userIds) includes only opted-in public profiles' domain names and registrars.`] },
      { title: `Private account connections`, body: [`connectionsAPI.getConnections(), saveConnections(values), and clearConnections() restore the session and use separate account-private storage. These operations save values only; no registrar request is made.`] },
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
