import { Redirect } from 'expo-router';
import { routes } from '../../src/shared/routes';

const AdminFeaturesRoute = () => <Redirect href={routes.adminFeatures.href} />;

export default AdminFeaturesRoute;
