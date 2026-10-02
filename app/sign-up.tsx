import { Redirect } from 'expo-router';
import { routes } from '../src/shared/routes';

const RedirectRoute = () => <Redirect href={routes.signup.href} />;

export default RedirectRoute;
