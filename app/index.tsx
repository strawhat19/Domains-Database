import Landing from '../src/components/Landing';
import PageMeta from '../src/components/PageMeta';

const HomePage = () => (
  <>
    <PageMeta
      exactTitle
      title={`Domains Database | Idea, Plan, Manage, Execute, Launch`}
      description={`Organize your domain portfolio, track registrar and renewal details, and explore practical domain guides with Domains Database.`}
    />
    <Landing />
  </>
);

export default HomePage;
