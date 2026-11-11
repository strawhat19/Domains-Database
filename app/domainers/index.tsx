import { routes } from '../../src/shared/routes';
import PageMeta from '../../src/components/PageMeta';
import DomainerDirectory from '../../src/components/DomainerDirectory';
import { directoryDescription } from '../../src/components/DomainerDirectory/options';

const DomainersPage = () => (
  <>
    <PageMeta title={routes.domainers.label} canonicalPath={routes.domainers.href} description={directoryDescription} />
    <DomainerDirectory />
  </>
);

export default DomainersPage;
