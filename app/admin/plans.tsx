import { Redirect } from 'expo-router';
import { routes } from '../../src/shared/routes';

const AdminPlansRoute = () => <Redirect href={routes.adminPlans.href} />;

export default AdminPlansRoute;
