export type ConnectionProvider = `godaddy` | `hostinger` | `namecheap` | `porkbun` | `namesilo`;
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

export interface ConnectionSnapshot {
  version: 2;
  userId: string;
  updated: string;
  nextNumber: number;
  accounts: ConnectionAccount[];
  values: ConnectionValues;
}

export const EMPTY_CONNECTIONS: ConnectionValues = { godaddy: ``, porkbun: ``, namesilo: ``, hostinger: ``, namecheap: `` };
export const connectionFields = [
  { id: `godaddy`, search: true, label: `GoDaddy`, placeholder: `GODADDY_PAT=your_token`, hint: `Use a PAT or API key/secret pair`, keys: [`GODADDY_PAT`, `GODADDY_API_KEY`, `GODADDY_API_SECRET`, `GODADDY_SHOPPER_ID`, `GODADDY_CUSTOMER_ID`] },
  { id: `hostinger`, search: true, label: `Hostinger`, placeholder: `HOSTINGER_API_TOKEN=your_token`, hint: `Registered domains sync automatically. Review discovered external domains before including them; shared hosting access does not prove ownership`, keys: [`HOSTINGER_API_TOKEN`, `HOSTINGER_EXTERNAL_DOMAINS`] },
  { id: `namecheap`, search: true, label: `Namecheap`, placeholder: `NAMECHEAP_API_KEY=your_key\nNAMECHEAP_USERNAME=your_username\nNAMECHEAP_CLIENT_IP=your_server_public_ipv4`, hint: `Enter the API key, account username, and whitelisted server IPv4 on separate lines`, keys: [`NAMECHEAP_API_KEY`, `NAMECHEAP_USERNAME`, `NAMECHEAP_CLIENT_IP`] },
  { id: `porkbun`, search: true, label: `Porkbun`, placeholder: `PORKBUN_API_KEY=your_key\nPORKBUN_SECRET_API_KEY=your_secret`, hint: `Create account API keys at porkbun.com/account/api. API access is free; enable domain API access as needed`, keys: [`PORKBUN_API_KEY`, `PORKBUN_SECRET_API_KEY`] },
  { id: `namesilo`, search: true, label: `NameSilo`, placeholder: `NAMESILO_API_KEY=your_key`, hint: `Generate a free API key in API Manager using your main NameSilo account. Subaccounts cannot use the API; optional IP restrictions must allow this server`, keys: [`NAMESILO_API_KEY`] },
] as const;
