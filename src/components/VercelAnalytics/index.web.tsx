import { Analytics } from '@vercel/analytics/react';
import { usePathname, useSegments } from 'expo-router';

const VercelAnalytics = () => {
  const pathname = usePathname();
  const segments = useSegments();
  const route = `/${segments.filter(segment => !segment.startsWith(`(`)).join(`/`)}`;

  return <Analytics path={pathname} route={route} />;
};

export default VercelAnalytics;
