import PageMeta from '../src/components/PageMeta';
import DomainPortfolio from '../src/components/DomainPortfolio';

const DomainsPage = () => (
  <>
    <PageMeta title={`Your Portfolio`} description={`Search and manage your domains across Hostinger, GoDaddy, GoDaddy Auctions, and Namecheap.`} />
    <DomainPortfolio />
  </>
);

export default DomainsPage;
