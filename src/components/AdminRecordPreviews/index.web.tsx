import './styles.scss';
import { Link } from 'expo-router';
import { accountDate, renewalCost } from './data';
import { Users, Globe2, ArrowUpRight } from 'lucide-react';
import type { AdminSnapshot } from '../../shared/admin/types';
import { getDomainStatus, formatDate } from '../../shared/domainUtils';

const AdminRecordPreviews = ({ snapshot }: { snapshot: AdminSnapshot }) => {
  const accountNames = new Map(snapshot.users.map(account => [account.id, account.name]));
  return <div id={`admin-record-previews`} className={`admin-record-previews`}>
    <section id={`admin-recent-users`} className={`admin-recent-records`} aria-labelledby={`admin-recent-users-title`}>
      <div id={`admin-recent-users-heading`} className={`admin-recent-records-heading`}>
        <h2 id={`admin-recent-users-title`} className={`admin-recent-records-title`}><Users id={`admin-recent-users-icon`} className={`admin-recent-records-icon`} size={22} aria-hidden />Users</h2>
        <Link href={`/admin/users`} id={`admin-recent-users-view-all`} className={`admin-recent-records-view-all`}>View All<ArrowUpRight id={`admin-recent-users-arrow`} className={`admin-recent-records-arrow`} size={13} aria-hidden /></Link>
      </div>
      {snapshot.users.length ? <div id={`admin-recent-users-table-wrap`} className={`admin-recent-table-wrap`}>
        <table id={`admin-recent-users-table`} className={`admin-recent-table`}>
          <caption id={`admin-recent-users-caption`} className={`admin-recent-table-caption`}>Five Most Recent Accounts In The Loaded Window</caption>
          <thead id={`admin-recent-users-table-head`} className={`admin-recent-table-head`}><tr id={`admin-recent-users-header-row`} className={`admin-recent-header-row`}>{[`#`, `Account`, `Role`, `Provider`, `Joined`, `Status`].map((label, index) => <th key={label} id={`admin-recent-users-header-${index}`} className={`admin-recent-header-cell`} scope={`col`}>{label}</th>)}</tr></thead>
          <tbody id={`admin-recent-users-table-body`} className={`admin-recent-table-body`}>{snapshot.users.slice(0, 5).sort((first, second) => first.number - second.number).map(account => <tr key={account.id} id={`admin-recent-user-${account.id}`} className={`admin-recent-row`}>
            <td id={`admin-recent-user-number-cell-${account.id}`} className={`admin-recent-number-cell`}><span id={`admin-recent-user-number-${account.id}`} className={`admin-recent-number`}>{account.number}</span></td>
            <td id={`admin-recent-user-identity-${account.id}`} className={`admin-recent-identity`}><strong id={`admin-recent-user-name-${account.id}`} className={`admin-recent-name`}>{account.name || `Unnamed Account`}</strong><span id={`admin-recent-user-email-${account.id}`} className={`admin-recent-detail`}>{account.email || `—`}</span></td>
            <td id={`admin-recent-user-role-${account.id}`} className={`admin-recent-cell`}>{account.role === `Administrator` ? `Admin (Legacy)` : account.role}</td>
            <td id={`admin-recent-user-provider-${account.id}`} className={`admin-recent-cell`}>{account.provider}</td>
            <td id={`admin-recent-user-created-${account.id}`} className={`admin-recent-date`}>{accountDate(account.created)}</td>
            <td id={`admin-recent-user-status-cell-${account.id}`} className={`actionsCell`}><span id={`admin-recent-user-status-${account.id}`} className={`rowStatus is-${account.active ? `green` : `gray`}`}><span id={`admin-recent-user-status-dot-wrap-${account.id}`} className={`statusDotWrap`}><span id={`admin-recent-user-status-dot-${account.id}`} className={`statusDot`} /></span><span id={`admin-recent-user-status-label-${account.id}`} className={`statusText`}>{account.active ? `Active` : `Inactive`}</span></span></td>
          </tr>)}</tbody>
        </table>
      </div> : <p id={`admin-recent-users-empty`} className={`admin-recent-empty`}>No Account Records Yet</p>}
    </section>
    <section id={`admin-recent-domains`} className={`admin-recent-records`} aria-labelledby={`admin-recent-domains-title`}>
      <div id={`admin-recent-domains-heading`} className={`admin-recent-records-heading`}>
        <h2 id={`admin-recent-domains-title`} className={`admin-recent-records-title`}><Globe2 id={`admin-recent-domains-icon`} className={`admin-recent-records-icon`} size={22} aria-hidden />Domains</h2>
        <Link href={`/admin/domains`} id={`admin-recent-domains-view-all`} className={`admin-recent-records-view-all`}>View All<ArrowUpRight id={`admin-recent-domains-arrow`} className={`admin-recent-records-arrow`} size={13} aria-hidden /></Link>
      </div>
      {snapshot.domains.length ? <div id={`admin-recent-domains-table-wrap`} className={`admin-recent-table-wrap`}>
        <table id={`admin-recent-domains-table`} className={`admin-recent-table`}>
          <caption id={`admin-recent-domains-caption`} className={`admin-recent-table-caption`}>Five Most Recent Domains In The Loaded Window</caption>
          <thead id={`admin-recent-domains-table-head`} className={`admin-recent-table-head`}><tr id={`admin-recent-domains-header-row`} className={`admin-recent-header-row`}>{[`#`, `Domain`, `Registrar`, `Expiry`, `Annual Renewal`, `Status`].map((label, index) => <th key={label} id={`admin-recent-domains-header-${index}`} className={`admin-recent-header-cell`} scope={`col`}>{label}</th>)}</tr></thead>
          <tbody id={`admin-recent-domains-table-body`} className={`admin-recent-table-body`}>{snapshot.domains.slice(0, 5).sort((first, second) => first.number - second.number).map(domain => {
            const status = getDomainStatus(domain);
            return <tr key={domain.id} id={`admin-recent-domain-${domain.id}`} className={`admin-recent-row`}>
              <td id={`admin-recent-domain-number-cell-${domain.id}`} className={`admin-recent-number-cell`}><span id={`admin-recent-domain-number-${domain.id}`} className={`admin-recent-number`}>{domain.number}</span></td>
              <td id={`admin-recent-domain-identity-${domain.id}`} className={`admin-recent-identity`}><strong id={`admin-recent-domain-name-${domain.id}`} className={`admin-recent-name`}>{domain.name}</strong><span id={`admin-recent-domain-owner-${domain.id}`} className={`admin-recent-detail`}>{domain.owner || accountNames.get(domain.uid) || domain.uid}</span></td>
              <td id={`admin-recent-domain-registrar-${domain.id}`} className={`admin-recent-cell`}>{domain.registrar || `Unknown`}</td>
              <td id={`admin-recent-domain-expiry-${domain.id}`} className={`admin-recent-date`}>{formatDate(domain.expiresAt)}</td>
              <td id={`admin-recent-domain-price-${domain.id}`} className={`admin-recent-cell`}>{renewalCost(domain.renewalPrice, domain.currency)}</td>
              <td id={`admin-recent-domain-status-cell-${domain.id}`} className={`actionsCell`}><span id={`admin-recent-domain-status-${domain.id}`} className={`rowStatus is-${status === `Expired` ? `red` : status === `Unknown` ? `gray` : `green`}`}><span id={`admin-recent-domain-status-dot-wrap-${domain.id}`} className={`statusDotWrap`}><span id={`admin-recent-domain-status-dot-${domain.id}`} className={`statusDot`} /></span><span id={`admin-recent-domain-status-label-${domain.id}`} className={`statusText`}>{status}</span></span></td>
            </tr>;
          })}</tbody>
        </table>
      </div> : <p id={`admin-recent-domains-empty`} className={`admin-recent-empty`}>No Domain Records Yet</p>}
    </section>
  </div>;
};

export default AdminRecordPreviews;
