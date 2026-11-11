import { requestRegistrar } from '../registrars/request';
import { RegistrarRelayError } from '../registrars/errors';
import { asRecord, providerName } from '../registrars/validation';
import type { DomainAppraisalResult } from '../../shared/domainAppraisal/types';

const amountInDollars = (value: unknown) => {
  if (value == null) return undefined;
  const money = asRecord(value, `godaddy`);
  const amount = money.value;
  if (money.currencyCode !== `USD` || typeof amount !== `number` || !Number.isSafeInteger(amount) || amount < 0) throw new Error();
  return amount / 100;
};

const nextUtcDay = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)).toISOString();
};

export const requestGoValue = async (domain: string, authorization: string, signal: AbortSignal): Promise<DomainAppraisalResult> => {
  const url = new URL(`https://api.godaddy.com/v1/domains/govalues`);
  url.searchParams.set(`domainName`, domain);
  try {
    const response = await requestRegistrar(url, { Accept: `application/json`, Authorization: authorization }, {
      signal, provider: `godaddy`, operation: `appraisal`, deadline: Date.now() + 10_000,
    });
    const value = asRecord(JSON.parse(response), `godaddy`);
    if (value.status !== `OK` || providerName(value.domainName, `godaddy`) !== domain) throw new Error();
    const amount = amountInDollars(value.goValue);
    if (amount === undefined) return { status: `not-found`, message: `GoDaddy Has No Estimate For This Domain` };
    const minPrice = amountInDollars(value.minPrice);
    const maxPrice = amountInDollars(value.maxPrice);
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) throw new Error();
    return {
      status: `available`, appraisal: {
        amount, minPrice, maxPrice, currency: `USD`, source: `GoDaddy GoValue`, checkedAt: new Date().toISOString(),
        listPrice: amountInDollars(value.listPrice), wholesalePrice: amountInDollars(value.goValueWholesale),
      },
    };
  } catch (failure) {
    const status = failure instanceof RegistrarRelayError ? failure.status : undefined;
    if (status === 401) return { status: `access-required`, message: `Check The Saved GoDaddy Token Or API Credentials` };
    if (status === 403) return { status: `access-required`, message: `GoValue Requires An Active GoDaddy Subscription And A Token With Domain Read Access` };
    if (status === 404) return { status: `not-found`, message: `GoDaddy Has No Estimate For This Domain` };
    if (status === 422) return { status: `unsupported-tld`, message: `GoDaddy GoValue Does Not Support This Domain Extension` };
    if (status === 429) return { status: `rate-limited`, retryAt: nextUtcDay(), message: `GoDaddy GoValue Daily Limit Reached` };
    return { status: `unavailable`, message: `GoDaddy GoValue Is Temporarily Unavailable — Try Again` };
  }
};
