export type ConnectionProvider = `godaddy` | `hostinger` | `namecheap`;
export type ConnectionValues = Record<ConnectionProvider, string>;

export interface ConnectionSnapshot {
  version: 1;
  userId: string;
  updated: string;
  values: ConnectionValues;
}

export const EMPTY_CONNECTIONS: ConnectionValues = { godaddy: ``, hostinger: ``, namecheap: `` };
export const connectionFields = [
  { id: `godaddy`, label: `GoDaddy`, placeholder: `GODADDY_PAT=your_token`, hint: `Use a personal access token, or GODADDY_API_KEY and GODADDY_API_SECRET on separate lines`, keys: [`GODADDY_PAT`, `GODADDY_API_KEY`, `GODADDY_API_SECRET`] },
  { id: `hostinger`, label: `Hostinger`, placeholder: `HOSTINGER_API_TOKEN=your_token`, hint: `Paste the API token as HOSTINGER_API_TOKEN=value`, keys: [`HOSTINGER_API_TOKEN`] },
  { id: `namecheap`, label: `Namecheap`, placeholder: `NAMECHEAP_API_KEY=your_key\nNAMECHEAP_USERNAME=your_username\nNAMECHEAP_CLIENT_IP=your_server_public_ipv4`, hint: `Enter the API key, account username, and whitelisted server IPv4 on separate lines`, keys: [`NAMECHEAP_API_KEY`, `NAMECHEAP_USERNAME`, `NAMECHEAP_CLIENT_IP`] },
] as const;
