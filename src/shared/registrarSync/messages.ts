import type { ConnectionSyncResult } from './types';

export const formatSyncNotice = (result: Pick<ConnectionSyncResult, `count` | `warnings`>, heading = ``) =>
  [`${heading ? `${heading} — ` : ``}${result.count} Domain(s) Synced`, ...result.warnings].join(`\n`);
