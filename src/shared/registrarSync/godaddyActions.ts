const lifecycleStatuses = [`ACCEPTED`, `AWAITING`, `PENDING`] as const;
const terminalStatuses = [`CANCELLED`, `FAILED`, `SUCCESS`] as const;
const lifecycleTypes = [
  `AUTO_RENEWAL`, `DOMAIN_DELETE`, `EXPIRY`, `MIGRATE`, `MIGRATE_IN`, `REDEEM`, `REGISTER`, `RENEW`, `RENEW_UNDO`,
  `TRANSFER`, `TRANSFER_IN`, `TRANSFER_IN_ACCEPT`, `TRANSFER_IN_CANCEL`, `TRANSFER_IN_RESTART`, `TRANSFER_IN_RETRY`,
  `TRANSFER_OUT`, `TRANSFER_OUT_ACCEPT`, `TRANSFER_OUT_REJECT`, `TRANSFER_OUT_REQUESTED`, `TRANSIT`,
] as const;
const timestampFields = [`createdAt`, `startedAt`, `modifiedAt`] as const;

export type GoDaddyLifecycleAction = {
  type: typeof lifecycleTypes[number];
  status: typeof lifecycleStatuses[number];
  createdAt?: string;
  startedAt?: string;
  modifiedAt?: string;
};

const actionTimestamp = (value: unknown) => {
  if (typeof value !== `string` || value.length > 64) return undefined;
  const date = /^(\d{4}-\d{2}-\d{2})(?:T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2}))?$/.exec(value);
  if (!date) return undefined;
  const day = new Date(`${date[1]}T00:00:00Z`);
  const time = new Date(value);
  if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== date[1] || !Number.isFinite(time.getTime())) return undefined;
  return value.length === 10 ? value : time.toISOString();
};

export const normalizeGoDaddyLifecycleActions = (value: unknown): GoDaddyLifecycleAction[] | undefined => {
  if (!Array.isArray(value) || value.length > 128) return undefined;
  const actions: GoDaddyLifecycleAction[] = [];
  for (const raw of value as unknown[]) {
    if (!raw || typeof raw !== `object` || Array.isArray(raw)) return undefined;
    const record = raw as Record<string, unknown>;
    if (typeof record.type !== `string` || typeof record.status !== `string`) return undefined;
    const type = lifecycleTypes.find(value => value === record.type);
    if (!type) continue;
    const status = lifecycleStatuses.find(value => value === record.status);
    if (!status) {
      if (terminalStatuses.some(value => value === record.status)) continue;
      return undefined;
    }
    const action: GoDaddyLifecycleAction = { type, status };
    for (const field of timestampFields) {
      const timestamp = actionTimestamp(record[field]);
      if (timestamp) action[field] = timestamp;
    }
    actions.push(action);
  }
  return actions.sort((first, second) => (second.modifiedAt ?? second.startedAt ?? second.createdAt ?? ``)
    .localeCompare(first.modifiedAt ?? first.startedAt ?? first.createdAt ?? ``)).slice(0, 16);
};
