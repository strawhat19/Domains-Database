export type DomainProjectStatus =
  | `Future`
  | `To Do`
  | `Concepting`
  | `Concept Finalize`
  | `In Development`
  | `Almost Done`
  | `Front End Done`
  | `Connecting Back End`
  | `Sign In / Sign Up`
  | `Database Functionality`
  | `Connecting Payments`
  | `Mobile Responsiveness`
  | `MVP`
  | `Review`
  | `Ads Review`
  | `Testing`
  | `Done`;
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
  { icon: `Brain`, color: `#a16207`, value: `Concepting`, label: `Concepting` },
  { icon: `CheckCheck`, color: `#4d7c0f`, value: `Concept Finalize`, label: `Concept Finalize` },
  { icon: `Code2`, color: `#9333ea`, value: `In Development`, label: `In Development` },
  { icon: `Flag`, color: `#c2410c`, value: `Almost Done`, label: `Almost Done` },
  { icon: `Monitor`, color: `#0369a1`, value: `Front End Done`, label: `Front End Done` },
  { icon: `Plug`, color: `#7c3aed`, value: `Connecting Back End`, label: `Connecting Back End` },
  { icon: `LogIn`, color: `#0f766e`, value: `Sign In / Sign Up`, label: `Sign In / Sign Up` },
  { icon: `Database`, color: `#1d4ed8`, value: `Database Functionality`, label: `Database Functionality` },
  { icon: `CreditCard`, color: `#047857`, value: `Connecting Payments`, label: `Connecting Payments` },
  { icon: `Smartphone`, color: `#0e7490`, value: `Mobile Responsiveness`, label: `Mobile Responsiveness` },
  { icon: `Rocket`, color: `#6d28d9`, value: `MVP`, label: `MVP` },
  { icon: `Eye`, color: `#db2777`, value: `Review`, label: `Review` },
  { icon: `Megaphone`, color: `#9a3412`, value: `Ads Review`, label: `Ads Review` },
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
