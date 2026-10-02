import type { PropsWithChildren } from 'react';

const RootHtml = ({ children }: PropsWithChildren) => (
  <html id={`domains-document`} className={`domains-document`} lang={`en`}>
    <head id={`domains-head`} className={`domains-head`}>
      <meta id={`domains-charset`} className={`domains-meta`} charSet={`utf-8`} />
      <meta id={`domains-theme`} className={`domains-meta`} name={`theme-color`} content={`#f7f6f2`} />
      <meta id={`domains-viewport`} className={`domains-meta`} name={`viewport`} content={`width=device-width, initial-scale=1`} />
      <link id={`domains-favicon`} className={`domains-link`} rel={`icon`} type={`image/svg+xml`} href={`/favicon.svg`} />
    </head>
    <body id={`domains-body`} className={`domains-body`}>
      {children}
    </body>
  </html>
);

export default RootHtml;
