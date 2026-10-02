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
      { title: `Start with what you know`, body: [`Add a domain by hand or import a CSV from your own records. Hostinger, GoDaddy, GoDaddy Auctions, and Namecheap are available as registrar labels. This first version uses sample data and records you enter; it does not discover or synchronize registrar accounts.`] },
      { title: `Make it yours`, body: [`Sample domains are fictional and are never a claim of ownership. Add your own records, delete samples, and export a CSV whenever you need a portable copy. Your portfolio stays in this browser or device.`] },
    ],
  },
  privacy: {
    title: `Your portfolio stays with you.`,
    eyebrow: `PRIVACY POLICY`,
    description: `A simple explanation of how this frontend MVP handles your information.`,
    sections: [
      { title: `What is saved`, body: [`Domain names, owner names, registrar labels, renewal dates, auto-renew preferences, estimated renewal prices, and notes are saved locally on the device where you use the app. There is no account database or registrar connection in this version.`] },
      { title: `What leaves your device`, body: [`The app does not upload your portfolio. Export creates a CSV that you can choose to download or share. Following an external link opens that provider's website, which has its own privacy practices.`] },
      { title: `Your controls`, body: [`Edit or remove your records in the portfolio. Clearing this site's browser data or removing the mobile app can also remove locally stored records. Export a backup before doing so. Records are not synchronized between devices.`] },
      { title: `Credentials`, body: [`Do not put passwords, API keys, or other secrets in domain notes or CSV files. This version does not request registrar credentials. Any future account integration will require a separate, secure connection flow.`] },
    ],
  },
  terms: {
    title: `A clear understanding.`,
    eyebrow: `TERMS OF USE`,
    description: `These terms describe the current local portfolio MVP.`,
    sections: [
      { title: `An inventory, not a registrar`, body: [`Domains Database helps you organize information you provide. It does not register, renew, transfer, buy, or sell domains. Editing auto-renew here updates your inventory preference only; it does not change the setting in your registrar account.`] },
      { title: `Keep registrar records authoritative`, body: [`Check your registrar account for actual ownership, expiration dates, pricing, and renewal settings. Status labels in this app are calculated from the dates in your inventory. Sample records are illustrative.`] },
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
    title: `The local portfolio interface.`,
    eyebrow: `DEVELOPER DIRECTORY`,
    description: `A frontend service directory for the future API. These operations run in device storage today.`,
    sections: [
      { title: `GET /api`, body: [`Returns the local service directory and storage mode through api.getRoutes(). No HTTP server is running.`] },
      { title: `GET /api/domains`, body: [`api.getDomains() reads the domain inventory from local storage.`] },
      { title: `POST /api/domains`, body: [`api.createDomain(input) adds a domain and assigns its app-owned ID and sequence number.`] },
      { title: `PATCH /api/domains/:id`, body: [`api.updateDomain(id, input) updates an inventory record.`] },
      { title: `DELETE /api/domains/:id`, body: [`api.deleteDomain(id) removes an inventory record.`] },
      { title: `POST /api/domains/import`, body: [`api.importDomains(inputs) imports normalized CSV records into the local inventory.`] },
      { title: `POST /api/domains/sample`, body: [`api.resetSampleData() replaces the local inventory with the fictional sample portfolio.`] },
    ],
  },
};
