import PageMeta from '../src/components/PageMeta';
import AuthForm from '../src/components/AuthForm';

const SignInRoute = () => (
  <>
    <PageMeta title={`Sign In`} description={`Sign in to your local account`} />
    <AuthForm mode={`signin`} />
  </>
);

export default SignInRoute;
