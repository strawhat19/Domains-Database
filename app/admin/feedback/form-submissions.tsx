import { Redirect } from 'expo-router';
import { routes } from '../../../src/shared/routes';

const AdminFormSubmissionsRoute = () => <Redirect href={routes.adminFormSubmissions.href} />;

export default AdminFormSubmissionsRoute;
