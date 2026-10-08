import Notifications from '../../src/components/Notifications';
import { sampleNotifications } from '../../src/shared/sampleNotifications';

export const generateStaticParams = () => sampleNotifications.map(({ id }) => ({ id }));

const NotificationRoute = () => <Notifications detail />;

export default NotificationRoute;
