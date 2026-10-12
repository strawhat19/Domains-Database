import { Redirect } from 'expo-router';
import { routes } from '../../src/shared/routes';

const AdminObservabilityRoute = () => <Redirect href={routes.adminObservability.href} />;

export default AdminObservabilityRoute;
