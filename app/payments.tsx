import PageMeta from '../src/components/PageMeta';
import AdminDashboard from '../src/components/AdminDashboard';

const PaymentsRoute = () => <>
  <PageMeta noIndex title={`Admin · Payments`} description={`Private invoice and subscription summaries for the app Owner`} />
  <AdminDashboard section={`payments`} />
</>;

export default PaymentsRoute;
