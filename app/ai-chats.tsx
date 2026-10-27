import { routes } from '../src/shared/routes';
import PageMeta from '../src/components/PageMeta';
import AdminDashboard from '../src/components/AdminDashboard';

const AdminAIChatsRoute = () => (
  <>
    <PageMeta title={`Admin · Chats`} description={`Private support conversation history`} />
    <AdminDashboard section={routes.adminAIChats.adminSection} />
  </>
);

export default AdminAIChatsRoute;
