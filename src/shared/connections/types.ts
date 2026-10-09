export type ConnectionProvider = `vercel` | `godaddy` | `hostinger` | `namecheap` | `porkbun` | `namesilo` | `squarespace`;
export type ConnectionValues = Record<ConnectionProvider, string>;

export interface ConnectionAccount {
  id: string;
  number: number;
  values: string;
  provider: ConnectionProvider;
}

export interface AccountConnectionsProps {
  scope?: string;
  embedded?: boolean;
  providers?: readonly ConnectionProvider[];
  onBusyChange?: (busy: boolean) => void;
}

export interface EnvironmentImportResult {
  userId: string;
  skipped: number;
  connections: Pick<ConnectionAccount, `values` | `provider`>[];
}

export interface ConnectionSnapshot {
  version: 2;
  userId: string;
  updated: string;
  nextNumber: number;
  accounts: ConnectionAccount[];
  values: ConnectionValues;
}

export const EMPTY_CONNECTIONS: ConnectionValues = { vercel: ``, godaddy: ``, porkbun: ``, namesilo: ``, hostinger: ``, namecheap: ``, squarespace: `` };
export const connectionFields = [
  { id: `vercel`, search: true, label: `Vercel`, placeholder: `VERCEL_API_TOKEN=your_token\nVERCEL_TEAM_ID=team_optional`, hint: `Create a token at vercel.com/account/settings/tokens with access to your account or team. Team ID is optional; Vercel-registered domains sync, while external hosting domains are excluded`, keys: [`VERCEL_API_TOKEN`, `VERCEL_TEAM_ID`] },
  { id: `hostinger`, search: true, label: `Hostinger`, placeholder: `HOSTINGER_API_TOKEN=your_token`, hint: `Registered and hosted domains sync automatically. Hosted domains keep their actual registrar when identified`, keys: [`HOSTINGER_API_TOKEN`, `HOSTINGER_EXTERNAL_DOMAINS`] },
  { id: `godaddy`, search: true, label: `GoDaddy`, placeholder: `GODADDY_PAT=your_token`, hint: `Use a PAT or API key/secret pair`, keys: [`GODADDY_PAT`, `GODADDY_API_KEY`, `GODADDY_API_SECRET`, `GODADDY_SHOPPER_ID`, `GODADDY_CUSTOMER_ID`] },
  { id: `namecheap`, search: true, label: `Namecheap`, placeholder: `NAMECHEAP_API_KEY=your_key\nNAMECHEAP_USERNAME=your_username\nNAMECHEAP_CLIENT_IP=your_server_public_ipv4`, hint: `Enter the API key, account username, and whitelisted server IPv4 in their matching fields`, keys: [`NAMECHEAP_API_KEY`, `NAMECHEAP_USERNAME`, `NAMECHEAP_CLIENT_IP`] },
  { id: `squarespace`, search: false, label: `Squarespace`, placeholder: `SQUARESPACE_RESELLER_CLIENT_ID=your_reseller_client_id\nSQUARESPACE_RESELLER_CLIENT_SECRET=your_reseller_client_secret`, hint: `Developer OAuth credentials are saved without connecting a website. Reseller API credentials sync domains provisioned through an approved reseller account. Personal domain portfolios and Commerce API keys are not supported by domain sync`, keys: [`SQUARESPACE_CLIENT_ID`, `SQUARESPACE_CLIENT_SECRET`, `SQUARESPACE_RESELLER_CLIENT_ID`, `SQUARESPACE_RESELLER_CLIENT_SECRET`] },
  { id: `porkbun`, search: true, label: `Porkbun`, placeholder: `PORKBUN_API_KEY=your_key\nPORKBUN_SECRET_API_KEY=your_secret`, hint: `Create account API keys at porkbun.com/account/api. API access is free; enable domain API access as needed`, keys: [`PORKBUN_API_KEY`, `PORKBUN_SECRET_API_KEY`] },
  { id: `namesilo`, search: true, label: `NameSilo`, placeholder: `NAMESILO_API_KEY=your_key`, hint: `Generate a free API key in API Manager using your main NameSilo account. Subaccounts cannot use the API; optional IP restrictions must allow this server`, keys: [`NAMESILO_API_KEY`] },
] as const;
