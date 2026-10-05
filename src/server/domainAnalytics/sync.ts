import { getDomainRegistration } from '../registrars/rdap';
import { RegistrarRelayError } from '../registrars/errors';
import { providerName } from '../registrars/validation';
import { readLimitedText, type RegistrarRequestContext } from '../registrars/request';
import type { PublicDomainAnalytics } from '../../shared/domainAnalytics/types';

const dnsTypes = { A: 1, NS: 2, MX: 15, AAAA: 28 };
const dnsLabels: Record<number, string> = { 1: `A`, 2: `NS`, 5: `CNAME`, 15: `MX`, 28: `AAAA` };

const lookupDns = async (domain: string, type: keyof typeof dnsTypes, context: RegistrarRequestContext) => {
  const url = new URL(`https://dns.google/resolve`);
  url.searchParams.set(`name`, domain);
  url.searchParams.set(`type`, String(dnsTypes[type]));
  url.searchParams.set(`edns_client_subnet`, `0.0.0.0/0`);
  const controller = new AbortController();
  const abort = () => controller.abort();
  context.signal.addEventListener(`abort`, abort, { once: true });
  if (context.signal.aborted) abort();
  const timeout = setTimeout(abort, Math.max(1, Math.min(8_000, context.deadline - Date.now())));
  try {
    const response = await fetch(url, {
      method: `GET`,
      cache: `no-store`,
      redirect: `error`,
      credentials: `omit`,
      signal: controller.signal,
      headers: { Accept: `application/json` },
    });
    if (!response.ok) {
      void response.body?.cancel().catch(() => undefined);
      throw new Error(`Public DNS Is Temporarily Unavailable`);
    }
    const text = await readLimitedText(response.body, 256 * 1024, controller.signal,
      new RegistrarRelayError(502, `DNS Response Exceeds The Size Limit`));
    const result: unknown = JSON.parse(text);
    if (!result || typeof result !== `object` || !(`Status` in result) || ![0, 3].includes(Number(result.Status))) {
      throw new Error(`Public DNS Could Not Resolve This Domain`);
    }
    const answers: unknown[] = `Answer` in result && Array.isArray(result.Answer) ? result.Answer : [];
    return answers.flatMap((answer): PublicDomainAnalytics['dns']['records'] => {
      if (!answer || typeof answer !== `object` || !(`type` in answer) || !(`data` in answer)) return [];
      const label = dnsLabels[Number(answer.type)];
      const value = answer.data;
      return label && typeof value === `string` && value.length <= 1200 && !/[\u0000-\u001f\u007f]/.test(value)
        ? [{ type: label, value }] : [];
    }).slice(0, 50);
  } finally {
    clearTimeout(timeout);
    context.signal.removeEventListener(`abort`, abort);
  }
};

export const fetchDomainAnalytics = async (value: unknown, signal: AbortSignal): Promise<PublicDomainAnalytics> => {
  let domain: string;
  try { domain = providerName(value, `godaddy`); }
  catch { throw new RegistrarRelayError(400, `Enter A Valid Domain Name`); }
  const context: RegistrarRequestContext = { signal, provider: `godaddy`, deadline: Date.now() + 20_000 };
  const lookupRegistration = async (): Promise<PublicDomainAnalytics['registration']> => {
    try {
      const result = await getDomainRegistration(domain, context);
      return {
        status: result.registered === true ? `registered` : result.registered === false ? `unregistered` : `unknown`,
        createdAt: result.createdAt,
        expiresAt: result.expiresAt,
        registrar: result.registrarName,
        ...(result.registered === undefined ? { error: `This Extension Has No Public RDAP Endpoint` } : {}),
      };
    } catch {
      return { status: `unknown`, error: `Public Registration Data Is Temporarily Unavailable` };
    }
  };
  const [registration, dnsResults] = await Promise.all([
    lookupRegistration(),
    Promise.allSettled(Object.keys(dnsTypes).map(type => lookupDns(domain, type as keyof typeof dnsTypes, context))),
  ]);
  if (signal.aborted) throw new RegistrarRelayError(504, `Domain Analytics Timed Out Or Were Cancelled`);
  const dnsErrors = dnsResults.flatMap((result, index) => result.status === `rejected`
    ? [`${Object.keys(dnsTypes)[index]} Lookup Is Unavailable`] : []);
  const records = dnsResults.flatMap(result => result.status === `fulfilled` ? result.value : []);
  return {
    domain,
    registration,
    checkedAt: new Date().toISOString(),
    dns: {
      records: [...new Map(records.map(record => [`${record.type}:${record.value}`, record])).values()],
      ...(dnsErrors.length ? { error: dnsErrors.join(` · `) } : {}),
    },
  };
};
