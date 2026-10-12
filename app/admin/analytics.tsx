import { Redirect } from 'expo-router';
import { routes } from '../../src/shared/routes';

const AdminAnalyticsRoute = () => <Redirect href={routes.adminAnalytics.href} />;

export default AdminAnalyticsRoute;
