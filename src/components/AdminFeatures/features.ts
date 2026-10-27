import type { FeatureFlagKey } from '../../shared/featureFlags/types';

export const featureDefinitions = [
  { key: `themeToggle`, label: `Theme Toggle`, description: `Show the light and dark mode button. When disabled, the app uses dark mode` },
  { key: `domainMarquee`, label: `Top Bar Marquee`, description: `Show the infinite domain marquee above the header` },
  { key: `notifications`, label: `Notifications`, description: `Show public notifications and the notification button` },
  { key: `contact`, label: `Contact`, description: `Show contact links and the public contact form` },
  { key: `pricingTable`, label: `Pricing Table`, description: `Enable plan actions. When disabled, collect signed-in interest and plan votes without requiring an account` },
  { key: `ads`, label: `Ads`, description: `Show Google Auto ads on eligible public web content after account and consent checks. Starter and active Owner accounts remain ad-free` },
  { key: `nameSwitch`, label: `Name Switch`, description: `Use Domain Databases across the app and browser title by default. Disable to use Domains Database` },
] as const satisfies readonly { key: FeatureFlagKey; label: string; description: string }[];
