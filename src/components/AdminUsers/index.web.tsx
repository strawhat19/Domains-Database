import './records.scss';
import './styles.scss';
import TableStatus from './TableStatus';
import { Roles } from '../../types/types';
import { useAdminUserTable } from './useAdminUserTable';
import { AdminStats, AdminLoading } from '../AdminWidgets';
import { tableElementProps, formatAccountJoined, getAccountRoleLabel } from './tableElements';
import { Users, X, Check, Power, Search, Shield, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';

const columns = [`No.`, `Account`, `Role`, `Sign In`, `Status`, `Joined`, `Actions`];

const AdminUsers = () => {
  const state = useAdminUserTable();
  const error = state.error || state.page.error;
  const disabled = state.page.loading || !!state.busy;
  return <section {...tableElementProps(`admin-users`)} className={`admin-users admin-records`} aria-labelledby={`admin-users-title`} aria-busy={state.page.loading}>
    <div {...tableElementProps(`admin-records-heading`, `users`)}>
      <div {...tableElementProps(`admin-records-heading-copy`, `users`)}>
        <h2 {...tableElementProps(`admin-users-title`)} className={`admin-records-title`}><Users {...tableElementProps(`admin-users-title-icon`)} size={20} aria-hidden={`true`} />Account Directory</h2>
        <p {...tableElementProps(`admin-records-note`, `users`)}>{`Realtime Page ${state.page.page} · Search And Filters Apply To This Page · Role Changes Require Owner Access`}</p>
      </div>
      <div {...tableElementProps(`admin-records-summary`, `users`)}>
        <AdminStats id={`users`} loading={state.page.loading} stats={[
          { id: `loaded`, label: `Accounts On This Page`, value: state.accounts.length },
          { id: `active`, label: `Active`, value: state.accounts.filter(account => account.active).length },
          { id: `inactive`, label: `Inactive`, value: state.accounts.filter(account => !account.active).length },
        ]} />
      </div>
    </div>
    {!state.connected ? <p {...tableElementProps(`admin-users-mode`)} className={`admin-records-note`}>{state.localPreview ? `Local Account Preview · Connect Firebase To Manage Access` : `Firebase Configuration Required To Manage Access`}</p> : null}
    <div {...tableElementProps(`admin-records-filters`, `users`)}>
      <label {...tableElementProps(`admin-records-search`, `users`)} htmlFor={`admin-user-search`}>
        <Search {...tableElementProps(`admin-user-search-icon`)} size={15} aria-hidden={`true`} />
        <input
          type={`search`}
          value={state.search}
          id={`admin-user-search`}
          className={`admin-records-search-input`}
          placeholder={`Search Name, Email, Or Role`}
          aria-label={`Search Accounts On This Page`}
          onChange={event => state.setSearch(event.currentTarget.value)}
        />
      </label>
      <label {...tableElementProps(`admin-records-filter-label`, `users`)} htmlFor={`admin-user-role-filter`}>Role</label>
      <select
        id={`admin-user-role-filter`}
        value={state.roleFilter}
        className={`admin-records-filter`}
        onChange={event => state.setRoleFilter(event.currentTarget.value)}
      >
        <option {...tableElementProps(`admin-user-role-filter-option`, `all`)} value={`all`}>All Roles</option>
        {Object.values(Roles).map(role => <option key={role} {...tableElementProps(`admin-user-role-filter-option`, role)} value={role}>{getAccountRoleLabel(role)}</option>)}
      </select>
      <span {...tableElementProps(`admin-records-results`, `users`)} aria-live={`polite`}>{state.page.loading ? `Loading Accounts` : `${state.visible.length} Of ${state.accounts.length} Loaded Account(s)`}</span>
    </div>
    {error ? <p {...tableElementProps(`admin-records-error`, `users`)} role={`alert`}>{error}</p> : null}
    {state.notice ? <p {...tableElementProps(`admin-records-notice`, `users`)} role={`status`}>{state.notice}</p> : null}
    <div {...tableElementProps(`admin-records-table-wrap`, `users`)} tabIndex={0} role={`region`} aria-label={`Account Directory Table`}>
      <table {...tableElementProps(`admin-records-table`, `users`)}>
        <caption {...tableElementProps(`admin-records-table-caption`, `users`)}>{`Account Directory · Realtime Page ${state.page.page}`}</caption>
        <thead {...tableElementProps(`admin-records-table-head`, `users`)}>
          <tr {...tableElementProps(`admin-records-column-row`, `users`)}>{columns.map((label, index) => <th key={label} {...tableElementProps(`admin-records-column`, `users-${index}`)} scope={`col`}>{label}</th>)}</tr>
        </thead>
        <tbody {...tableElementProps(`admin-records-table-body`, `users`)}>
          {state.page.loading ? <tr {...tableElementProps(`admin-user-loading-row`)}><td {...tableElementProps(`admin-records-state-cell`, `users-loading`)} colSpan={columns.length}><AdminLoading id={`users`} label={`Loading Realtime Accounts`} /></td></tr> : state.visible.length ? state.visible.map(account => {
            const editing = state.editingId === account.id && state.canEditRole && state.canEdit(account);
            const canChangeRole = state.canEdit(account) && state.canEditRole;
            const canChangeStatus = state.canEdit(account) && state.canEditStatus(account);
            return <tr key={account.id} {...tableElementProps(`admin-user-row`, account.id)}>
              <td {...tableElementProps(`admin-record-number`, account.id)}><span {...tableElementProps(`admin-record-number-badge`, account.id)}>{account.number}</span></td>
              <td {...tableElementProps(`admin-user-account`, account.id)}>
                <div {...tableElementProps(`admin-user-identity`, account.id)}>
                  {account.photoURL ? <span {...tableElementProps(`admin-user-avatar`, account.id)} aria-hidden={`true`}>
                    <span {...tableElementProps(`admin-user-initial`, account.id)}>{account.name?.trim()?.[0]?.toUpperCase() || `U`}</span>
                    <img {...tableElementProps(`admin-user-photo`, account.id)} src={account.photoURL} alt={``} loading={`lazy`} referrerPolicy={`no-referrer`} onError={event => { event.currentTarget.hidden = true; }} />
                  </span> : null}
                  <div {...tableElementProps(`admin-user-copy`, account.id)}>
                    <strong {...tableElementProps(`admin-user-name`, account.id)}>{account.name || `Unnamed Account`}</strong>
                    <span {...tableElementProps(`admin-user-email`, account.id)}>{account.email || `—`}</span>
                  </div>
                </div>
              </td>
              <td {...tableElementProps(`admin-user-role`, account.id)}>{getAccountRoleLabel(account.role)}</td>
              <td {...tableElementProps(`admin-user-provider`, account.id)}>{account.provider || `—`}</td>
              <td {...tableElementProps(`admin-user-status-cell`, account.id)}><TableStatus id={`users-${account.id}`} label={account.active ? `Active` : `Inactive`} tone={account.active ? `green` : `gray`} /></td>
              <td {...tableElementProps(`admin-user-created`, account.id)}><time {...tableElementProps(`admin-user-joined`, account.id)} dateTime={account.created}>{formatAccountJoined(account.created)}</time></td>
              <td {...tableElementProps(`admin-user-access`, account.id)}>
                {canChangeRole || canChangeStatus ? <div {...tableElementProps(`admin-user-actions`, account.id)}>
                  {canChangeRole ? <button {...tableElementProps(`admin-user-action`, `${account.id}-role`)} type={`button`} disabled={!!state.busy} aria-expanded={editing} aria-controls={editing ? `admin-user-role-editor-${account.id}` : undefined} onClick={() => state.beginEdit(account)}><Shield {...tableElementProps(`admin-user-action-icon`, `${account.id}-role`)} size={12} aria-hidden={`true`} />Change Role</button> : null}
                  {canChangeStatus ? <button {...tableElementProps(`admin-user-action`, `${account.id}-status`)} type={`button`} disabled={!!state.busy} onClick={() => { void state.save(account, { active: !account.active }); }}><Power {...tableElementProps(`admin-user-action-icon`, `${account.id}-status`)} size={12} aria-hidden={`true`} />{state.busy === account.id ? `Saving` : account.active ? `Deactivate` : `Reactivate`}</button> : null}
                </div> : <span {...tableElementProps(`admin-user-access-note`, account.id)}>{account.id === state.user?.id ? `Current Account` : `Read Only`}</span>}
                {editing ? <div {...tableElementProps(`admin-user-role-editor`, account.id)} role={`group`} aria-label={`Change Role For ${account.name || `Account`}`}>
                  <select {...tableElementProps(`admin-user-role-select`, account.id)} value={state.selectedRole} disabled={!!state.busy} aria-label={`Account Role`} onChange={event => state.selectRole(event.currentTarget.value as Roles)}>
                    {!state.roleOptions.includes(state.selectedRole) ? <option {...tableElementProps(`admin-user-current-role-option`, account.id)} value={state.selectedRole} disabled>{getAccountRoleLabel(state.selectedRole)}</option> : null}
                    {state.roleOptions.map(role => <option key={role} {...tableElementProps(`admin-user-role-option`, `${account.id}-${role}`)} value={role}>{getAccountRoleLabel(role)}</option>)}
                  </select>
                  <button {...tableElementProps(`admin-user-action`, `${account.id}-save-role`)} type={`button`} disabled={!!state.busy || state.selectedRole === account.role} onClick={() => { void state.saveRole(account); }}><Check {...tableElementProps(`admin-user-action-icon`, `${account.id}-save-role`)} size={12} aria-hidden={`true`} />Save Role</button>
                  <button {...tableElementProps(`admin-user-action`, `${account.id}-cancel-role`)} type={`button`} disabled={!!state.busy} onClick={state.cancelEdit}><X {...tableElementProps(`admin-user-action-icon`, `${account.id}-cancel-role`)} size={12} aria-hidden={`true`} />Cancel</button>
                </div> : null}
              </td>
            </tr>;
          }) : <tr {...tableElementProps(`admin-user-empty-row`)}><td {...tableElementProps(`admin-records-state-cell`, `users-empty`)} colSpan={columns.length}><p {...tableElementProps(`admin-records-empty`, `users`)}>{state.page.error ? `Account Records Unavailable` : state.filter || state.roleFilter !== `all` ? `No Matching Accounts On This Page` : `No Accounts Yet`}</p></td></tr>}
        </tbody>
        <tfoot {...tableElementProps(`admin-records-table-footer`, `users`)}>
          <tr {...tableElementProps(`admin-user-pagination-row`)}><td {...tableElementProps(`admin-user-pagination-cell`)} colSpan={columns.length}>
            <div {...tableElementProps(`admin-record-pagination`, `users`)}>
              <span {...tableElementProps(`admin-record-pagination-label`, `users`)}>{`Page ${state.page.page} · ${state.visible.length} Matching Account(s) In This Realtime Page`}</span>
              <div {...tableElementProps(`admin-record-pagination-controls`, `users`)}>
                <button {...tableElementProps(`admin-record-pagination-button`, `users-previous`)} type={`button`} disabled={disabled || !state.page.hasPrevious} onClick={state.page.previousPage}><ArrowLeft {...tableElementProps(`admin-record-pagination-icon`, `users-previous`)} size={11} aria-hidden={`true`} />Previous</button>
                <button {...tableElementProps(`admin-record-pagination-button`, `users-next`)} type={`button`} disabled={disabled || !state.page.hasNext} onClick={state.page.nextPage}>Next<ArrowRight {...tableElementProps(`admin-record-pagination-icon`, `users-next`)} size={11} aria-hidden={`true`} /></button>
                <button {...tableElementProps(`admin-record-pagination-button`, `users-latest`)} type={`button`} disabled={disabled} onClick={state.page.refresh}><RotateCcw {...tableElementProps(`admin-record-pagination-icon`, `users-latest`)} size={11} aria-hidden={`true`} />Latest</button>
              </div>
            </div>
          </td></tr>
        </tfoot>
      </table>
    </div>
  </section>;
};

export default AdminUsers;
