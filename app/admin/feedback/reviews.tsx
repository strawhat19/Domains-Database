import { Redirect } from 'expo-router';
import { routes } from '../../../src/shared/routes';

const AdminReviewsRoute = () => <Redirect href={routes.adminReviews.href} />;

export default AdminReviewsRoute;
