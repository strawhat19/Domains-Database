import Head from 'expo-router/head';

type PageMetaProps = { title: string; description: string };

const PageMeta = ({ title, description }: PageMetaProps) => (
  <Head>
    <title id={`page-title`} className={`page-title`}>
      {`${title} | Domains Database`}
    </title>
    <meta id={`page-description`} className={`page-description`} name={`description`} content={description} />
  </Head>
);

export default PageMeta;
