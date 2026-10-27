export type GitHubIdentityProps = { id: string; kind: `github` | `language` | `author`; name?: string; avatarUrl?: string | null; large?: boolean };
type LanguageIdentity = { slug: string; color: string };
const languages: Readonly<Record<string, LanguageIdentity>> = {
  c: { slug: `c`, color: `#A8B9CC` },
  go: { slug: `go`, color: `#00ADD8` },
  css: { slug: `css`, color: `#663399` },
  php: { slug: `php`, color: `#777BB4` },
  html: { slug: `html5`, color: `#E34F26` },
  ruby: { slug: `ruby`, color: `#CC342D` },
  json: { slug: `json`, color: `currentColor` },
  rust: { slug: `rust`, color: `currentColor` },
  shell: { slug: `gnubash`, color: `#4EAA25` },
  swift: { slug: `swift`, color: `#F05138` },
  kotlin: { slug: `kotlin`, color: `#7F52FF` },
  python: { slug: `python`, color: `#3776AB` },
  'c++': { slug: `cplusplus`, color: `#00599C` },
  markdown: { slug: `markdown`, color: `currentColor` },
  javascript: { slug: `javascript`, color: `#F7DF1E` },
  typescript: { slug: `typescript`, color: `#3178C6` },
};
export const getGitHubLanguageIdentity = (name: string): LanguageIdentity | null => Object.hasOwn(languages, name.trim().toLowerCase()) ? languages[name.trim().toLowerCase()] ?? null : null;
