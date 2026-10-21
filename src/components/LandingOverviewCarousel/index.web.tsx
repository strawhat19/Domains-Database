import './styles.scss';
import { useRef, useEffect } from 'react';
import { Link } from 'expo-router';
import RouterAnchor from '../RouterAnchor';
import { getBlogHref } from '../../shared/blog/metadata';
import { overviewSlides, overviewCarouselSlides } from '../LandingOverview/content';
import LandingOverviewPreview from '../LandingOverviewPreview';
import { useOverviewCarousel } from './useOverviewCarousel.web';
import { useAppBrand } from '../../shared/branding/useAppBrand';
import { Search, Globe2, Layers3, BookOpen, CalendarDays, LayoutTemplate, ChevronLeft, ChevronRight } from 'lucide-react';

const slideIcons = { overview: LayoutTemplate, inventory: Globe2, renewals: CalendarDays, projects: Layers3, discovery: Search };

const LandingOverviewCarousel = () => {
  const { name, switched } = useAppBrand();
  const state = useOverviewCarousel(overviewSlides.length);
  const pagination = useRef<HTMLDivElement>(null);
  const selectedSlide = overviewSlides[state.index] ?? overviewSlides[0];
  useEffect(() => {
    const element = pagination.current;
    const selected = element?.querySelector<HTMLButtonElement>(`[aria-current='true']`);
    if (!element || !selected) return;
    if (selected.offsetLeft < element.scrollLeft) element.scrollLeft = selected.offsetLeft;
    else if (selected.offsetLeft + selected.offsetWidth > element.scrollLeft + element.clientWidth) element.scrollLeft = selected.offsetLeft + selected.offsetWidth - element.clientWidth;
  }, [state.index]);
  return (
    <div
      role={`region`}
      id={`overview-carousel`}
      className={`overview-carousel`}
      onFocusCapture={state.focusIn}
      aria-roledescription={`carousel`}
      aria-label={`${name} Feature Previews`}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) state.focusOut(); }}
      onPointerEnter={event => { if (event.pointerType === `mouse`) state.hoverIn(); }}
      onPointerLeave={event => { if (event.pointerType === `mouse`) state.hoverOut(); }}
    >
      <div
        tabIndex={0}
        ref={state.viewport}
        onScroll={state.onScroll}
        onWheel={state.onWheel}
        onKeyDown={state.onKeyDown}
        id={`overview-carousel-viewport`}
        className={`overview-carousel-viewport`}
        data-ready={state.ready}
        onPointerUp={state.onPointerUp}
        onPointerDown={state.onPointerDown}
        onPointerMove={state.onPointerMove}
        onPointerCancel={state.onPointerCancel}
        onLostPointerCapture={state.onPointerCancel}
        onDragStart={event => event.preventDefault()}
        aria-label={`Swipe, Drag, Or Use Arrow Keys To Explore Features`}
      >
        {overviewCarouselSlides.map((slide, position) => {
          const clone = position === 0 || position === overviewCarouselSlides.length - 1;
          const suffix = clone ? `-clone-${position}` : ``;
          const selected = !clone && state.index === position - 1;
          return <div
          role={`group`}
          key={`${slide.id}-${position}`}
          inert={!selected}
          aria-roledescription={`slide`}
          aria-hidden={!selected}
          id={`overview-carousel-slide-${slide.id}${suffix}`}
          className={`overview-carousel-slide`}
          aria-label={clone ? undefined : `${position} Of ${overviewSlides.length}: ${slide.title}`}
        >
          {slide.id === `overview` ? <img
            width={1200}
            height={750}
            draggable={false}
            decoding={`async`}
            loading={`lazy`}
            id={`landing-overview-image${suffix}`}
            className={`overview-carousel-illustration`}
            src={`/images/landing/domain-portfolio-overview${switched ? `-name-switch` : ``}.svg`}
            alt={`Illustration of domain folders and a portfolio list with Renew, Review, and Keep labels`}
          /> : <LandingOverviewPreview kind={slide.id} scope={clone ? `clone-${position}` : undefined} />}
        </div>;
        })}
      </div>
      <div id={`overview-carousel-caption`} className={`overview-carousel-caption`}>
        <div id={`overview-carousel-caption-copy`} className={`overview-carousel-caption-copy`}>
          <h3 id={`overview-carousel-title`} className={`overview-carousel-title`}>{selectedSlide.title}</h3>
          <p id={`overview-carousel-description`} className={`overview-carousel-description`}>{selectedSlide.description}</p>
        </div>
        {selectedSlide.id === `overview` ? <Link asChild href={getBlogHref(`domain-portfolio-management`)}>
          <RouterAnchor id={`landing-overview-guide`} className={`overview-carousel-guide`}>
            <BookOpen size={15} aria-hidden id={`landing-overview-guide-icon`} className={`overview-carousel-control-icon`} />
            <span id={`landing-overview-guide-label`} className={`overview-carousel-guide-label`}>{`Guide`}</span>
          </RouterAnchor>
        </Link> : <span id={`overview-carousel-preview-label`} className={`overview-carousel-preview-label`}>{`Sample UI`}</span>}
      </div>
      <div id={`overview-carousel-controls`} className={`overview-carousel-controls`}>
        <button
          type={`button`}
          onClick={state.previous}
          aria-label={`Previous Feature`}
          id={`overview-carousel-previous`}
          className={`overview-carousel-arrow`}
          aria-controls={`overview-carousel-viewport`}
        ><ChevronLeft size={19} aria-hidden id={`overview-carousel-previous-icon`} className={`overview-carousel-control-icon`} /></button>
        <div ref={pagination} id={`overview-carousel-pagination`} className={`overview-carousel-pagination`} role={`group`} aria-label={`Choose A Feature`}>
          {overviewSlides.map((slide, index) => {
            const Icon = slideIcons[slide.id];
            return <button
              type={`button`}
              key={slide.id}
              onClick={() => state.select(index)}
              aria-current={state.index === index ? `true` : undefined}
              id={`overview-carousel-page-${slide.id}`}
              className={`overview-carousel-page`}
              aria-controls={`overview-carousel-slide-${slide.id}`}
              aria-label={`Show ${slide.title}, ${index + 1} Of ${overviewSlides.length}`}
            >
              <Icon size={14} aria-hidden id={`overview-carousel-page-icon-${slide.id}`} className={`overview-carousel-control-icon`} />
              <span id={`overview-carousel-page-label-${slide.id}`} className={`overview-carousel-page-label`}>{slide.label}</span>
            </button>;
          })}
        </div>
        <button
          type={`button`}
          onClick={state.next}
          aria-label={`Next Feature`}
          id={`overview-carousel-next`}
          className={`overview-carousel-arrow`}
          aria-controls={`overview-carousel-viewport`}
        ><ChevronRight size={19} aria-hidden id={`overview-carousel-next-icon`} className={`overview-carousel-control-icon`} /></button>
      </div>
      <span id={`overview-carousel-announcement`} className={`overview-carousel-sr-only`} aria-live={state.autoplaying ? `off` : `polite`} aria-atomic={`true`}>{`${selectedSlide.title}, ${state.index + 1} Of ${overviewSlides.length}`}</span>
    </div>
  );
};

export default LandingOverviewCarousel;
