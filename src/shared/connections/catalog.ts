import { connectionFields, type ConnectionProvider } from './types';

export type ConnectionTabProvider = ConnectionProvider | `cloudflare` | `dynadot` | `namecom`;
export interface ConnectionTab {
  pro: boolean;
  label: string;
  available: boolean;
  id: ConnectionTabProvider;
}
export const proConnectionProviders: readonly ConnectionProvider[] = [`porkbun`, `namesilo`];
const availableConnectionTabs: readonly ConnectionTab[] = connectionFields.map(field => ({
  id: field.id, available: true, label: field.label, pro: proConnectionProviders.includes(field.id),
}));
export const connectionTabs: readonly ConnectionTab[] = [
  ...availableConnectionTabs.filter(tab => !tab.pro),
  { pro: true, available: false, id: `dynadot`, label: `Dynadot` },
  ...availableConnectionTabs.filter(tab => tab.pro),
  { pro: true, available: false, id: `cloudflare`, label: `Cloudflare` },
  { pro: true, available: false, id: `namecom`, label: `Name.com` },
];
