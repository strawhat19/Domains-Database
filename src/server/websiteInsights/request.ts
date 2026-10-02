export class WebsiteInsightsError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

export const readInsightsText = async (body: ReadableStream<Uint8Array> | null, maximum: number, signal: AbortSignal) => {
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
      if (signal.aborted) throw new WebsiteInsightsError(504, `Website Insights Timed Out Or Were Cancelled`);
      const result = await reader.read();
      if (result.done) return text + decoder.decode();
      size += result.value.byteLength;
      if (size > maximum) throw new WebsiteInsightsError(413, `Website Insights Exceed The Size Limit`);
      text += decoder.decode(result.value, { stream: true });
    }
  } finally {
    signal.removeEventListener(`abort`, abort);
    void reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
};

export const requestInsightsJson = async (url: URL, signal: AbortSignal, timeoutMs: number, maximum: number) => {
  const allowed = url.origin === `https://www.googleapis.com` && url.pathname === `/pagespeedonline/v5/runPagespeed`
    || url.origin === `https://tranco-list.eu` && /^\/api\/ranks\/domain\/[a-z0-9.-]+$/.test(url.pathname);
  if (!allowed || url.username || url.password || url.hash) throw new WebsiteInsightsError(500, `Website Insights Request Is Unavailable`);
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener(`abort`, abort, { once: true });
  if (signal.aborted) abort();
  const timeout = setTimeout(abort, timeoutMs);
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
      throw new WebsiteInsightsError(response.status === 429 ? 429 : 502, response.status === 429 ? `Request Limit Reached — Try Later` : `Source Is Temporarily Unavailable`);
    }
    const length = response.headers.get(`content-length`);
    if (length && (!/^\d+$/.test(length) || Number(length) > maximum)) {
      void response.body?.cancel().catch(() => undefined);
      throw new WebsiteInsightsError(502, `Source Response Exceeds The Size Limit`);
    }
    const text = await readInsightsText(response.body, maximum, controller.signal);
    try { return JSON.parse(text) as unknown; }
    catch { throw new WebsiteInsightsError(502, `Source Returned An Invalid Result`); }
  } catch (failure) {
    if (failure instanceof WebsiteInsightsError) throw failure;
    throw new WebsiteInsightsError(502, controller.signal.aborted ? `Source Request Timed Out Or Was Cancelled` : `Could Not Reach Source`);
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener(`abort`, abort);
  }
};
