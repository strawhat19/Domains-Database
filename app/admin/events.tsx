import { Redirect } from 'expo-router';
import { routes } from '../../src/shared/routes';

const AdminEventsRoute = () => <Redirect href={routes.adminEvents.href} />;

export default AdminEventsRoute;
