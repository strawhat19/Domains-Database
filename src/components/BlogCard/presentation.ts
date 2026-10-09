const accents: Record<string, readonly [string, string]> = {
  Basics: [`#138b8b`, `#5acfc6`],
  History: [`#138b8b`, `#5acfc6`],
  Naming: [`#7356a1`, `#c1a3ed`],
  Security: [`#187565`, `#71d9b7`],
  Portfolio: [`#3c6c9c`, `#95bfe8`],
  Lifecycle: [`#a65d31`, `#e7b987`],
  Extensions: [`#7356a1`, `#c1a3ed`],
  Evaluation: [`#bc6944`, `#edb194`],
};

export const getBlogCardAccent = (category: string, dark = false) => (accents[category] ?? accents.Basics)[dark ? 1 : 0];
export const formatBlogDate = (value: string) => {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat(`en-US`, { day: `numeric`, month: `long`, year: `numeric`, timeZone: `UTC` }).format(date) : ``;
};
