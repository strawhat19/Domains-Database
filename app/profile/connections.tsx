import { routes } from '../../src/shared/routes';
import PageMeta from '../../src/components/PageMeta';
import AccountPage from '../../src/components/AccountPage';
import ProtectedRoute from '../../src/components/ProtectedRoute';

const ConnectionsRoute = () => (
  <>
    <PageMeta title={`Connections`} description={`Private registrar connection values for your account`} />
    <ProtectedRoute minRole={routes.connections.minRole}>
      <AccountPage page={`connections`} />
    </ProtectedRoute>
  </>
);

export default ConnectionsRoute;
