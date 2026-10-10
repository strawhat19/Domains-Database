import './styles.scss';
import { Link } from 'expo-router';
import RouterAnchor from '../RouterAnchor';
import DomainSiteIcon from '../DomainSiteIcon';
import StackPillShape from '../StackPillShape';
import { useMarquee } from './useMarquee.web';
import { useStackPill } from '../../shared/config';
import { Globe2, Info, Sparkles } from 'lucide-react';
import { getNotificationHref } from '../../shared/routes';
import { sampleNotificationCount } from '../../shared/sampleNotifications';
import { useDomainMarquee, type DomainMarqueeItem } from './useDomainMarquee';

const MarqueeLoading = ({ compact = false, overlay = false, loading = true }: { compact?: boolean; overlay?: boolean; loading?: boolean }) => (
  <div
    aria-hidden={true}
    id={`domain-marquee-loading`}
    data-compact={compact || undefined}
    data-loading={overlay ? loading : undefined}
    className={`domain-marquee-loading${overlay ? ` domain-marquee-loading-overlay` : ``}`}
  >
    {Array.from({ length: compact ? 12 : Math.max(6, sampleNotificationCount) }, (_, index) => (
      <span
        key={index}
        id={`domain-marquee-skeleton-${index}`}
        className={`domain-marquee-skeleton${useStackPill ? ` domain-marquee-skeleton-stack` : ``}`}
      >
        {useStackPill && <StackPillShape id={`domain-marquee-skeleton-shape-${index}`} />}
      </span>
    ))}
  </div>
);

const MarqueeTrack = ({ items, compact }: { items: DomainMarqueeItem[]; compact: boolean }) => {
  const state = useMarquee(JSON.stringify(items.map(item => [item.id, item.label])));
  return (
    <div
      ref={state.viewport}
      aria-busy={!state.measured}
      id={`domain-marquee-viewport`}
      className={`domain-marquee-viewport`}
      onPointerUp={state.onPointerUp}
      onPointerDown={state.onPointerDown}
      onPointerMove={state.onPointerMove}
      onBlurCapture={state.onBlurCapture}
      onClickCapture={state.onClickCapture}
      onFocusCapture={state.onFocusCapture}
      onPointerCancel={state.onPointerCancel}
      data-dragging={state.dragging || undefined}
      data-measured={state.measured || undefined}
      onDragStart={event => event.preventDefault()}
      onLostPointerCapture={state.onLostPointerCapture}
    >
      <div
        ref={state.track}
        inert={!state.measured}
        id={`domain-marquee-track`}
        className={`domain-marquee-track`}
        aria-hidden={!state.measured || undefined}
      >
        {Array.from({ length: state.copyCount }, (_, copyIndex) => (
          <div
            key={copyIndex}
            className={`domain-marquee-cycle`}
            id={`domain-marquee-cycle-${copyIndex}`}
            ref={copyIndex === 1 ? state.cycle : undefined}
            aria-hidden={copyIndex === 1 ? undefined : true}
          >
            {items.map((item, index) => {
              const Icon = { Globe2, Info, Sparkles }[item.icon];
              const suffix = `${copyIndex}-${item.id}`;
              const pill = (
                <RouterAnchor
                  key={item.id}
                  href={item.href}
                  draggable={false}
                  title={item.title}
                  id={`domain-marquee-pill-${suffix}`}
                  data-tone={index % 2 ? `ink` : `accent`}
                  className={`domain-marquee-pill${useStackPill ? ` domain-marquee-pill-stack` : ``}`}
                  rel={item.external ? `noopener noreferrer` : undefined}
                  target={item.external ? `_blank` : undefined}
                  tabIndex={state.measured && copyIndex === 1 ? undefined : -1}
                  data-marquee-original={copyIndex === 1 ? true : undefined}
                  aria-label={item.external ? `${item.label} (opens in a new tab)` : item.label}
                >
                  {useStackPill && <StackPillShape id={`domain-marquee-pill-shape-${suffix}`} />}
                  {item.domain ? (
                    <DomainSiteIcon
                      compact
                      size={14}
                      fallback={`link`}
                      domain={item.domain}
                      iconUrl={item.iconUrl}
                      id={`domain-marquee-pill-icon-${suffix}`}
                    />
                  ) : (
                    <Icon
                      size={14}
                      aria-hidden={true}
                      className={`domain-marquee-pill-icon`}
                      id={`domain-marquee-pill-icon-${suffix}`}
                    />
                  )}
                  <span
                    className={`domain-marquee-pill-label`}
                    id={`domain-marquee-pill-label-${suffix}`}
                  >
                    {item.label}
                  </span>
                </RouterAnchor>
              );
              return item.external ? pill : (
                <Link key={item.id} href={getNotificationHref(item.id)} asChild>
                  {pill}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
      <MarqueeLoading compact={compact} overlay loading={!state.measured} />
    </div>
  );
};

const DomainMarquee = () => {
  const { items, loading, showDomains } = useDomainMarquee();
  return (
    <section
      aria-busy={loading}
      id={`domain-marquee`}
      className={`domain-marquee`}
      aria-label={showDomains ? `Your Domains` : `Notifications`}
    >
      {loading ? (
        <MarqueeLoading compact={showDomains} />
      ) : items.length > 0 && (
        <MarqueeTrack key={showDomains ? `domains` : `notifications`} items={items} compact={showDomains} />
      )}
    </section>
  );
};

export default DomainMarquee;
