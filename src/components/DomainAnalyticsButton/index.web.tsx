import './styles.scss';
import DomainAnalytics from '../DomainAnalytics';
import { ChartNoAxesCombined } from 'lucide-react';
import { useDomainAnalyticsButton, type DomainAnalyticsButtonProps } from './useDomainAnalyticsButton';

const DomainAnalyticsButton = ({ domain, suffix, compact = false }: DomainAnalyticsButtonProps) => {
  const state = useDomainAnalyticsButton(domain, suffix);
  const scope = `domain-analytics-button-${state.scope}`;

  return (
    <>
      <button
        id={scope}
        type={`button`}
        aria-haspopup={`dialog`}
        aria-expanded={state.open}
        aria-label={`View Analytics For ${domain}`}
        onKeyDown={event => event.stopPropagation()}
        onMouseDown={event => event.stopPropagation()}
        title={compact ? `Analytics for ${domain}` : undefined}
        onClick={event => { event.stopPropagation(); state.show(); }}
        className={`domain-analytics-button${compact ? ` domain-analytics-button-compact` : ``}`}
      >
        <ChartNoAxesCombined
          size={15}
          aria-hidden={`true`}
          id={`${scope}-icon`}
          className={`domain-analytics-button-icon`}
        />
        {!compact && <span id={`${scope}-text`} className={`domain-analytics-button-text`}>{`Analytics`}</span>}
      </button>
      {state.open && <DomainAnalytics domain={domain} suffix={suffix} onClose={state.close} />}
    </>
  );
};

export default DomainAnalyticsButton;
