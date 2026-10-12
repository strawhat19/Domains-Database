import type { PropsWithChildren } from 'react';
import { themePalettes } from '../src/shared/themeContext/theme';

const RootHtml = ({ children }: PropsWithChildren) => (
  <html
    lang={`en`}
    data-theme={`dark`}
    suppressHydrationWarning
    id={`domains-document`}
    className={`domains-document`}
  >
    <head id={`domains-head`} className={`domains-head`}>
      <meta id={`domains-charset`} className={`domains-meta`} charSet={`utf-8`} />
      <meta id={`domains-theme`} className={`domains-meta`} name={`theme-color`} content={themePalettes.dark.canvas} />
      <meta id={`domains-viewport`} className={`domains-meta`} name={`viewport`} content={`width=device-width, initial-scale=1`} />
      <link id={`domains-favicon`} className={`domains-link`} rel={`icon`} type={`image/svg+xml`} href={`/favicon.svg`} />
      <link
        id={`domains-apple-touch-icon`}
        className={`domains-link`}
        rel={`apple-touch-icon`}
        href={`/apple-touch-icon.png`}
      />
    </head>
    <body id={`domains-body`} className={`domains-body`}>
      {children}
    </body>
  </html>
);

export default RootHtml;
