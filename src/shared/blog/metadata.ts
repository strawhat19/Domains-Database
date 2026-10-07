import type { BlogArticle } from './articles';
import { absoluteSiteUrl } from '../seo';

export const blogTitle = `Domain Guides & Portfolio Tips Blog`;
export const blogDescription = `Practical guides to choosing domain names, managing a domain portfolio, evaluating names, researching expired domains, and protecting your registrations.`;

export const getBlogHref = (slug: string) => ({
  pathname: `/blog/[slug]` as const,
  params: { slug },
});

export const formatBlogDate = (date: string) => new Intl.DateTimeFormat(`en-US`, {
  day: `numeric`,
  year: `numeric`,
  month: `long`,
  timeZone: `UTC`,
}).format(new Date(date));

export const getArticleSchema = (article: BlogArticle) => [
  {
    '@type': `BlogPosting`,
    '@context': `https://schema.org`,
    url: absoluteSiteUrl(`/blog/${article.slug}`),
    image: absoluteSiteUrl(article.image),
    headline: article.title,
    inLanguage: `en-US`,
    description: article.description,
    datePublished: article.publishedAt,
    articleSection: article.category,
    author: {
      '@type': `Organization`,
      name: `Domains Database`,
      url: absoluteSiteUrl(`/about`),
    },
    publisher: {
      '@type': `Organization`,
      name: `Domains Database`,
      url: absoluteSiteUrl(`/`),
    },
    mainEntityOfPage: {
      '@type': `WebPage`,
      '@id': absoluteSiteUrl(`/blog/${article.slug}`),
    },
  },
  {
    '@type': `BreadcrumbList`,
    '@context': `https://schema.org`,
    itemListElement: [
      { '@type': `ListItem`, position: 1, name: `Home`, item: absoluteSiteUrl(`/`) },
      { '@type': `ListItem`, position: 2, name: `Blog`, item: absoluteSiteUrl(`/blog`) },
      { '@type': `ListItem`, position: 3, name: article.title, item: absoluteSiteUrl(`/blog/${article.slug}`) },
    ],
  },
];
