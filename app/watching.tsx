import { routes } from '../src/shared/routes';
import PageMeta from '../src/components/PageMeta';
import Watching from '../src/components/Watching';
import ProtectedRoute from '../src/components/ProtectedRoute';

const WatchingPage = () => (
  <>
    <PageMeta title={`Watching`} description={`Watch domains and compare registrar availability and prices on this device.`} />
    <ProtectedRoute minRole={routes.watching.minRole}>
      <Watching />
    </ProtectedRoute>
  </>
);

export default WatchingPage;
