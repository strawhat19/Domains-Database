import { invalid } from '../marketplace/records';
import { getAfternicPortfolio } from './provider';
import { readLimitedText } from '../registrars/request';
import { RegistrarRelayError } from '../registrars/errors';
import { readAfternicSnapshot, syncAfternicSnapshot } from './snapshot';
import { getAfternicAccountStats, getAfternicDomainStats, getAfternicSales } from './activity';
import { MarketplaceError, requireMarketplaceActor } from '../marketplace/access';
import { configureAfternicConnection, getAfternicConnection, revealAfternicCredential } from './connection';
import { checkAfternicExport, importAfternicDraft, publishAfternicExport, reviewAfternicExport } from './service';

const headers = { Vary: `Authorization`, 'Cache-Control': `private, no-store`, 'Referrer-Policy': `no-referrer`, 'X-Content-Type-Options': `nosniff` };
const json = (body: unknown, status = 200) => Response.json(body, { headers, status });
const fields = {
  status: [],
  stats: [`days`],
  import: [`domain`],
  reveal: [`field`],
  check: [`listingId`],
  review: [`listingId`],
  portfolio: [`offset`],
  sync: [`attemptId`],
  sales: [`days`, `offset`, `through`],
  domainStats: [`days`, `domain`],
  configure: [`key`, `secret`],
  snapshot: [`offset`, `generationId`],
  publish: [`listingId`, `priceCents`, `acceptOffers`],
} as const;

const readBody = async (request: Request, signal: AbortSignal) => {
  const origin = request.headers.get(`origin`);
  const site = request.headers.get(`sec-fetch-site`);
  if (origin && origin !== new URL(request.url).origin || site && ![`same-origin`, `none`].includes(site)) throw new MarketplaceError(403, `Cross-Origin Afternic Requests Are Not Allowed`);
  if (request.headers.get(`content-type`)?.split(`;`)?.[0]?.trim()?.toLowerCase() !== `application/json`) throw new MarketplaceError(415, `Send Afternic Requests As JSON`);
  const limit = 4_096;
  const exceeded = new RegistrarRelayError(413, `Afternic Request Is Too Large`);
  const length = request.headers.get(`content-length`);
  if (length && (!/^\d+$/.test(length) || Number(length) > limit)) throw exceeded;
  const raw = await readLimitedText(request.body, limit, signal, exceeded);
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw invalid(); }
  if (!value || typeof value !== `object` || Array.isArray(value)) throw invalid();
  const body = value as Record<string, unknown>;
  if (typeof body.action !== `string` || !Object.hasOwn(fields, body.action)) throw invalid();
  const action = body.action as keyof typeof fields;
  const expected: readonly string[] = fields[action];
  const optionalDomain = action === `sales` && Object.hasOwn(body, `domain`);
  if (Object.keys(body).length !== expected.length + 1 + Number(optionalDomain) || expected.some(field => !Object.hasOwn(body, field))) throw invalid();
  return { action, body };
};

export const handleMarketplaceAfternic = async (request: Request) => {
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(25_000)]);
  try {
    const actor = await requireMarketplaceActor(request);
    const { action, body } = await readBody(request, signal);
    if (action === `configure`) return json(await configureAfternicConnection(actor, body, signal));
    if (action === `reveal`) return json(await revealAfternicCredential(actor, body.field));
    if (action === `sync`) return json(await syncAfternicSnapshot(actor, body.attemptId, signal));
    if (action === `snapshot`) return json(await readAfternicSnapshot(actor, body));
    const { authorization, canConfigure } = await getAfternicConnection(actor);
    if (action === `status`) return json({ configured: Boolean(authorization), canConfigure });
    if (!authorization) throw new MarketplaceError(403, `Afternic Is Not Configured For This Seller Account`);
    const context = { authorization, signal };
    if (action === `stats` || action === `sales` || action === `domainStats`) {
      const activity = action === `stats` ? await getAfternicAccountStats(context, body.days)
        : action === `domainStats` ? await getAfternicDomainStats(context, body) : await getAfternicSales(context, actor.id, body);
      const latest = await getAfternicConnection(actor);
      if (latest.authorization !== authorization) throw new MarketplaceError(409, `Afternic Connection Changed — Refresh Activity`);
      if (signal.aborted) throw new MarketplaceError(504, `Afternic Activity Request Timed Out`);
      return json(activity);
    }
    switch (action) {
      case `portfolio`: {
        const { listings, skipped, nextOffset } = await getAfternicPortfolio(context, body.offset, { includeInsights: true });
        return json({ listings, skipped, nextOffset });
      }
      case `import`: return json(await importAfternicDraft(actor, context, body.domain));
      case `review`: return json(await reviewAfternicExport(actor, context, body.listingId));
      case `publish`: return json(await publishAfternicExport(actor, context, body));
      case `check`: return json(await checkAfternicExport(actor, context, body.listingId));
      default: throw invalid();
    }
  } catch (failure) {
    if (signal.aborted) return json({ error: `Afternic Request Timed Out — Check Listing Status Before Retrying` }, 504);
    if (failure instanceof MarketplaceError || failure instanceof RegistrarRelayError) return json({ error: failure.message }, failure.status);
    return json({ error: `Afternic Is Temporarily Unavailable — Try Again` }, 503);
  }
};
