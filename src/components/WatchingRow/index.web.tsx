import './styles.scss';
import DomainAnalyticsButton from '../DomainAnalyticsButton';
import { Eye, Trash2, ArrowUpRight } from 'lucide-react';
import { getWatchingRow, getWatchingConnection, type WatchingRowProps } from './presentation';

const WatchingRow = ({ busy, record, onRemove }: WatchingRowProps) => {
  const view = getWatchingRow(record);
  const suffix = record.id;

  return (
    <tr id={`watching-row-${suffix}`} className={`watching-row`}>
      <th scope={`row`} id={`watching-domain-cell-${suffix}`} className={`watching-domain-cell`}>
        <div id={`watching-domain-identity-${suffix}`} className={`watching-domain-identity`}>
          <span id={`watching-domain-mark-${suffix}`} className={`watching-domain-mark`}>
            <Eye size={15} aria-hidden={`true`} id={`watching-domain-icon-${suffix}`} className={`watching-domain-icon`} />
          </span>
          <span id={`watching-domain-${suffix}`} className={`watching-domain`}>{record.domain}</span>
        </div>
      </th>
      <td id={`watching-availability-cell-${suffix}`} className={`watching-availability-cell`}>
        <div id={`actionsCell-${suffix}`} className={`actionsCell watching-domain-status`}>
          <span id={`rowStatus-${suffix}`} className={`rowStatus watching-status watching-status-${view.status.state}`}>
            <span id={`statusDotWrap-${suffix}`} className={`statusDotWrap`} aria-hidden={`true`}>
              <span id={`statusDot-${suffix}`} className={`statusDot`} />
            </span>
            <span id={`statusText-${suffix}`} className={`statusText`}>{view.status.label}</span>
          </span>
        </div>
        <span id={`watching-availability-summary-${suffix}`} className={`watching-row-note`}>{view.status.summary}</span>
      </td>
      <td id={`watching-registrars-cell-${suffix}`} className={`watching-registrars-cell`}>
        <div id={`watching-registrars-${suffix}`} className={`watching-registrars`}>
          {record.connections.map((connection, index) => {
            const offer = getWatchingConnection(connection);
            const connectionId = `${suffix}-${connection.provider}-${index}`;
            return (
              <div key={connectionId} id={`watching-connection-${connectionId}`} className={`watching-connection`}>
                <div id={`watching-connection-comparison-${connectionId}`} className={`watching-connection-comparison`}>
                  <div id={`watching-registrar-${connectionId}`} className={`watching-registrar`}>
                    <span id={`watching-registrar-name-${connectionId}`} className={`watching-registrar-name`}>{connection.label}</span>
                    <span id={`rowStatus-${connectionId}`} className={`rowStatus watching-status watching-status-${offer.status.state}`}>
                      <span id={`statusDotWrap-${connectionId}`} className={`statusDotWrap`} aria-hidden={`true`}>
                        <span id={`statusDot-${connectionId}`} className={`statusDot`} />
                      </span>
                      <span id={`statusText-${connectionId}`} className={`statusText`}>{offer.status.label}</span>
                    </span>
                  </div>
                  {offer.available ? [
                    { id: `registration`, label: `Registration`, price: offer.registration },
                    { id: `renewal`, label: `Renewal`, price: offer.renewal },
                  ].map(item => (
                    <div key={item.id} id={`watching-price-${connectionId}-${item.id}`} className={`watching-price`}>
                      <span id={`watching-price-label-${connectionId}-${item.id}`} className={`watching-price-label`}>{item.label}</span>
                      <span id={`watching-price-amount-${connectionId}-${item.id}`} className={`watching-price-amount`}>{item.price.amount}</span>
                      <span id={`watching-price-term-${connectionId}-${item.id}`} className={`watching-price-term`}>{item.price.term}</span>
                      {!!item.price.currencyNote && <span id={`watching-price-currency-${connectionId}-${item.id}`} className={`watching-row-warning`}>{item.price.currencyNote}</span>}
                    </div>
                  )) : (
                    <span id={`watching-no-price-${connectionId}`} className={`watching-no-price`}>{`Prices shown when availability is confirmed.`}</span>
                  )}
                  {!!offer.purchaseHref && (
                    <a
                      target={`_blank`}
                      rel={`noopener noreferrer`}
                      href={offer.purchaseHref}
                      id={`watching-buy-${connectionId}`}
                      className={`watching-buy`}
                      aria-label={`Buy ${record.domain} On ${connection.label} — Opens In A New Tab`}
                    >
                      <span id={`watching-buy-text-${connectionId}`} className={`watching-buy-text`}>{`Buy`}</span>
                      <ArrowUpRight size={14} aria-hidden={`true`} id={`watching-buy-icon-${connectionId}`} className={`watching-buy-icon`} />
                    </a>
                  )}
                </div>
                {!!connection.error && <p id={`watching-connection-error-${connectionId}`} className={`watching-row-error`}>{connection.error}</p>}
                {!!connection.note && <p id={`watching-connection-note-${connectionId}`} className={`watching-row-note`}>{connection.note}</p>}
              </div>
            );
          })}
          {!record.connections.length && <span id={`watching-no-registrars-${suffix}`} className={`watching-row-note`}>{`No registrar checks saved. Sync to get mock comparison data.`}</span>}
        </div>
      </td>
      <td id={`watching-checked-cell-${suffix}`} className={`watching-date-cell`}>
        <time dateTime={record.checkedAt} id={`watching-checked-${suffix}`} className={`watching-date`}>{view.checkedDate}</time>
        <span id={`watching-data-origin-${suffix}`} className={`watching-data-origin${record.mock ? ` watching-data-origin-mock` : ``}`}>{view.dataLabel}</span>
      </td>
      <td id={`watching-added-cell-${suffix}`} className={`watching-date-cell`}>
        <time dateTime={record.created} id={`watching-added-${suffix}`} className={`watching-date`}>{view.addedDate}</time>
      </td>
      <td id={`watching-actions-cell-${suffix}`} className={`actionsCell watching-actions-cell`}>
        <DomainAnalyticsButton compact suffix={`watching-${suffix}`} domain={record.domain} />
        <button
          type={`button`}
          disabled={busy}
          id={`watching-remove-${suffix}`}
          className={`watching-remove`}
          aria-label={`Remove ${record.domain} From Watching`}
          onClick={() => void onRemove(record.id).catch(() => undefined)}
        >
          <Trash2 size={14} aria-hidden={`true`} id={`watching-remove-icon-${suffix}`} className={`watching-remove-icon`} />
          <span id={`watching-remove-text-${suffix}`} className={`watching-remove-text`}>{`Remove`}</span>
        </button>
      </td>
    </tr>
  );
};

export default WatchingRow;
