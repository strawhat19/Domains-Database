import './styles.scss';
import { getDomainRow } from './domainRow';
import type { DomainRecord } from '../../shared/types';
import { Check, Minus, Globe2, Pencil, Trash2 } from 'lucide-react';
import { formatDate, formatCurrency } from '../../shared/domainUtils';

interface DomainRowProps {
  busy?: boolean;
  domain: DomainRecord;
  onEdit: (domain: DomainRecord) => void;
  onDelete: (domain: DomainRecord) => void;
  onToggleAutoRenew: (domain: DomainRecord) => void;
}

const DomainRow = ({ domain, busy, onEdit, onDelete, onToggleAutoRenew }: DomainRowProps) => {
  const { scope, status, lastDot, statusKey, registrarKey } = getDomainRow(domain);
  return (
    <tr id={scope} className={`domain-row`}>
      <td id={`${scope}-name-cell`} className={`domain-name-cell`}>
        <div id={`${scope}-identity`} className={`domain-identity`}>
          <span id={`${scope}-symbol`} className={`domain-symbol`}>
            <Globe2 size={19} strokeWidth={1.3} aria-hidden={`true`} id={`${scope}-symbol-icon`} className={`domain-symbol-icon`} />
          </span>
          <div id={`${scope}-name-copy`} className={`domain-name-copy`}>
            <span id={`${scope}-name`} className={`domain-name`}>
              {domain.name.slice(0, lastDot)}
              <span id={`${scope}-extension`} className={`domain-extension`}>
                {domain.name.slice(lastDot)}
              </span>
            </span>
            <span id={`${scope}-owner`} className={`domain-owner`}>
              {domain.owner}
            </span>
          </div>
        </div>
      </td>
      <td id={`${scope}-registrar-cell`} className={`domain-registrar-cell`}>
        <div id={`${scope}-registrar`} className={`domain-registrar`}>
          <span id={`${scope}-registrar-mark`} className={`registrar-mark registrar-mark-${registrarKey}`} aria-hidden={`true`}>
            {domain.registrar.charAt(0)}
          </span>
          <span id={`${scope}-registrar-name`} className={`domain-registrar-name`}>
            {domain.registrar}
          </span>
        </div>
      </td>
      <td id={`${scope}-renewal-cell`} className={`domain-renewal-cell`}>
        <span id={`${scope}-renewal-date`} className={`domain-renewal-date`}>
          {formatDate(domain.expiresAt)}
        </span>
        <span id={`${scope}-status`} className={`rowStatus rowStatus-${statusKey}`}>
          <span id={`${scope}-status-dot-wrap`} className={`statusDotWrap`} aria-hidden={`true`}>
            <span id={`${scope}-status-dot`} className={`statusDot`} />
          </span>
          <span id={`${scope}-status-text`} className={`statusText`}>
            {status}
          </span>
        </span>
      </td>
      <td id={`${scope}-auto-renew-cell`} className={`domain-auto-renew-cell`}>
        <button
          type={`button`}
          role={`switch`}
          disabled={busy}
          aria-checked={domain.autoRenew}
          id={`${scope}-auto-renew-toggle`}
          aria-label={`Mark Auto-Renew ${domain.autoRenew ? `Off` : `On`} For ${domain.name}`}
          onClick={() => onToggleAutoRenew(domain)}
          title={`This is a record of your registrar setting`}
          className={`domain-auto-renew domain-auto-renew-${domain.autoRenew ? `on` : `off`}`}
        >
          {domain.autoRenew
            ? <Check size={13} aria-hidden={`true`} id={`${scope}-auto-renew-icon`} className={`domain-auto-renew-icon`} />
            : <Minus size={13} aria-hidden={`true`} id={`${scope}-auto-renew-icon`} className={`domain-auto-renew-icon`} />}
          <span id={`${scope}-auto-renew-text`} className={`domain-auto-renew-text`}>
            {domain.autoRenew ? `On` : `Off`}
          </span>
        </button>
      </td>
      <td id={`${scope}-annual-cost-cell`} className={`domain-annual-cost-cell`}>
        <span id={`${scope}-annual-cost`} className={`domain-annual-cost`}>
          {formatCurrency(domain.renewalPrice)}
        </span>
      </td>
      <td id={`${scope}-actions-cell`} className={`actionsCell domain-actions-cell`}>
        <div id={`${scope}-actions`} className={`domain-row-actions`}>
          <button
            type={`button`}
            disabled={busy}
            title={`Edit Domain`}
            id={`${scope}-edit`}
            onClick={() => onEdit(domain)}
            className={`domain-row-action`}
            aria-label={`Edit ${domain.name}`}
          >
            <Pencil size={14} aria-hidden={`true`} id={`${scope}-edit-icon`} className={`domain-row-action-icon`} />
          </button>
          <button
            type={`button`}
            disabled={busy}
            title={`Remove Domain`}
            id={`${scope}-remove`}
            onClick={() => onDelete(domain)}
            aria-label={`Remove ${domain.name}`}
            className={`domain-row-action domain-row-action-remove`}
          >
            <Trash2 size={14} aria-hidden={`true`} id={`${scope}-remove-icon`} className={`domain-row-action-icon`} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export const DomainRowSkeleton = ({ index }: { index: number }) => (
  <tr id={`domain-skeleton-row-${index}`} className={`domain-row domain-row-skeleton`} aria-hidden={`true`}>
    {[`name`, `registrar`, `renewal`, `auto-renew`, `cost`, `actions`].map(column => (
      <td key={column} id={`domain-skeleton-${index}-${column}-cell`} className={`domain-skeleton-cell`}>
        <span id={`domain-skeleton-${index}-${column}`} className={`domain-skeleton-line domain-skeleton-line-${column}`} />
      </td>
    ))}
  </tr>
);

export default DomainRow;
