export type DomainProjectStatus = `Future` | `To Do` | `In Development` | `Almost Done` | `Review` | `Testing` | `Done`;
export type DomainDifficulty = `Simple` | `Business` | `Professional` | `Enterprise`;

export const DEFAULT_DOMAIN_PROJECT_STATUS: DomainProjectStatus = `Future`;

interface DomainProjectOption<Value extends string> {
  icon: string;
  color: string;
  value: Value;
  label: string;
}

export const DOMAIN_PROJECT_STATUSES: readonly DomainProjectOption<DomainProjectStatus>[] = [
  { icon: `Lightbulb`, color: `#b45309`, value: `Future`, label: `Future` },
  { icon: `ListTodo`, color: `#2563eb`, value: `To Do`, label: `To Do` },
  { icon: `Code2`, color: `#9333ea`, value: `In Development`, label: `In Development` },
  { icon: `Flag`, color: `#c2410c`, value: `Almost Done`, label: `Almost Done` },
  { icon: `Eye`, color: `#db2777`, value: `Review`, label: `Review` },
  { icon: `FlaskConical`, color: `#0891b2`, value: `Testing`, label: `Testing` },
  { icon: `CircleCheck`, color: `#15803d`, value: `Done`, label: `Done` },
];

export const DOMAIN_DIFFICULTIES: readonly DomainProjectOption<DomainDifficulty>[] = [
  { icon: `Sprout`, color: `#15803d`, value: `Simple`, label: `Simple` },
  { icon: `Briefcase`, color: `#2563eb`, value: `Business`, label: `Business` },
  { icon: `Award`, color: `#9333ea`, value: `Professional`, label: `Professional` },
  { icon: `Building2`, color: `#c2410c`, value: `Enterprise`, label: `Enterprise` },
];

const normalizeOption = <Value extends string>(value: unknown, label: string, options: readonly DomainProjectOption<Value>[]) => {
  if (value == null || value === ``) return undefined;
  if (typeof value !== `string`) throw new Error(`${label} Must Be Text`);
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  const option = options.find(item => item.value.toLowerCase() === normalized);
  if (!option) throw new Error(`Choose A Valid ${label}`);
  return option.value;
};

export const normalizeDomainProjectStatus = (value: unknown): DomainProjectStatus => {
  const status = typeof value === `string` && value.trim().toLowerCase() === `future idea` ? DEFAULT_DOMAIN_PROJECT_STATUS : value;
  return normalizeOption(status, `Project Status`, DOMAIN_PROJECT_STATUSES) ?? DEFAULT_DOMAIN_PROJECT_STATUS;
};
export const normalizeDomainDifficulty = (value: unknown) => normalizeOption(value, `Difficulty Level`, DOMAIN_DIFFICULTIES);
