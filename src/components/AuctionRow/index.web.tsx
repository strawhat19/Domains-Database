import './styles.scss';
import { Globe2, ArrowUpRight } from 'lucide-react';
import DomainAnalyticsButton from '../DomainAnalyticsButton';
import { getAuctionRow, type AuctionRowProps } from './presentation';

const AuctionRow = ({ record }: AuctionRowProps) => {
  const view = getAuctionRow(record);
  const suffix = record.id;

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
        </div>
      </td>
    </tr>
  );
};

export default AuctionRow;
