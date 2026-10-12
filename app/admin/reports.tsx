import { Redirect } from 'expo-router';
import { routes } from '../../src/shared/routes';

const AdminReportsRoute = () => <Redirect href={routes.adminReports.href} />;

export default AdminReportsRoute;
