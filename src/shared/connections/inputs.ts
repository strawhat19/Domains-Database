import { connectionFields, type ConnectionAccount, type ConnectionProvider } from './types';

export type ConnectionInputKey = typeof connectionFields[number][`keys`][number];

export interface ConnectionInputField {
  label: string;
  secret: boolean;
  placeholder: string;
  hint?: string;
}

export interface ConnectionInputSection {
  id: string;
  hint?: string;
  label?: string;
  keys: readonly ConnectionInputKey[];
}

export const connectionInputFields: Record<ConnectionInputKey, ConnectionInputField> = {
  GODADDY_PAT: {
    secret: true,
    label: `Personal Access Token`,
    placeholder: `Your GoDaddy PAT`,
    hint: `Use a PAT or an API key and secret pair`,
  },
  GODADDY_API_KEY: {
    secret: true,
    label: `API Key`,
    placeholder: `Your GoDaddy API key`,
    hint: `Pair with the API secret when using API credentials`,
  },
  NAMECHEAP_API_KEY: {
    secret: true,
    label: `API Key`,
    placeholder: `Your Namecheap API key`,
  },
  PORKBUN_API_KEY: {
    secret: true,
    label: `API Key`,
    placeholder: `Your Porkbun API key`,
  },
  NAMESILO_API_KEY: {
    secret: true,
    label: `API Key`,
    placeholder: `Your NameSilo API key`,
  },
  VERCEL_TEAM_ID: {
    secret: false,
    label: `Team ID`,
    placeholder: `team_optional`,
    hint: `Optional. Leave empty to use your personal account`,
  },
  VERCEL_API_TOKEN: {
    secret: true,
    label: `API Token`,
    placeholder: `Your Vercel API token`,
  },
  GODADDY_API_SECRET: {
    secret: true,
    label: `API Secret`,
    placeholder: `Your GoDaddy API secret`,
    hint: `Required when using an API key`,
  },
  GODADDY_SHOPPER_ID: {
    secret: false,
    label: `Shopper ID`,
    placeholder: `Your numeric shopper ID`,
    hint: `Optional. Use a shopper ID or customer UUID, not both`,
  },
  GODADDY_CUSTOMER_ID: {
    secret: false,
    label: `Customer UUID`,
    placeholder: `Your GoDaddy customer UUID`,
    hint: `Optional. Use a customer UUID or shopper ID, not both`,
  },
  HOSTINGER_API_TOKEN: {
    secret: true,
    label: `API Token`,
    placeholder: `Your Hostinger API token`,
  },
  NAMECHEAP_USERNAME: {
    secret: false,
    label: `Username`,
    placeholder: `Your Namecheap username`,
  },
  NAMECHEAP_CLIENT_IP: {
    secret: false,
    label: `Server Public IPv4`,
    placeholder: `203.0.113.10`,
    hint: `Use the server IPv4 allowed in your Namecheap API settings`,
  },
  SQUARESPACE_CLIENT_ID: {
    secret: false,
    label: `Developer OAuth Client ID`,
    placeholder: `Your Squarespace developer app client ID`,
  },
  PORKBUN_SECRET_API_KEY: {
    secret: true,
    label: `Secret API Key`,
    placeholder: `Your Porkbun secret API key`,
  },
  HOSTINGER_EXTERNAL_DOMAINS: {
    secret: false,
    label: `Confirmed External Domains`,
    placeholder: `example.com, example.org`,
    hint: `Optional. Enter reviewed domain names separated by commas`,
  },
  SQUARESPACE_CLIENT_SECRET: {
    secret: true,
    label: `Developer OAuth Client Secret`,
    placeholder: `Your Squarespace developer app client secret`,
  },
  SQUARESPACE_RESELLER_CLIENT_ID: {
    secret: false,
    label: `Reseller Client ID`,
    placeholder: `Your approved Squarespace reseller client ID`,
  },
  SQUARESPACE_RESELLER_CLIENT_SECRET: {
    secret: true,
    label: `Reseller Client Secret`,
    placeholder: `Your approved Squarespace reseller client secret`,
  },
};

export const connectionInputSections = (provider: ConnectionProvider): ConnectionInputSection[] => provider === `squarespace` ? [
  {
    id: `developer-oauth`,
    label: `Developer OAuth — Save Only`,
    keys: [`SQUARESPACE_CLIENT_ID`, `SQUARESPACE_CLIENT_SECRET`],
    hint: `Credentials from Squarespace Developer Apps. They require a website authorization flow that this app does not implement. Saving them does not verify or connect the app, and they cannot sync your domain portfolio`,
  },
  {
    id: `reseller-api`,
    label: `Reseller API — Domain Sync`,
    keys: [`SQUARESPACE_RESELLER_CLIENT_ID`, `SQUARESPACE_RESELLER_CLIENT_SECRET`],
    hint: `Credentials issued by your Partner Solutions Architect after reseller approval. If you previously saved approved reseller credentials in the generic Client ID and Client Secret fields, enter them here to enable domain sync`,
  },
] : [{ id: `credentials`, keys: connectionFields.find(field => field.id === provider)?.keys ?? [] }];

const bareInputKeys = {
  vercel: `VERCEL_API_TOKEN`,
  godaddy: `GODADDY_PAT`,
  namesilo: `NAMESILO_API_KEY`,
  hostinger: `HOSTINGER_API_TOKEN`,
} as const;

const connectionInputLines = (values: string): string[] => values.match(/[^\n]*(?:\n|$)/g)?.filter(Boolean) ?? [];

const unquoteConnectionInput = (value: string): string => {
  if ((value.startsWith(`'`) && value.endsWith(`'`)) || (value.startsWith(`"`) && value.endsWith(`"`))) return value.slice(1, -1);
  return value;
};

const readConnectionInputLine = (account: ConnectionAccount, line: string): { key: string; value: string } | undefined => {
  const text = line.trim();
  if (!text || text.startsWith(`#`)) return undefined;
  const declaration = /^(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=\s*(.*)$/.exec(text);
  if (declaration) return { key: declaration[1], value: unquoteConnectionInput(declaration[2]) };
  const bareKey = account.provider in bareInputKeys ? bareInputKeys[account.provider as keyof typeof bareInputKeys] : undefined;
  const value = unquoteConnectionInput(text);
  return bareKey && /^[\x21-\x7e]+$/.test(value) ? { key: bareKey, value } : undefined;
};

const serializedConnectionInput = (value: string): string => {
  const quoted = (value.startsWith(`'`) && value.endsWith(`'`)) || (value.startsWith(`"`) && value.endsWith(`"`));
  // The saved credential parser strips outer quotes without decoding escapes.
  return quoted || /[\s#]/.test(value) ? `"${value}"` : value;
};

export const connectionInputValue = (account: ConnectionAccount, key: ConnectionInputKey): string => {
  for (const line of connectionInputLines(account.values)) {
    const input = readConnectionInputLine(account, line);
    if (input?.key === key) return input.value;
  }
  return ``;
};

export const supportsRegistrarSync = (account: ConnectionAccount): boolean => account.provider !== `squarespace`
  || Boolean(connectionInputValue(account, `SQUARESPACE_RESELLER_CLIENT_ID`).trim()
    || connectionInputValue(account, `SQUARESPACE_RESELLER_CLIENT_SECRET`).trim());

export const withConnectionInputValue = (account: ConnectionAccount, key: ConnectionInputKey, value: string): string => {
  const provider = connectionFields.find(field => field.id === account.provider);
  if (!provider?.keys.some(allowed => allowed === key) || /[\r\n\u0000]/.test(value)) throw new Error(`Enter A Valid Single-Line Connection Value`);
  let replaced = false;
  const lines = connectionInputLines(account.values).flatMap(line => {
    if (readConnectionInputLine(account, line)?.key !== key) return [line];
    if (!value) return [];
    if (replaced) return [line];
    replaced = true;
    const ending = line.endsWith(`\r\n`) ? `\r\n` : line.endsWith(`\n`) ? `\n` : ``;
    return [`${key}=${serializedConnectionInput(value)}${ending}`];
  });
  const saved = lines.join(``);
  if (replaced || !value) return saved;
  const separator = saved && !saved.endsWith(`\n`) ? `\n` : ``;
  return `${saved}${separator}${key}=${serializedConnectionInput(value)}`;
};
