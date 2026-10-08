import Hero from '../src/components/Hero';
import PageMeta from '../src/components/PageMeta';

const HomePage = () => (
  <>
    <PageMeta
      title={`Your Domains. Under Control.`}
      description={`Keep track of every name, registrar, renewal, and yearly cost with Domain Manager.`}
    />
    <Hero />
  </>
);

export default HomePage;
