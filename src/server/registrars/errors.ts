import type { ConnectionProvider } from '../../shared/connections/types';

export class RegistrarRelayError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = `RegistrarRelayError`;
  }
}

export const providerLabels: Record<ConnectionProvider, string> = {
  vercel: `Vercel`,
  godaddy: `GoDaddy`,
  porkbun: `Porkbun`,
  namesilo: `NameSilo`,
  hostinger: `Hostinger`,
  namecheap: `Namecheap`,
  squarespace: `Squarespace`,
};

export const invalidResponse = (provider: ConnectionProvider) =>
  new RegistrarRelayError(502, `${providerLabels[provider]} Returned An Invalid Domain List`);

export const upstreamError = (provider: ConnectionProvider, status: number) => {
  const label = providerLabels[provider];
  if (status === 401) return new RegistrarRelayError(401, provider === `squarespace`
    ? `Squarespace Rejected These Reseller Credentials — Use The Client ID And Secret Issued During Approved Reseller Onboarding`
    : `${label} Credentials Are Invalid Or Expired`);
  if (status === 429) return new RegistrarRelayError(429, `${label} Rate Limit Reached — Try Again Later`);
  if (status === 403) {
    if (provider === `vercel`) return new RegistrarRelayError(403, `Vercel Token Requires Domain Read Access To The Selected Account Or Team`);
    if (provider === `squarespace`) return new RegistrarRelayError(403, `Squarespace Requires Approved Reseller Access And Domain Read Permission`);
    if (provider === `porkbun` || provider === `namesilo`) return new RegistrarRelayError(403, `${label} Requires Enabled Account API Access And Permitted Server IP`);
    const message = provider === `namecheap`
      ? `Namecheap Requires API Access And The Calling Server's Whitelisted IPv4`
      : `${label} API Access Requires Account Eligibility And Domain Read Permission`;
    return new RegistrarRelayError(403, message);
  }
  return new RegistrarRelayError(502, `${label} Could Not Complete The Domain Request`);
};
