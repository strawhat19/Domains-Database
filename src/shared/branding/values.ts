export const getAppName = (switched = false) => switched ? `Domain Databases` : `Domains Database`;

export const formatBrandText = (text: string, name: string) => text.replace(/\b(?:Domains Database|Domain Databases)\b/gi, match =>
  match === match.toUpperCase() ? name.toUpperCase() : match === match.toLowerCase() ? name.toLowerCase() : name);

export const formatBrandContent = <Value>(value: Value, name: string): Value => {
  if (typeof value === `string`) return formatBrandText(value, name) as Value;
  if (Array.isArray(value)) return value.map(item => formatBrandContent(item, name)) as Value;
  if (value && typeof value === `object`) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, formatBrandContent(item, name)])) as Value;
  return value;
};

export const getBrandedBlogImage = (image: string, switched: boolean) => switched ? image.replace(/^\/images\/blog\/([^/]+)\.svg$/, `/images/blog/name-switch/$1.svg`) : image;
