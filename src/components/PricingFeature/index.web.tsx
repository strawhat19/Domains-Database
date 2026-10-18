import './styles.scss';
import { Check, List, Clock3, Layers } from 'lucide-react';
import { useAppBrand } from '../../shared/branding/useAppBrand';
import { getPricingFeatureBadges } from '../../shared/plans/pricingFeatures';
import type { PricingFeature as Feature } from '../../shared/plans/pricingFeatures';

const PricingFeature = ({ id, feature }: { id: string; feature: Feature }) => {
  const brand = useAppBrand();
  const badges = getPricingFeatureBadges(feature);
  const visibleBadges = badges.filter(badge => badge.id !== `current` && badge.id !== `proposed`);
  const Icon = feature.status === `current` ? Check : feature.status === `proposed` ? Clock3 : feature.status === `included` ? Layers : List;

  return <li id={id} className={`pricing-feature pricing-feature-${feature.status}`}>
    <Icon
      size={14}
      role={`img`}
      id={`${id}-icon`}
      className={`pricing-feature-icon`}
      aria-label={brand.formatText(badges[0]?.description ?? feature.status)}
    />
    <div id={`${id}-content`} className={`pricing-feature-content`}>
      <span id={`${id}-label`} className={`pricing-feature-label`}>{brand.formatText(feature.label)}</span>
      {visibleBadges.length > 0 && <span id={`${id}-badges`} className={`pricing-feature-badges`}>
        {visibleBadges.map(badge => <span key={badge.id} id={`${id}-badge-${badge.id}`} title={brand.formatText(badge.description)} className={`pricing-feature-badge pricing-feature-badge-${badge.id}`}>{brand.formatText(badge.label)}</span>)}
      </span>}
    </div>
  </li>;
};

export default PricingFeature;
