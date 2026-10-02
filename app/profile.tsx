import { routes } from '../src/shared/routes';
import PageMeta from '../src/components/PageMeta';
import AccountPage from '../src/components/AccountPage';
import ProtectedRoute from '../src/components/ProtectedRoute';

const ProfileRoute = () => (
  <>
    <PageMeta title={`Profile`} description={`Your local account profile`} />
    <ProtectedRoute minRole={routes.profile.minRole}>
      <AccountPage page={`profile`} />
    </ProtectedRoute>
  </>
);

export default ProfileRoute;
