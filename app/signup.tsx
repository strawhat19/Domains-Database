import PageMeta from '../src/components/PageMeta';
import AuthForm from '../src/components/AuthForm';

const SignUpRoute = () => (
  <>
    <PageMeta title={`Sign Up`} description={`Create your local account`} />
    <AuthForm mode={`signup`} />
  </>
);

export default SignUpRoute;
