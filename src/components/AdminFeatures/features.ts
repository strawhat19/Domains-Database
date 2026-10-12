import type { FeatureFlagKey } from '../../shared/featureFlags/types';

export const featureDefinitions = [
  { key: `themeToggle`, label: `Theme Toggle`, description: `Show the light and dark mode button. When disabled, the app uses dark mode` },
  { key: `domainMarquee`, label: `Top Bar Marquee`, description: `Show the infinite domain marquee above the header` },
  { key: `notifications`, label: `Notifications`, description: `Show public notifications and the notification button` },
  { key: `contact`, label: `Contact`, description: `Show contact links and the public contact form` },
] as const satisfies readonly { key: FeatureFlagKey; label: string; description: string }[];
