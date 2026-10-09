import type { PropsWithChildren } from 'react';
import { themePalettes, THEME_STORAGE_KEY, THEME_BOOTSTRAP_KEY } from '../src/shared/themeContext/theme';

const themeBootstrap = `
try {
  const cached = localStorage.getItem(\`${THEME_BOOTSTRAP_KEY}\`);
  const saved = cached === \`light\` || cached === \`dark\` ? cached : localStorage.getItem(\`${THEME_STORAGE_KEY}\`);
  const theme = saved === \`light\` ? \`light\` : \`dark\`;
  document.documentElement.dataset.theme = theme;
  document.getElementById(\`domains-theme\`)?.setAttribute(
    \`content\`,
    theme === \`light\` ? \`${themePalettes.light.canvas}\` : \`${themePalettes.dark.canvas}\`
  );
} catch {}
`;

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
      <script
        id={`domains-theme-bootstrap`}
        className={`domains-theme-bootstrap`}
        dangerouslySetInnerHTML={{ __html: themeBootstrap }}
      />
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
