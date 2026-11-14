import './styles.scss';
import { useLiveAuction } from './useLiveAuction';
import DomainAnalyticsButton from '../DomainAnalyticsButton';
import { Globe2, ArrowUpRight, Radio, LoaderCircle } from 'lucide-react';
import { getAuctionRow, getLiveAuctionLabels, type AuctionRowProps } from './presentation';

const AuctionRow = ({ record }: AuctionRowProps) => {
  const view = getAuctionRow(record);
  const suffix = record.id;
  const live = useLiveAuction(record.domain, record.source === `godaddy` && !record.preview);

  return (
    <tr id={`auction-row-${suffix}`} className={`auction-row`}>
      <th scope={`row`} id={`auction-domain-cell-${suffix}`} className={`auction-domain-cell`}>
        <div id={`auction-domain-identity-${suffix}`} className={`auction-domain-identity`}>
          <Globe2 size={16} aria-hidden={`true`} id={`auction-domain-icon-${suffix}`} className={`auction-domain-icon`} />
          <span id={`auction-domain-${suffix}`} className={`auction-domain`}>{record.domain}</span>
        </div>
        <span id={`rowStatus-auction-${suffix}`} className={`rowStatus auction-row-status auction-row-status-${view.statusState}`}>
          <span id={`statusDotWrap-auction-${suffix}`} className={`statusDotWrap`} aria-hidden={`true`}>
            <span id={`statusDot-auction-${suffix}`} className={`statusDot`} />
          </span>
          <span id={`statusText-auction-${suffix}`} className={`statusText`}>{view.status}</span>
        </span>
        {!!view.pageviews && <span id={`auction-pageviews-${suffix}`} className={`auction-row-note`}>{`Provider Pageviews: ${view.pageviews}`}</span>}
      </th>
      <td id={`auction-source-cell-${suffix}`} className={`auction-source-cell`}>
        <span id={`auction-source-${suffix}`} className={`auction-source`}>{view.source}</span>
        <span id={`auction-type-${suffix}`} className={`auction-row-note`}>{view.type}</span>
        {!!view.checked && <span id={`auction-snapshot-time-${suffix}`} className={`auction-row-note`}>{`${view.checkedLabel}: ${view.checked}`}</span>}
      </td>
      <td id={`auction-price-cell-${suffix}`} className={`auction-price-cell`}>
        <span id={`auction-price-${suffix}`} className={`auction-price`}>{view.price}</span>
        {!!view.valuation && <span id={`auction-source-estimate-${suffix}`} className={`auction-row-note`}>{`Source Estimate: ${view.valuation}`}</span>}
      </td>
      <td id={`auction-bids-cell-${suffix}`} className={`auction-bids-cell`}>{view.bids}</td>
      <td id={`auction-ends-cell-${suffix}`} className={`auction-ends-cell`}>
        {record.endsAt ? <time dateTime={record.endsAt} id={`auction-ends-${suffix}`} className={`auction-ends`}>{view.end}</time>
          : <span id={`auction-ends-${suffix}`} className={`auction-ends`}>{view.end}</span>}
      </td>
      <td id={`auction-age-cell-${suffix}`} className={`auction-age-cell`}>{view.age}</td>
      <td id={`actionsCell-auction-${suffix}`} className={`actionsCell auction-row-actions`}>
        <div id={`auction-action-list-${suffix}`} className={`auction-action-list`}>
          {!!view.href && (
            <a
              href={view.href}
              target={`_blank`}
              rel={`noopener noreferrer`}
              id={`auction-source-link-${suffix}`}
              className={`auction-source-link`}
              aria-label={`${view.linkLabel} On ${view.source} — Opens In A New Tab`}
            >
              <span id={`auction-source-link-text-${suffix}`} className={`auction-source-link-text`}>{view.linkLabel}</span>
              <ArrowUpRight size={13} aria-hidden={`true`} id={`auction-source-link-icon-${suffix}`} className={`auction-source-link-icon`} />
            </a>
          )}
          <DomainAnalyticsButton domain={record.domain} suffix={`auction-${suffix}`} compact />
          {live.available && <button
            type={`button`}
            disabled={live.busy}
            aria-busy={live.busy}
            id={`auction-live-check-${suffix}`}
            className={`auction-source-link auction-live-check`}
            onClick={() => void live.lookup()}
          >
            {live.busy ? <LoaderCircle id={`auction-live-spinner-${suffix}`} className={`auction-live-spinner`} size={13} aria-hidden /> : <Radio size={13} aria-hidden />}
            {live.busy ? `Checking…` : `Check Live`}
          </button>}
        </div>
        {live.accounts.length > 0 && <label id={`auction-live-choice-${suffix}`} className={`auction-row-note`}>
          {`GoDaddy Connection`}
          <select id={`auction-live-account-${suffix}`} className={`auction-live-account`} value={``} onChange={event => void live.lookup(event.currentTarget.value)}>
            <option value={``} disabled>{`Choose An Account`}</option>
            {live.accounts.map(account => <option key={account.id} value={account.id}>{`Account ${account.number}`}</option>)}
          </select>
        </label>}
        {live.error && <span id={`auction-live-error-${suffix}`} className={`auction-row-note auction-live-error`} role={`status`}>{live.error}</span>}
        {live.result && <details id={`auction-live-details-${suffix}`} className={`auction-live-details`} aria-live={`polite`} open>
          <summary id={`auction-live-summary-${suffix}`} className={`auction-row-note`}>{`Live GoDaddy Details`}</summary>
          {getLiveAuctionLabels(live.result).map((label, index) => <span key={`${index}-${label}`} id={`auction-live-metric-${suffix}-${index}`} className={`auction-row-note`}>{label}</span>)}
        </details>}
      </td>
    </tr>
  );
};

export default AuctionRow;
