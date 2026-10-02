export type SetupRegistrar = `GoDaddy` | `Porkbun` | `NameSilo` | `Namecheap` | `Hostinger`;

export const SETUP_REGISTRARS: SetupRegistrar[] = [
  `GoDaddy`,
  `Porkbun`,
  `NameSilo`,
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
  Porkbun: {
    label: `Porkbun Account`,
    url: `https://porkbun.com/account/`,
    sourceUrl: `https://porkbun.com/api/json/v3/documentation`,
    csvStep: `Use the app CSV template for a manual import, then review and save your domain records.`,
    steps: [
      `For automatic sync, create an API key and secret at porkbun.com/account/api. Enable domain API access as needed.`,
      `Save PORKBUN_API_KEY and PORKBUN_SECRET_API_KEY in Profile → Connections to import your registered domains.`,
      `For manual entry, copy each domain's expiration date and renewal settings from your account. Confirm any annual renewal cost at Porkbun.`,
    ],
  },
  NameSilo: {
    label: `NameSilo Account`,
    url: `https://www.namesilo.com/`,
    sourceUrl: `https://www.namesilo.com/support/v2/articles/account-options/api-manager`,
    csvStep: `Use the app CSV template for a manual import, then review and save your domain records.`,
    steps: [
      `Generate a free API key in your main account's API Manager. Subaccounts cannot use the API.`,
      `Save NAMESILO_API_KEY in Profile → Connections. If you restrict API access by IP, permit the calling server's address.`,
      `Automatic sync imports registered names and dates. Confirm auto-renew, transfer lock, privacy, and annual renewal cost in your account before entering those details manually.`,
    ],
  },
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
