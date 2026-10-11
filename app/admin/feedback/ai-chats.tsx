import { routes } from '../../../src/shared/routes';
import PageMeta from '../../../src/components/PageMeta';
import AdminDashboard from '../../../src/components/AdminDashboard';

const AdminAIChatsRoute = () => (
  <>
    <PageMeta title={`Admin · Chats`} description={`Future AI chatbot conversation history`} />
    <AdminDashboard section={routes.adminAIChats.adminSection} />
  </>
);

export default AdminAIChatsRoute;
