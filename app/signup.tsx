import PageMeta from '../src/components/PageMeta';
import AuthForm from '../src/components/AuthForm';

const SignUpRoute = () => (
  <>
    <PageMeta title={`Sign Up`} description={`Create your account and continue with your selected plan`} />
    <AuthForm mode={`signup`} />
  </>
);

export default SignUpRoute;
