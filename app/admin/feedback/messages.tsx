import { Redirect } from 'expo-router';
import { routes } from '../../../src/shared/routes';

const AdminMessagesRoute = () => <Redirect href={routes.adminMessages.href} />;

export default AdminMessagesRoute;
