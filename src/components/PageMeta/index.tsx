import Head from 'expo-router/head';
import { absoluteSiteUrl } from '../../shared/seo';

export type PageMetaProps = {
  title: string;
  image?: string;
  noIndex?: boolean;
  exactTitle?: boolean;
  description: string;
  publishedAt?: string;
  canonicalPath?: string;
  type?: `website` | `article`;
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
};

const PageMeta = ({ title, image, noIndex, exactTitle, description, publishedAt, canonicalPath, type = `website`, structuredData }: PageMetaProps) => {
  const pageTitle = exactTitle ? title : `${title} | Domains Database`;
  const imageUrl = image ? absoluteSiteUrl(image) : undefined;
  const canonicalUrl = canonicalPath ? absoluteSiteUrl(canonicalPath) : undefined;

  return (
    <Head>
      <title id={`page-title`} className={`page-title`}>
        {pageTitle}
      </title>
      <meta id={`page-description`} className={`page-description`} name={`description`} content={description} />
      <meta id={`page-og-title`} className={`page-meta`} property={`og:title`} content={pageTitle} />
      <meta id={`page-og-type`} className={`page-meta`} property={`og:type`} content={type} />
      <meta id={`page-og-site-name`} className={`page-meta`} property={`og:site_name`} content={`Domains Database`} />
      <meta id={`page-og-description`} className={`page-meta`} property={`og:description`} content={description} />
      <meta id={`page-twitter-title`} className={`page-meta`} name={`twitter:title`} content={pageTitle} />
      <meta id={`page-twitter-description`} className={`page-meta`} name={`twitter:description`} content={description} />
      <meta id={`page-twitter-card`} className={`page-meta`} name={`twitter:card`} content={imageUrl ? `summary_large_image` : `summary`} />
      {noIndex && <meta id={`page-robots`} className={`page-meta`} name={`robots`} content={`noindex, follow`} />}
      {canonicalUrl && <link id={`page-canonical`} className={`page-canonical`} rel={`canonical`} href={canonicalUrl} />}
      {canonicalUrl && <meta id={`page-og-url`} className={`page-meta`} property={`og:url`} content={canonicalUrl} />}
      {imageUrl && <meta id={`page-og-image`} className={`page-meta`} property={`og:image`} content={imageUrl} />}
      {imageUrl && <meta id={`page-twitter-image`} className={`page-meta`} name={`twitter:image`} content={imageUrl} />}
      {type === `article` && publishedAt && <meta id={`page-article-published`} className={`page-meta`} property={`article:published_time`} content={publishedAt} />}
      {structuredData && (
        <script
          id={`page-structured-data`}
          type={`application/ld+json`}
          className={`page-structured-data`}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, `\\u003c`) }}
        />
      )}
    </Head>
  );
};

export default PageMeta;
