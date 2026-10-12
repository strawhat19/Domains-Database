import { Redirect } from 'expo-router';
import { routes } from '../../../src/shared/routes';

const AdminFeedbackRoute = () => <Redirect href={routes.adminFeedback.href} />;

export default AdminFeedbackRoute;
