import { Redirect } from 'expo-router';
import { routes } from '../../src/shared/routes';

const AdminRequestsRoute = () => <Redirect href={routes.adminFormSubmissions.href} />;

export default AdminRequestsRoute;
