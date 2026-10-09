import { connectionFields, type ConnectionAccount, type ConnectionProvider } from './types';

export type ConnectionInputKey = typeof connectionFields[number][`keys`][number];

export interface ConnectionInputField {
  label: string;
  format: string;
  secret: boolean;
  example: string;
  placeholder: string;
  hint?: string;
}

export const connectionInputInstructions = `Paste only the value in each field, on one line, with no extra spaces. Leave out variable names such as VERCEL_API_TOKEN=, surrounding quotes, and authorization headers such as Bearer or sso-key. Keep any prefix that is part of the issued token. Examples are fake; replace them with your own values.`;

export const connectionEnvInstructions = `For .env, add one NAME=value line using the exact names below, without an EXPO_PUBLIC_ prefix. Replace fake examples and restart the server. .env supports Domain Search; profile connections require saving these fields.`;

export interface ConnectionEnvGuidance {
  note: string;
  assignment: string;
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
    example: `gd_pat_exampletoken123`,
    placeholder: `Your GoDaddy PAT`,
    format: `Paste the complete personal access token, including its gd_pat_ prefix if present. Enter the token itself, without Bearer.`,
    hint: `For a PAT connection, the API Key and API Secret fields can stay empty. If both methods are entered, the PAT is used first`,
  },
  GODADDY_API_KEY: {
    secret: true,
    label: `API Key`,
    example: `example_godaddy_key_123`,
    placeholder: `Your GoDaddy API key`,
    format: `Paste only the API key. Enter its matching secret in API Secret; keep sso-key and the combined key:secret value out of this field.`,
    hint: `Required with API Secret when using classic API credentials. Can stay empty when using only a PAT`,
  },
  NAMECHEAP_API_KEY: {
    secret: true,
    label: `API Key`,
    example: `example_namecheap_key_123`,
    placeholder: `Your Namecheap API key`,
    format: `Paste only the API key from your Namecheap API settings, up to 50 characters.`,
    hint: `API Key, Username, and Server Public IPv4 are all required`,
  },
  PORKBUN_API_KEY: {
    secret: true,
    label: `API Key`,
    example: `example_porkbun_key_123`,
    placeholder: `Your Porkbun API key`,
    format: `Paste the full API key exactly as issued, keeping any prefix. Maximum 256 characters.`,
    hint: `Enter its matching Secret API Key in the next field`,
  },
  NAMESILO_API_KEY: {
    secret: true,
    label: `API Key`,
    example: `example_namesilo_key_123`,
    placeholder: `Your NameSilo API key`,
    format: `Paste only the full API key from API Manager, up to 256 characters. Leave out API URLs and query parameters.`,
  },
  VERCEL_TEAM_ID: {
    secret: false,
    label: `Team ID`,
    example: `team_Example123`,
    placeholder: `team_optional`,
    format: `Enter the actual team ID: team_ followed by letters and numbers, up to 100 characters total. Use the ID from team settings.`,
    hint: `Optional. Leave empty to use your personal account`,
  },
  VERCEL_API_TOKEN: {
    secret: true,
    label: `API Token`,
    example: `example_vercel_token_123`,
    placeholder: `Your Vercel API token`,
    format: `Paste the complete token value exactly as Vercel issued it. Leave out Bearer, the token's display name, and URLs.`,
  },
  GODADDY_API_SECRET: {
    secret: true,
    label: `API Secret`,
    example: `example_godaddy_secret_123`,
    placeholder: `Your GoDaddy API secret`,
    format: `Paste only the secret that belongs to your API key. Keep the API key, colon separator, and sso-key prefix out of this field.`,
    hint: `Required with API Key when using classic API credentials. Can stay empty when using only a PAT`,
  },
  GODADDY_SHOPPER_ID: {
    secret: false,
    label: `Shopper ID`,
    example: `1234567890`,
    placeholder: `Your numeric shopper ID`,
    format: `Enter 1 to 10 digits only. Leave out spaces, commas, and labels.`,
    hint: `Optional. Use a shopper ID or customer UUID, not both`,
  },
  GODADDY_CUSTOMER_ID: {
    secret: false,
    label: `Customer UUID`,
    example: `12345678-1234-1234-1234-123456789abc`,
    placeholder: `Your GoDaddy customer UUID`,
    format: `Enter the full 36-character customer UUID, including all four hyphens, in the 8-4-4-4-12 format. This field requires the UUID rather than the numeric account number.`,
    hint: `Optional. Use a customer UUID or shopper ID, not both`,
  },
  HOSTINGER_API_TOKEN: {
    secret: true,
    label: `API Token`,
    example: `example_hostinger_token_123`,
    placeholder: `Your Hostinger API token`,
    format: `Paste the complete Hostinger API token exactly as issued, without Bearer or an authorization header.`,
  },
  NAMECHEAP_USERNAME: {
    secret: false,
    label: `Username`,
    example: `example_user`,
    placeholder: `Your Namecheap username`,
    format: `Enter your account username: 1 to 20 letters, numbers, dots, underscores, or hyphens. Use your username rather than your email address.`,
  },
  NAMECHEAP_CLIENT_IP: {
    secret: false,
    label: `Server Public IPv4`,
    example: `203.0.113.10`,
    placeholder: `203.0.113.10`,
    format: `Enter four numbers from 0 to 255 separated by dots. Leave out URLs, ports, CIDR suffixes, and IPv6 addresses.`,
    hint: `Use the server IPv4 allowed in your Namecheap API settings`,
  },
  SQUARESPACE_CLIENT_ID: {
    secret: false,
    label: `Developer OAuth Client ID`,
    example: `example_oauth_client_123`,
    placeholder: `Your Squarespace developer app client ID`,
    format: `Paste only the Developer App's OAuth client ID, exactly as issued. Leave out the secret, colon separators, and encoded credentials.`,
    hint: `Enter its matching Developer OAuth Client Secret. This pair is saved only; it does not sync domains`,
  },
  PORKBUN_SECRET_API_KEY: {
    secret: true,
    label: `Secret API Key`,
    example: `example_porkbun_secret_123`,
    placeholder: `Your Porkbun secret API key`,
    format: `Paste the full secret API key exactly as issued, keeping any prefix. Maximum 256 characters.`,
    hint: `Use the secret paired with the API Key in the preceding field`,
  },
  HOSTINGER_EXTERNAL_DOMAINS: {
    secret: false,
    label: `Confirmed External Domains`,
    example: `example.com, example.org`,
    placeholder: `example.com, example.org`,
    format: `Enter up to 200 domain names separated by commas, without a trailing comma. Leave out https://, paths, ports, and wildcards. Use ASCII or Punycode domain names. Spaces around commas are allowed.`,
    hint: `Optional. Include only reviewed domains you own that were found through this account's hosting`,
  },
  SQUARESPACE_CLIENT_SECRET: {
    secret: true,
    label: `Developer OAuth Client Secret`,
    example: `example_oauth_secret_123`,
    placeholder: `Your Squarespace developer app client secret`,
    format: `Paste only the raw OAuth client secret, exactly as issued. Leave out Basic, Base64 encoding, and combined client ID/secret values.`,
    hint: `Use the secret paired with your Developer OAuth Client ID`,
  },
  SQUARESPACE_RESELLER_CLIENT_ID: {
    secret: false,
    label: `Reseller Client ID`,
    example: `example_reseller_client_123`,
    placeholder: `Your approved Squarespace reseller client ID`,
    format: `Paste only the raw client ID issued for your approved reseller account. Leave out colon separators and encoded credentials.`,
    hint: `Enter its matching Reseller Client Secret. Use reseller credentials rather than Developer App or Commerce API credentials`,
  },
  SQUARESPACE_RESELLER_CLIENT_SECRET: {
    secret: true,
    label: `Reseller Client Secret`,
    example: `example_reseller_secret_123`,
    placeholder: `Your approved Squarespace reseller client secret`,
    format: `Paste only the raw approved reseller client secret, exactly as issued. Leave out Basic, Base64 encoding, and combined credentials.`,
    hint: `Use the secret paired with your Reseller Client ID`,
  },
};

const connectionEnvNotes: Partial<Record<ConnectionInputKey, string>> = {
  GODADDY_PAT: `Used by server Domain Search before the API key/secret pair. A PAT can be used on its own`,
  VERCEL_TEAM_ID: `Optional server Domain Search team setting; leave it out for your personal account`,
  GODADDY_API_KEY: `Used by server Domain Search with the matching API Secret when no valid PAT is configured`,
  GODADDY_API_SECRET: `Used by server Domain Search with the matching API Key when no valid PAT is configured`,
  GODADDY_SHOPPER_ID: `Ignored in server .env. Enter this optional ID in your profile for inventory renewal estimates`,
  GODADDY_CUSTOMER_ID: `Ignored in server .env. Enter this optional UUID in your profile for inventory renewal estimates`,
  HOSTINGER_EXTERNAL_DOMAINS: `Ignored in server .env. Legacy profile setting; eligible hosted domains are now included automatically`,
  SQUARESPACE_CLIENT_ID: `Ignored in server .env. Your profile saves Developer OAuth credentials only; they do not connect a website or sync domains`,
  SQUARESPACE_CLIENT_SECRET: `Ignored in server .env. Your profile saves Developer OAuth credentials only; they do not connect a website or sync domains`,
  SQUARESPACE_RESELLER_CLIENT_ID: `Ignored in server .env. Save the approved reseller ID and secret in your profile to sync its domain inventory`,
  SQUARESPACE_RESELLER_CLIENT_SECRET: `Ignored in server .env. Save the approved reseller ID and secret in your profile to sync its domain inventory`,
};

export const connectionEnvGuidance = (key: ConnectionInputKey): ConnectionEnvGuidance => {
  const example = connectionInputFields[key].example;
  const value = /[\s#]/.test(example) ? `"${example}"` : example;
  return {
    assignment: `${key}=${value}`,
    note: connectionEnvNotes[key] ?? `Used by server Domain Search when this provider's required credentials are complete`,
  };
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
] : [{ id: `credentials`, keys: connectionFields.find(field => field.id === provider)?.keys.filter(key => key !== `HOSTINGER_EXTERNAL_DOMAINS`) ?? [] }];

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
