import type { ReactNode } from 'react';
import type { TrafficOutcomes } from './data';
import TrafficOverview from './TrafficOverview.web';
import TrafficAnalytics from './TrafficAnalytics.web';

export type AdminAnalyticsProps = { compact?: boolean; headingTabs?: ReactNode; outcomes?: TrafficOutcomes; outcomesLoading?: boolean; headingActionsTarget?: HTMLElement | null };
const AdminAnalytics = ({ compact = false, headingTabs, ...props }: AdminAnalyticsProps) => compact ? <TrafficOverview headingTabs={headingTabs} /> : <TrafficAnalytics {...props} />;
export default AdminAnalytics;
