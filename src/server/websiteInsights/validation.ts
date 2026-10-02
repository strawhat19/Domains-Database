import { isIP } from 'node:net';
import { lookup } from 'node:dns/promises';
import { WebsiteInsightsError } from './request';
import { normalizeDomainName } from '../../shared/domainUtils';

const isPublicAddress = (address: string) => {
  if (isIP(address) === 4) {
    const [first, second, third] = address.split(`.`).map(Number);
    return first > 0 && first < 224 && first !== 10 && first !== 127
      && !(first === 100 && second >= 64 && second <= 127)
      && !(first === 169 && second === 254)
      && !(first === 172 && second >= 16 && second <= 31)
      && !(first === 192 && (second === 168 || second === 0 && (third === 0 || third === 2) || second === 88 && third === 99))
      && !(first === 198 && (second === 18 || second === 19 || second === 51 && third === 100))
      && !(first === 203 && second === 0 && third === 113);
  }
  if (isIP(address) !== 6) return false;
  const [firstPart, secondPart] = address.toLowerCase().split(`:`);
  const first = parseInt(firstPart, 16);
  const second = parseInt(secondPart || `0`, 16);
  return first >= 0x2000 && first <= 0x3fff && first !== 0x2002 && first !== 0x3fff
    && !(first === 0x2001 && (second < 0x200 || second === 0xdb8));
};

export const requirePublicDomain = async (value: unknown, signal: AbortSignal) => {
  if (typeof value !== `string` || value.length > 253) throw new WebsiteInsightsError(400, `Enter A Public Domain Name`);
  let domain: string;
  try { domain = normalizeDomainName(value); }
  catch { throw new WebsiteInsightsError(400, `Enter A Public Domain Name`); }
  const reserved = [`local`, `localhost`, `internal`, `home`, `lan`, `test`, `invalid`, `example`, `onion`, `arpa`];
  if (value.trim().toLowerCase() !== domain || isIP(domain) || reserved.includes(domain.split(`.`).at(-1) ?? ``)
    || [`example.com`, `example.org`, `example.net`].some(name => domain === name || domain.endsWith(`.${name}`))) throw new WebsiteInsightsError(400, `Enter A Public Domain Name`);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let abort: () => void = () => undefined;
  try {
    const addresses = await Promise.race([
      lookup(domain, { all: true, verbatim: true }),
      new Promise<never>((_, reject) => {
        abort = () => reject(new WebsiteInsightsError(408, `Website Insights Cancelled`));
        timer = setTimeout(() => reject(new WebsiteInsightsError(504, `Domain Lookup Timed Out`)), 5_000);
        signal.addEventListener(`abort`, abort, { once: true });
        if (signal.aborted) abort();
      }),
    ]);
    if (!addresses.length || addresses.some(record => !isPublicAddress(record.address))) throw new WebsiteInsightsError(422, `Website Must Resolve To Public Addresses`);
    return domain;
  } catch (failure) {
    if (failure instanceof WebsiteInsightsError) throw failure;
    throw new WebsiteInsightsError(422, `Website Has No Public DNS Address`);
  } finally {
    clearTimeout(timer);
    signal.removeEventListener(`abort`, abort);
  }
};
