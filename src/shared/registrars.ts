export type SetupRegistrar = `GoDaddy` | `Namecheap` | `Hostinger`;

export const SETUP_REGISTRARS: SetupRegistrar[] = [
  `GoDaddy`,
  `Namecheap`,
  `Hostinger`,
];

export const registrarGuides: Record<SetupRegistrar, {
  url: string;
  label: string;
  steps: string[];
  csvStep: string;
  sourceUrl: string;
}> = {
  GoDaddy: {
    label: `GoDaddy Domain Portfolio`,
    url: `https://dcc.godaddy.com/`,
    sourceUrl: `https://www.godaddy.com/help/export-a-list-of-my-domains-3681`,
    csvStep: `Drop the exported CSV below or choose Browse CSV, then review and save your domains.`,
    steps: [
      `Sign in to GoDaddy and open Domain Portfolio. Select the domains you want to add here.`,
      `Choose Export as .CSV from the action menu (or More), select All Columns, and leave authorization codes unchecked. Choose Export domains, then Download.`,
      `Upload that CSV below, or copy the domain name, expiration date, and auto-renew setting into the fields. Add the annual renewal cost in USD from your account before reviewing.`,
    ],
  },
  Namecheap: {
    label: `Namecheap account`,
    url: `https://www.namecheap.com/myaccount/login/`,
    sourceUrl: `https://www.namecheap.com/support/knowledgebase/article.aspx/9639/5/features-in-the-namecheap-account-panel/`,
    csvStep: `Drop the exported CSV below or choose Browse CSV, then review and save your domains.`,
    steps: [
      `Sign in to Namecheap, open Domain List, and select the domains you want to add here.`,
      `Open Actions and choose Export CSV File. You can also select Manage beside a domain to read its details.`,
      `Upload the exported CSV below, or copy the domain name, expiration date, and auto-renew setting into the fields. Add the annual renewal cost in USD from your account before reviewing.`,
    ],
  },
  Hostinger: {
    label: `Hostinger hPanel`,
    url: `https://hpanel.hostinger.com/`,
    sourceUrl: `https://www.hostinger.com/support/6940479-how-to-use-the-domains-section-in-hostinger-dashboard/`,
    csvStep: `Put those details in a CSV with domain, expiry, auto_renew, and renewal_price columns. Drop it below or choose Browse CSV, then review and save.`,
    steps: [
      `Sign in to Hostinger hPanel and open Domains. Your registered domains appear in the My domains list.`,
      `Choose Manage beside a domain to open Domain Overview. Read its expiration date and auto-renew setting, and find the renewal cost in your account.`,
      `Copy those details into the fields below. Choose Add another domain for each additional domain you want in your portfolio, then review and save.`,
    ],
  },
};
