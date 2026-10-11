import type { TrafficOutcomes } from './data';
import TrafficOverview from './TrafficOverview.web';
import TrafficAnalytics from './TrafficAnalytics.web';

export type AdminAnalyticsProps = { compact?: boolean; outcomes?: TrafficOutcomes; outcomesLoading?: boolean; headingActionsTarget?: HTMLElement | null };
const AdminAnalytics = ({ compact = false, ...props }: AdminAnalyticsProps) => compact ? <TrafficOverview /> : <TrafficAnalytics {...props} />;
export default AdminAnalytics;
