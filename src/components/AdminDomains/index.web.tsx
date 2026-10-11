import '../AdminUsers/records.scss';
import './styles.scss';
import { Globe2, Search } from 'lucide-react';
import TableStatus from '../AdminUsers/TableStatus';
import { AdminStats, AdminLoading } from '../AdminWidgets';
import type { AdminSnapshot } from '../../shared/admin/types';
import { tableElementProps } from '../AdminUsers/tableElements';
import { getDomainStatus, formatDate } from '../../shared/domainUtils';
import { useAdminDomains, domainStatusOptions, formatAnnualPrice } from './useAdminDomains';

const columns = [`No.`, `Domain`, `Owner`, `Registrar`, `Expires`, `Annual Price`, `Status`, `Auto Renew`];

const AdminDomains = ({ snapshot, loading }: { snapshot: AdminSnapshot | null; loading: boolean }) => {
  const state = useAdminDomains(snapshot);
  return <section {...tableElementProps(`admin-domains`)} className={`admin-domains admin-records`} aria-labelledby={`admin-domains-title`} aria-busy={loading}>
    <div {...tableElementProps(`admin-records-heading`, `domains`)}>
      <div {...tableElementProps(`admin-records-heading-copy`, `domains`)}>
        <h2 {...tableElementProps(`admin-domains-title`)} className={`admin-records-title`}><Globe2 {...tableElementProps(`admin-domains-title-icon`)} size={20} aria-hidden={`true`} />Domain Inventory</h2>
        <p {...tableElementProps(`admin-records-note`, `domains`)}>{`Read Only · Up To ${snapshot?.domainCoverage.limit ?? 500} Domain Records Across Accounts · Filters Apply To Loaded Records`}</p>
      </div>
      <div {...tableElementProps(`admin-records-summary`, `domains`)}>
        <AdminStats id={`domains`} loading={loading} stats={[
          { id: `loaded`, label: `Domains Loaded`, value: snapshot?.domains.length ?? `—` },
          { id: `renewals`, label: `Renewing Soon`, value: state.summary?.renewing ?? `—` },
          { id: `cost`, label: `Annual Renewal Cost`, value: state.summary?.cost ?? `—`, hint: `Loaded Record Window` },
        ]} />
      </div>
    </div>
    <div {...tableElementProps(`admin-records-filters`, `domains`)}>
      <label {...tableElementProps(`admin-records-search`, `domains`)} htmlFor={`admin-domain-search`}>
        <Search {...tableElementProps(`admin-domain-search-icon`)} size={15} aria-hidden={`true`} />
        <input
          type={`search`}
          value={state.search}
          id={`admin-domain-search`}
          className={`admin-records-search-input`}
          aria-label={`Search Loaded Domains`}
          placeholder={`Search Domain, Owner, Or Registrar`}
          onChange={event => state.setSearch(event.currentTarget.value)}
        />
      </label>
      <label {...tableElementProps(`admin-records-filter-label`, `domains`)} htmlFor={`admin-domain-status-filter`}>Status</label>
      <select
        value={state.status}
        id={`admin-domain-status-filter`}
        className={`admin-records-filter`}
        onChange={event => state.setStatus(event.currentTarget.value)}
      >
        {domainStatusOptions.map(status => <option key={status} {...tableElementProps(`admin-domain-status-option`, status.replaceAll(` `, `-`))} value={status}>{status === `All` ? `All Statuses` : status}</option>)}
      </select>
      <span {...tableElementProps(`admin-records-results`, `domains`)} aria-live={`polite`}>{loading ? `Loading Domains` : `${state.domains.length} Of ${snapshot?.domains.length ?? 0} Loaded Domain(s)`}</span>
    </div>
    <div {...tableElementProps(`admin-records-table-wrap`, `domains`)} tabIndex={0} role={`region`} aria-label={`Domain Inventory Table`}>
      <table {...tableElementProps(`admin-records-table`, `domains`)}>
        <caption {...tableElementProps(`admin-records-table-caption`, `domains`)}>Read Only Domain Inventory · Loaded Record Window</caption>
        <thead {...tableElementProps(`admin-records-table-head`, `domains`)}>
          <tr {...tableElementProps(`admin-records-column-row`, `domains`)}>{columns.map((label, index) => <th key={label} {...tableElementProps(`admin-records-column`, `domains-${index}`)} scope={`col`}>{label}</th>)}</tr>
        </thead>
        <tbody {...tableElementProps(`admin-records-table-body`, `domains`)}>
          {loading ? <tr {...tableElementProps(`admin-domain-loading-row`)}><td {...tableElementProps(`admin-records-state-cell`, `domains-loading`)} colSpan={columns.length}><AdminLoading id={`domains`} label={`Loading Domain Inventory`} /></td></tr> : state.domains.length ? state.domains.map(domain => {
            const status = getDomainStatus(domain);
            const account = state.accountNames.get(domain.uid);
            return <tr key={domain.id} {...tableElementProps(`admin-domain-row`, domain.id)}>
              <td {...tableElementProps(`admin-record-number`, domain.id)}><span {...tableElementProps(`admin-record-number-badge`, domain.id)}>{domain.number}</span></td>
              <td {...tableElementProps(`admin-domain-name`, domain.id)}>{domain.name}</td>
              <td {...tableElementProps(`admin-domain-owner`, domain.id)}>{domain.owner || account || domain.uid || `—`}{account && account !== domain.owner ? <span {...tableElementProps(`admin-domain-account`, domain.id)}>{`Account: ${account}`}</span> : null}</td>
              <td {...tableElementProps(`admin-domain-registrar`, domain.id)}>{domain.registrar || `Unknown Registrar`}</td>
              <td {...tableElementProps(`admin-domain-expiry`, domain.id)}>{domain.expiresAt ? <time {...tableElementProps(`admin-domain-expiry-date`, domain.id)} dateTime={domain.expiresAt}>{formatDate(domain.expiresAt)}</time> : `—`}</td>
              <td {...tableElementProps(`admin-domain-price`, domain.id)}>{formatAnnualPrice(domain.renewalPrice, domain.currency || `USD`)}</td>
              <td {...tableElementProps(`admin-domain-status-cell`, domain.id)}><TableStatus id={`domains-${domain.id}`} label={status} tone={status === `Expired` ? `red` : status === `Unknown` ? `gray` : `green`} /></td>
              <td {...tableElementProps(`admin-domain-renew`, domain.id)}>{domain.autoRenew ? `On` : `Off`}</td>
            </tr>;
          }) : <tr {...tableElementProps(`admin-domain-empty-row`)}><td {...tableElementProps(`admin-records-state-cell`, `domains-empty`)} colSpan={columns.length}><p {...tableElementProps(`admin-records-empty`, `domains`)}>{!snapshot ? `Domain Records Unavailable` : state.filter || state.status !== `All` ? `No Matching Domains In Loaded Records` : `No Domain Records Yet`}</p></td></tr>}
        </tbody>
      </table>
    </div>
    {snapshot?.domainCoverage.hasMore ? <p {...tableElementProps(`admin-domains-coverage`)} className={`admin-records-note`}>More Domain Records Exist · This View Covers The Loaded Window</p> : null}
  </section>;
};

export default AdminDomains;
