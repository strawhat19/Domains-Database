import Hero from '../src/components/Hero';
import PageMeta from '../src/components/PageMeta';
import DomainPortfolio from '../src/components/DomainPortfolio';

const HomePage = () => (
  <>
    <PageMeta title={`Every Domain, In Order`} description={`Your personal domain inventory, together across registrars. Keep track of renewals, ownership, and yearly costs.`} />
    <Hero />
    <DomainPortfolio compact />
  </>
);

export default HomePage;
