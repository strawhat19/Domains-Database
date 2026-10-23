import { absoluteSiteUrl } from '../src/shared/seo';

export const GET = () => new Response([
  `User-agent: *`,
  `Allow: /`,
  `Disallow: /api/`,
  `Sitemap: ${absoluteSiteUrl(`/sitemap.xml`)}`,
  ``,
].join(`\n`), { headers: {
  'Content-Type': `text/plain; charset=utf-8`,
  'X-Content-Type-Options': `nosniff`,
  'Cache-Control': `public, max-age=3600`,
} });
