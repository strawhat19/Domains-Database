import { connectionFields } from '../connections/types';
import type { ConnectionProvider } from '../connections/types';

const cancelled = () => {
  const error = new Error(`Domain Search Cancelled`);
  error.name = `AbortError`;
  return error;
};

export const getServerSearchProviders = async (signal?: AbortSignal): Promise<ConnectionProvider[]> => {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener(`abort`, abort, { once: true });
  if (signal?.aborted) abort();
  const timeout = setTimeout(abort, 10_000);
  try {
    const response = await fetch(`/api/registrars/search`, {
      method: `GET`,
      cache: `no-store`,
      credentials: `omit`,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Domain Search Configuration Is Unavailable`);
    const result: unknown = await response.json();
    const providers = (result as { providers?: unknown } | null)?.providers;
    const fields = connectionFields.filter(field => field.search);
    if (!Array.isArray(providers) || providers.length > fields.length
      || !providers.every(provider => typeof provider === `string` && fields.some(field => field.id === provider))) {
      throw new Error(`Domain Search Configuration Is Invalid`);
    }
    return fields.filter(field => providers.includes(field.id)).map(field => field.id);
  } catch (failure) {
    if (signal?.aborted) throw cancelled();
    if (controller.signal.aborted) throw new Error(`Domain Search Configuration Timed Out`);
    throw new Error(failure instanceof Error && !(failure instanceof TypeError) && !(failure instanceof SyntaxError)
      ? failure.message : `Could Not Load Domain Search Configuration`);
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener(`abort`, abort);
  }
};
