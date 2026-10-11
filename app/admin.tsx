import { Redirect } from 'expo-router';
import { routes } from '../src/shared/routes';

const AdminRoute = () => <Redirect href={routes.dashboard.href} />;

export default AdminRoute;
