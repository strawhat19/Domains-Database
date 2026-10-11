export const readProviderJson = async (response: Response, signal: AbortSignal): Promise<unknown> => {
  const reader = response.body?.getReader();
  if (!reader) throw new Error(`Reporting Response Was Empty`);
  const decoder = new TextDecoder(`utf-8`, { fatal: true });
  let text = ``;
  let size = 0;
  const abort = () => { void reader.cancel().catch(() => undefined); };
  signal.addEventListener(`abort`, abort, { once: true });
  try {
    while (!signal.aborted) {
      const chunk = await reader.read();
      if (signal.aborted) break;
      if (chunk.done) return JSON.parse(text + decoder.decode());
      size += chunk.value.byteLength;
      if (size > 3_000_000) throw new Error(`Reporting Response Exceeded The Size Limit`);
      text += decoder.decode(chunk.value, { stream: true });
    }
    throw new Error(`Reporting Request Timed Out`);
  } finally {
    signal.removeEventListener(`abort`, abort);
    void reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
};
