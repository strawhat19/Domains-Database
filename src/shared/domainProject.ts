export type DomainProjectStatus =
  | `Future`
  | `Idea`
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
  | `Blocked`
  | `Ads Review`
  | `Testing`
  | `Done`;
export type DomainDifficulty = `Simple` | `Business` | `Professional` | `Enterprise`;
export type DomainProjectTone = `neutral` | `accent` | `warning` | `success` | `danger`;

export const DEFAULT_DOMAIN_PROJECT_STATUS: DomainProjectStatus = `Future`;

interface DomainProjectOption<Value extends string> {
  icon: string;
  tone: DomainProjectTone;
  value: Value;
  label: string;
}

export const DOMAIN_PROJECT_STATUSES: readonly DomainProjectOption<DomainProjectStatus>[] = [
  { icon: `Clock`, tone: `neutral`, value: `Future`, label: `Future` },
  { icon: `Lightbulb`, tone: `neutral`, value: `Idea`, label: `Idea` },
  { icon: `ListTodo`, tone: `neutral`, value: `To Do`, label: `To Do` },
  { icon: `Brain`, tone: `neutral`, value: `Concepting`, label: `Concepting` },
  { icon: `CheckCheck`, tone: `neutral`, value: `Concept Finalize`, label: `Concept Finalize` },
  { icon: `Code2`, tone: `accent`, value: `In Development`, label: `In Development` },
  { icon: `Flag`, tone: `success`, value: `Almost Done`, label: `Almost Done` },
  { icon: `Monitor`, tone: `success`, value: `Front End Done`, label: `Front End Done` },
  { icon: `Plug`, tone: `accent`, value: `Connecting Back End`, label: `Connecting Back End` },
  { icon: `LogIn`, tone: `accent`, value: `Sign In / Sign Up`, label: `Sign In / Sign Up` },
  { icon: `Database`, tone: `accent`, value: `Database Functionality`, label: `Database Functionality` },
  { icon: `CreditCard`, tone: `accent`, value: `Connecting Payments`, label: `Connecting Payments` },
  { icon: `Smartphone`, tone: `accent`, value: `Mobile Responsiveness`, label: `Mobile Responsiveness` },
  { icon: `Rocket`, tone: `success`, value: `MVP`, label: `MVP` },
  { icon: `Eye`, tone: `warning`, value: `Review`, label: `Review` },
  { icon: `Ban`, tone: `danger`, value: `Blocked`, label: `Blocked` },
  { icon: `Megaphone`, tone: `warning`, value: `Ads Review`, label: `Ads Review` },
  { icon: `FlaskConical`, tone: `warning`, value: `Testing`, label: `Testing` },
  { icon: `CircleCheck`, tone: `success`, value: `Done`, label: `Done` },
];

export const DOMAIN_DIFFICULTIES: readonly DomainProjectOption<DomainDifficulty>[] = [
  { icon: `Sprout`, tone: `success`, value: `Simple`, label: `Simple` },
  { icon: `Briefcase`, tone: `accent`, value: `Business`, label: `Business` },
  { icon: `Award`, tone: `neutral`, value: `Professional`, label: `Professional` },
  { icon: `Building2`, tone: `warning`, value: `Enterprise`, label: `Enterprise` },
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
