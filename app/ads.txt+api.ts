import { getAdsTxtLine } from '../src/shared/adsense/config';

export const GET = () => {
  const body = getAdsTxtLine();
  return new Response(body, { status: body ? 200 : 404, headers: {
    'Content-Type': `text/plain; charset=utf-8`,
    'X-Content-Type-Options': `nosniff`,
    'Cache-Control': body ? `public, max-age=3600` : `no-store`,
  } });
};
