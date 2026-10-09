import { connectionFields, type ConnectionProvider, type EnvironmentImportResult } from '../../shared/connections/types';

const MAX_VALUE_SIZE = 8192;
const MAX_CONNECTION_SIZE = 12_000;
export const importEnvironmentConnections = (userId: string, providers: readonly ConnectionProvider[]): EnvironmentImportResult => {
  let skipped = 0;
  const connections: EnvironmentImportResult[`connections`] = [];
  for (const field of connectionFields.filter(field => providers.includes(field.id))) {
    const lines: string[] = [];
    for (const key of field.keys) {
      const value = process.env[key];
      if (!value?.trim()) continue;
      if (value.length > MAX_VALUE_SIZE || /[\p{Cc}\p{Cf}\u2028\u2029]/u.test(value)) { skipped++; continue; }
      lines.push(`${key}=${JSON.stringify(value)}`);
    }
    const values = lines.join(`\n`);
    if (!values) continue;
    if (values.length > MAX_CONNECTION_SIZE) { skipped += lines.length; continue; }
    connections.push({ values, provider: field.id });
  }
  return { userId, skipped, connections };
};
