import PageMeta from '../src/components/PageMeta';
import ThemeReady from '../src/components/ThemeReady';
import DomainSearch from '../src/components/DomainSearch';

const SearchRoute = () => (
  <>
    <PageMeta title={`Domain Search`} description={`Compare domain availability and prices across available registrars`} />
    <ThemeReady>
      <DomainSearch />
    </ThemeReady>
  </>
);

export default SearchRoute;
