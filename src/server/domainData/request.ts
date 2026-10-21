export class DomainDataError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = `DomainDataError`;
  }
}
export const MAX_DOMAIN_DATA_BYTES = 3_000_000;
export const readDomainDataText = async (response: Response, signal: AbortSignal): Promise<string> => {
  const exceeded = () => new DomainDataError(413, `Domain Data Exceeds The Size Limit — Request Fewer Records`);
  const length = response.headers.get(`content-length`);
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_DOMAIN_DATA_BYTES)) { void response.body?.cancel().catch(() => undefined); throw exceeded(); }
  if (!response.body) return ``;
  const reader = response.body.getReader();
  const decoder = new TextDecoder(`utf-8`, { fatal: true });
  const abort = () => { void reader.cancel().catch(() => undefined); };
  signal.addEventListener(`abort`, abort, { once: true });
  let bytes = 0;
  let text = ``;
  try {
    while (true) {
      if (signal.aborted) throw new DomainDataError(504, `Domain Data Request Timed Out Or Was Cancelled`);
      const chunk = await reader.read();
      if (signal.aborted) throw new DomainDataError(504, `Domain Data Request Timed Out Or Was Cancelled`);
      if (chunk.done) return text + decoder.decode();
      bytes += chunk.value.byteLength;
      if (bytes > MAX_DOMAIN_DATA_BYTES) throw exceeded();
      text += decoder.decode(chunk.value, { stream: true });
    }
  } finally {
    signal.removeEventListener(`abort`, abort);
    void reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
};
