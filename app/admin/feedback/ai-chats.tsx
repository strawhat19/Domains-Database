import { Redirect } from 'expo-router';
import { routes } from '../../../src/shared/routes';

const AdminAIChatsRoute = () => <Redirect href={routes.adminAIChats.href} />;

export default AdminAIChatsRoute;
