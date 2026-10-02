import Hero from '../src/components/Hero';
import PageMeta from '../src/components/PageMeta';
import DomainPortfolio from '../src/components/DomainPortfolio';

const HomePage = () => (
  <>
    <PageMeta
      title={`Your Domains. Under Control.`}
      description={`Keep track of every name, registrar, renewal, and yearly cost in your personal domain registry.`}
    />
    <Hero />
    <DomainPortfolio compact />
  </>
);

export default HomePage;
