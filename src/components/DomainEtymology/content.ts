export const wordOrigins = [
  { word: `dominium`, language: `Latin`, meaning: `Rule or ownership` },
  { word: `demeine`, language: `Anglo-French`, meaning: `Land one owns` },
  { word: `domain`, language: `English`, meaning: `A named area` },
] as const;

export const urlParts = {
  scheme: { value: `https://`, label: `Scheme + Separator` },
  subdomain: { value: `shop.`, label: `Subdomain` },
  name: { value: `example`, label: `Second-Level Label` },
  tld: { value: `.com`, label: `Top-Level Domain` },
  path: { value: `/guides`, label: `Path` },
  query: { value: `?topic=dns`, label: `Query` },
  fragment: { value: `#intro`, label: `Fragment` },
} as const;

export type UrlPartKey = keyof typeof urlParts;
export const exampleUrl = `https://shop.example.com/guides?topic=dns#intro`;
export const etymologyCaption = `URL stands for Uniform Resource Locator. The scheme is https; :// introduces the host in this example. The hostname is shop.example.com, and example.com is the registered domain here. The path, query, and fragment identify a resource, pass parameters, and point to a part of it.`;
