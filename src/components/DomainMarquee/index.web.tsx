import './styles.scss';
import { Link } from 'expo-router';
import { useMarquee } from './useMarquee.web';
import RouterAnchor from '../RouterAnchor';
import DomainSiteIcon from '../DomainSiteIcon';
import StackPillShape from '../StackPillShape';
import { getNotificationHref } from '../../shared/routes';
import { useStackPill } from '../../shared/config';
import { Globe2, Info, Sparkles } from 'lucide-react';
import { sampleNotificationCount } from '../../shared/sampleNotifications';
import { useDomainMarquee, type DomainMarqueeItem } from './useDomainMarquee';

const MarqueeTrack = ({ items }: { items: DomainMarqueeItem[] }) => {
  const state = useMarquee(JSON.stringify(items.map(item => [item.id, item.label])));
  return (
    <div
      ref={state.viewport}
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
      <div ref={state.track} id={`domain-marquee-track`} className={`domain-marquee-track`}>
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
                  tabIndex={copyIndex === 1 ? undefined : -1}
                  data-marquee-original={copyIndex === 1 ? true : undefined}
                  aria-label={item.external ? `${item.label} (opens in a new tab)` : item.label}
                >
                  {useStackPill && <StackPillShape id={`domain-marquee-pill-shape-${suffix}`} />}
                  {item.domain ? (
                    <DomainSiteIcon
                      compact
                      size={14}
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
        <div id={`domain-marquee-loading`} className={`domain-marquee-loading`} aria-hidden={true}>
          {Array.from({ length: sampleNotificationCount }, (_, index) => (
            <span
              key={index}
              id={`domain-marquee-skeleton-${index}`}
              className={`domain-marquee-skeleton${useStackPill ? ` domain-marquee-skeleton-stack` : ``}`}
            >
              {useStackPill && <StackPillShape id={`domain-marquee-skeleton-shape-${index}`} />}
            </span>
          ))}
        </div>
      ) : items.length > 0 && (
        <MarqueeTrack key={showDomains ? `domains` : `notifications`} items={items} />
      )}
    </section>
  );
};

export default DomainMarquee;
