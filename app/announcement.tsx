import { Redirect } from 'expo-router';
import { routes } from '../src/shared/routes';

const NotificationsRedirect = () => <Redirect href={routes.notifications.href} />;

export default NotificationsRedirect;
