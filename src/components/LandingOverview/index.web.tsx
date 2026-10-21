import './styles.scss';
import { useAppBrand } from '../../shared/branding/useAppBrand';
import LandingOverviewCarousel from '../LandingOverviewCarousel';
import { overviewTitle, overviewDescription } from './content';

const LandingOverview = () => {
  const { formatText } = useAppBrand();

  return (
    <section id={`landing-overview`} className={`landing-section landing-overview`} aria-labelledby={`landing-overview-title`}>
      <div id={`landing-overview-inner`} className={`landing-section-inner`}>
        <div id={`landing-overview-intro`} className={`landing-overview-intro`}>
          <div id={`landing-overview-copy`} className={`landing-overview-copy`}>
            <p id={`landing-overview-eyebrow`} className={`landing-eyebrow`}>{`From Scattered Names To Clear Plans`}</p>
            <h2 id={`landing-overview-title`} className={`landing-section-title`}>{formatText(overviewTitle)}</h2>
            <p id={`landing-overview-description`} className={`landing-section-description`}>{overviewDescription}</p>
            <p id={`landing-overview-summary`} className={`landing-overview-summary`}>{`Know what you own, what it costs, and what you want to build next.`}</p>
          </div>
          <LandingOverviewCarousel />
        </div>
      </div>
    </section>
  );
};

export default LandingOverview;
