import PageMeta from '../src/components/PageMeta';
import ThemeReady from '../src/components/ThemeReady';
import DomainPortfolio from '../src/components/DomainPortfolio';

const DomainsPage = () => (
  <>
    <PageMeta title={`Domains`} description={`Search and manage your domains across Hostinger, GoDaddy, GoDaddy Auctions, and Namecheap.`} />
    <ThemeReady>
      <DomainPortfolio />
    </ThemeReady>
  </>
);

export default DomainsPage;
