import { Redirect } from 'expo-router';
import { routes } from '../../src/shared/routes';

const PaymentsRedirect = () => <Redirect href={routes.adminPayments.href} />;

export default PaymentsRedirect;
