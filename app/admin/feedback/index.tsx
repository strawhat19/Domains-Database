import { routes } from '../../../src/shared/routes';
import PageMeta from '../../../src/components/PageMeta';
import AdminDashboard from '../../../src/components/AdminDashboard';

const AdminFeedbackRoute = () => (
  <>
    <PageMeta title={`Admin · Feedback`} description={`Browse forms, reviews, chats, and messages`} />
    <AdminDashboard section={routes.adminFeedback.adminSection} />
  </>
);

export default AdminFeedbackRoute;
