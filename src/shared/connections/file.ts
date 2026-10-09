import { connectionFields, type ConnectionProvider } from './types';

export const MAX_CONNECTION_ENV_SIZE = 256_000;
const MAX_CONNECTION_VALUE_SIZE = 8192;
const MAX_CONNECTION_GROUP_SIZE = 12_000;
export interface ConnectionEnvironmentEntry { provider: ConnectionProvider; values: string }
export interface ConnectionEnvironmentPreview { ignored: number; connections: ConnectionEnvironmentEntry[] }
interface EnvironmentValue { value: string; line: number }
const valueError = (line: number, key: string, reason: string) => new Error(`Line ${line}: ${key} ${reason}`);
const quoteEnd = (text: string, start: number, quote: string) => {
  for (let index = start; index < text.length; index++) {
    if (text[index] === `\\` && index + 1 < text.length) index++;
    else if (text[index] === quote) return index;
  }
  return -1;
};
const unescapeQuotedValue = (text: string, quote: string) => {
  let value = ``;
  for (let index = 0; index < text.length; index++) {
    const next = text[index + 1];
    if (text[index] === `\\` && (next === quote || next === `\\`)) { value += next; index++; }
    else value += text[index];
  }
  return value;
};
const formatValue = (value: string) => value.includes(`'`) ? `"${value}"` : `'${value}'`;

export const parseConnectionEnvironment = (text: string, providers?: readonly ConnectionProvider[]): ConnectionEnvironmentPreview => {
  if (typeof text !== `string`) throw new Error(`Enter Valid .env Text`);
  if (text.length > MAX_CONNECTION_ENV_SIZE) throw new Error(`.env Text Exceeds The Size Limit`);
  const fields = connectionFields.filter(field => !providers || providers.includes(field.id));
  const keys = new Set<string>(fields.flatMap(field => [...field.keys]));
  const values = new Map<string, EnvironmentValue>();
  const lines = text.replace(/^\uFEFF/, ``).split(/\r?\n/);
  let ignored = 0;
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const declaration = /^[ \t]*(?:export[ \t]+)?([A-Za-z_][A-Za-z0-9_.-]*)[ \t]*=[ \t]*([\s\S]*)$/.exec(line);
    if (!declaration?.[1]) continue;
    const key = declaration[1];
    const literal = declaration[2] ?? ``;
    const supported = keys.has(key);
    const quotedText = supported ? literal : literal.trimStart();
    const quote = [`'`, `"`, `\``].includes(quotedText[0]) ? quotedText[0] : undefined;
    const end = quote ? quoteEnd(quotedText, 1, quote) : -1;
    if (!supported) {
      ignored++;
      if (quote && end < 0) {
        while (index + 1 < lines.length) {
          index++;
          if (quoteEnd(lines[index], 0, quote) >= 0) break;
        }
      }
      continue;
    }
    const lineNumber = index + 1;
    if (quote && end < 0) throw valueError(lineNumber, key, `Must Use A Single-Line Value`);
    if (quote && literal.slice(end + 1).trim() && !literal.slice(end + 1).trim().startsWith(`#`)) {
      throw valueError(lineNumber, key, `Has Invalid Text After Its Value`);
    }
    const value = quote ? unescapeQuotedValue(literal.slice(1, end), quote) : literal.split(`#`, 1)[0].replace(/^[ \t]+|[ \t]+$/g, ``);
    if (/[\p{Cc}\p{Cf}\u2028\u2029]/u.test(value)) throw valueError(lineNumber, key, `Must Use A Single-Line Value Without Control Characters`);
    if (value.length > MAX_CONNECTION_VALUE_SIZE) throw valueError(lineNumber, key, `Exceeds The Size Limit`);
    if (!value.trim()) { values.delete(key); ignored++; continue; }
    values.set(key, { value, line: lineNumber });
  }
  const connections = fields.flatMap(field => {
    const entries = field.keys.flatMap(key => {
      const saved = values.get(key);
      return saved ? [{ key, ...saved }] : [];
    });
    if (!entries.length) return [];
    const connection = entries.map(({ key, value }) => `${key}=${formatValue(value)}`).join(`\n`);
    if (connection.length > MAX_CONNECTION_GROUP_SIZE) {
      const last = entries[entries.length - 1];
      throw valueError(last.line, last.key, `Exceeds The Connection Size Limit`);
    }
    return [{ provider: field.id, values: connection }];
  });
  return { ignored, connections };
};
