import PageMeta from '../src/components/PageMeta';
import DomainSearch from '../src/components/DomainSearch';

const SearchRoute = () => (
  <>
    <PageMeta title={`Domain Search`} description={`Compare domain availability and prices across available registrars`} />
    <DomainSearch />
  </>
);

export default SearchRoute;
