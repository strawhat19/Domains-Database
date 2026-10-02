import { Redirect } from 'expo-router';
import { routes } from '../src/shared/routes';

const RedirectRoute = () => <Redirect href={routes.profile.href} />;

export default RedirectRoute;
