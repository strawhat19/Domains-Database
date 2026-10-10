export const capWords = (value: string) => value.replace(/\b\w/g, letter => letter.toUpperCase());
export const countPropertiesInObject = (value: object) => Object.keys(value).length;
export const getRandomArrayValue = <T,>(values: readonly T[]) => values[Math.floor(Math.random() * values.length)];
export const getRandomArrayValues = <T,>(values: readonly T[], count = values.length) => {
  const shuffled = [...values];
  const limit = Math.min(Math.max(0, Math.floor(count)), shuffled.length);
  for (let index = 0; index < limit; index += 1) {
    const randomIndex = index + Math.floor(Math.random() * (shuffled.length - index));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex]!, shuffled[index]!];
  }
  return shuffled.slice(0, limit);
};
export const isValid = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === `string`) return Boolean(value.trim());
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === `number`) return Number.isFinite(value);
  if (typeof value === `object`) return Object.keys(value).length > 0;
  return true;
};
export const toTimestamp = (value: unknown, fallback = new Date().toISOString()) => {
  const date = value instanceof Date ? value : typeof value === `string` ? new Date(value) : undefined;
  return date && Number.isFinite(date.getTime()) ? date.toISOString() : fallback;
};
