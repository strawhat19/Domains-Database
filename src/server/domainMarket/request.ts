export class DomainMarketError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

export class MarketSourceError extends Error {
  constructor(readonly quota = false) { super(`Market Source Is Unavailable`); }
}

export const readMarketText = async (body: ReadableStream<Uint8Array> | null, maximum: number, signal: AbortSignal) => {
  if (!body) return ``;
  const reader = body.getReader();
  const decoder = new TextDecoder(`utf-8`, { fatal: true });
  const abort = () => { void reader.cancel().catch(() => undefined); };
  let size = 0;
  let text = ``;
  signal.addEventListener(`abort`, abort, { once: true });
  if (signal.aborted) abort();
  try {
    while (true) {
      if (signal.aborted) throw new DomainMarketError(504, `Market Request Timed Out Or Was Cancelled`);
      const result = await reader.read();
      if (result.done) return text + decoder.decode();
      size += result.value.byteLength;
      if (size > maximum) throw new DomainMarketError(413, `Market Request Exceeds The Size Limit`);
      text += decoder.decode(result.value, { stream: true });
    }
  } finally {
    signal.removeEventListener(`abort`, abort);
    void reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
};

export const requestMarketJson = async (url: URL, signal: AbortSignal, authorization?: string) => {
  const allowed = url.origin === `https://api.ahrefs.com` && url.pathname === `/v3/public/domain-rating-free`
    || url.origin === `https://serpapi.com` && [`/account.json`, `/search.json`].includes(url.pathname);
  if (!allowed || url.username || url.password || url.hash) throw new MarketSourceError();
  try {
    const response = await fetch(url, {
      method: `GET`,
      cache: `no-store`,
      redirect: `error`,
      credentials: `omit`,
      signal,
      headers: { Accept: `application/json`, ...(authorization ? { Authorization: authorization } : {}) },
    });
    const length = response.headers.get(`content-length`);
    const type = response.headers.get(`content-type`)?.split(`;`)?.[0]?.trim()?.toLowerCase();
    if (!response.ok || type !== `application/json` || length && (!/^\d+$/.test(length) || Number(length) > 256_000)) {
      void response.body?.cancel().catch(() => undefined);
      throw new MarketSourceError(response.status === 429);
    }
    return JSON.parse(await readMarketText(response.body, 256_000, signal)) as unknown;
  } catch (failure) {
    if (failure instanceof MarketSourceError) throw failure;
    throw new MarketSourceError();
  }
};
