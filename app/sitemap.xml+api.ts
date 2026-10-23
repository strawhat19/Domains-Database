import { blogArticles } from '../src/shared/blog/articles';
import { absoluteSiteUrl, publicSeoRoutes } from '../src/shared/seo';

const xmlEntities: Record<string, string> = {
  '&': `&amp;`, '<': `&lt;`, '>': `&gt;`, '"': `&quot;`, "'": `&apos;`,
};
const escapeXml = (value: string) => value.replace(/[&<>"']/g, character => xmlEntities[character] ?? character);
export const GET = () => {
  const paths = [...new Set([...publicSeoRoutes.map(route => route.href), ...blogArticles.map(article => `/blog/${article.slug}`)])];
  const entries = paths.map(path => `  <url><loc>${escapeXml(absoluteSiteUrl(path))}</loc></url>`).join(`\n`);
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`, { headers: {
    'Content-Type': `application/xml; charset=utf-8`,
    'X-Content-Type-Options': `nosniff`,
    'Cache-Control': `public, max-age=3600`,
  } });
};
