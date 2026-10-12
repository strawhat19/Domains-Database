import { Redirect } from 'expo-router';
import { routes } from '../../src/shared/routes';

const AdminUsersRoute = () => <Redirect href={routes.adminUsers.href} />;

export default AdminUsersRoute;
