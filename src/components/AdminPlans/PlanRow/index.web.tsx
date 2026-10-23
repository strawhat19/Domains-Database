import './styles.scss';
import type { PlanRowProps } from './types';
import { formatPlanDate, formatPlanPrice } from '../values';
import { getPricingPlanVisual } from '../../Pricing/planIcons';
import { X, Gem, Zap, Globe2, Puzzle, Compass, Layers3, Archive, Settings, ThumbsUp, Building2, UsersRound } from 'lucide-react';

const icons = { Gem, Zap, Globe2, Puzzle, Compass, Layers3, Building2, UsersRound };

const PlanRow = ({ busy, score, saving, record, confirming, scoreLoading, onEdit, onArchive, onStatus, onRequestArchive, onCancelArchive }: PlanRowProps) => {
  const rowId = `admin-plan-${record.id}`;
  const PlanIcon = icons[getPricingPlanVisual(record).icon];
  return <tr id={rowId} className={`admin-plan-row`} aria-busy={saving}>
    <td id={`${rowId}-number`} className={`admin-plan-number`}><span id={`${rowId}-number-badge`} className={`admin-record-number-badge`}>{record.number}</span></td>
    <td id={`${rowId}-name-cell`} className={`admin-plan-main`}><div id={`${rowId}-identity`} className={`admin-plan-identity`}>
      <span id={`${rowId}-thumbnail`} className={`admin-plan-thumbnail`} aria-hidden><PlanIcon size={18} strokeWidth={1.6} id={`${rowId}-icon`} className={`admin-plan-icon`} /></span>
      <div id={`${rowId}-copy`} className={`admin-plan-copy`}>
        <strong id={`${rowId}-name`} className={`admin-plan-title`}>{record.name}</strong>
        <span id={`${rowId}-slug`} className={`admin-plan-slug`}>{record.slug}</span>
        <span id={`${rowId}-description`} className={`admin-plan-body`}>{record.description || `—`}</span>
      </div>
    </div></td>
    <td id={`${rowId}-price`} className={`admin-plan-price`}>{formatPlanPrice(record)}</td>
    <td id={`${rowId}-features-cell`} className={`admin-plan-features-cell`}>
      {record.features.length ? <ul id={`${rowId}-features`} className={`admin-plan-features`}>{record.features.slice(0, 3).map((feature, index) => <li key={index} id={`${rowId}-feature-${index}`} className={`admin-plan-feature`}>{feature}</li>)}</ul> : <span id={`${rowId}-features-empty`} className={`admin-plan-features-empty`}>{`No Features`}</span>}
      {record.features.length > 3 && <span id={`${rowId}-features-more`} className={`admin-plan-features-more`}>{`+${record.features.length - 3} Feature(s)`}</span>}
    </td>
    <td id={`${rowId}-status-cell`} className={`admin-plan-status`}><div id={`${rowId}-status-actions`} className={`actionsCell`}>
      <button type={`button`} disabled={busy} aria-pressed={record.active} id={`${rowId}-status`} className={`rowStatus is-editable is-${record.active ? `green` : `gray`}`} aria-label={`${record.active ? `Deactivate` : `Activate`} ${record.name}`} onClick={() => { void onStatus(record); }}><span id={`${rowId}-status-dot-wrap`} className={`statusDotWrap`} aria-hidden><span id={`${rowId}-status-dot`} className={`statusDot`} /></span><span id={`${rowId}-status-text`} className={`statusText`} role={`status`}>{saving ? `Saving` : record.active ? `Active` : `Inactive`}</span></button>
    </div></td>
    <td id={`${rowId}-updated`} className={`admin-plan-updated`}><time dateTime={record.updated} id={`${rowId}-updated-time`} className={`admin-plan-updated-time`}>{formatPlanDate(record.updated)}</time></td>
    <td id={`${rowId}-actions-cell`} className={`admin-plan-actions-cell`}>
      <div id={`${rowId}-actions`} className={`actionsCell`}>
        <button type={`button`} disabled={busy} id={`${rowId}-edit`} className={`admin-plan-action`} onClick={() => onEdit(record)} title={`Edit ${record.name}`} aria-label={`Edit ${record.name}`}><Settings size={14} aria-hidden id={`${rowId}-edit-icon`} className={`admin-plan-action-icon`} /></button>
        <button type={`button`} disabled={busy || !record.active} id={`${rowId}-archive`} className={`admin-plan-action is-archive`} aria-expanded={confirming} aria-controls={confirming ? `${rowId}-archive-confirmation` : undefined} onClick={() => onRequestArchive(record)} title={record.active ? `Archive ${record.name}` : `Plan Is Already Inactive`} aria-label={record.active ? `Archive ${record.name}` : `${record.name} Is Already Inactive`}><Archive size={14} aria-hidden id={`${rowId}-archive-icon`} className={`admin-plan-action-icon`} /></button>
      </div>
      {confirming && <div id={`${rowId}-archive-confirmation`} className={`admin-plan-archive-confirmation`} role={`group`} aria-labelledby={`${rowId}-archive-title`}>
        <p id={`${rowId}-archive-title`} className={`admin-plan-archive-title`}>{`Archive “${record.name}”?`}</p>
        <p id={`${rowId}-archive-note`} className={`admin-plan-archive-note`}>{`This hides the plan from Pricing. Existing account access is unchanged. You can activate it again.`}</p>
        <div id={`${rowId}-archive-actions`} className={`actionsCell`}>
          <button type={`button`} disabled={busy} id={`${rowId}-archive-confirm`} className={`admin-plan-action is-archive`} onClick={() => { void onArchive(record).then(saved => { if (saved) onCancelArchive(); }); }} title={`Confirm Archive ${record.name}`} aria-label={`Confirm Archive ${record.name}`}><Archive size={14} aria-hidden id={`${rowId}-archive-confirm-icon`} className={`admin-plan-action-icon`} /></button>
          <button type={`button`} disabled={busy} id={`${rowId}-archive-cancel`} className={`admin-plan-action`} onClick={onCancelArchive} title={`Cancel Archive ${record.name}`} aria-label={`Cancel Archive ${record.name}`}><X size={14} aria-hidden id={`${rowId}-archive-cancel-icon`} className={`admin-plan-action-icon`} /></button>
        </div>
      </div>}
    </td>
    <td id={`${rowId}-score`} className={`admin-plan-score`} aria-busy={scoreLoading} title={scoreLoading ? `Loading Upvote Score` : score === null ? `Upvote Score Unavailable` : `${score} Upvote(s)`}><span id={`${rowId}-score-value`} className={`admin-plan-score-value`}><ThumbsUp size={13} aria-hidden id={`${rowId}-score-icon`} className={`admin-plan-score-icon`} />{score ?? `—`}</span></td>
  </tr>;
};

export default PlanRow;
