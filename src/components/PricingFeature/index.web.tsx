import './styles.scss';
import { Check, List, Clock3, Layers } from 'lucide-react';
import { useAppBrand } from '../../shared/branding/useAppBrand';
import { getPricingFeatureBadges } from '../../shared/plans/pricingFeatures';
import type { PricingFeature as Feature } from '../../shared/plans/pricingFeatures';

const PricingFeature = ({ id, feature }: { id: string; feature: Feature }) => {
  const brand = useAppBrand();
  const badges = getPricingFeatureBadges(feature);
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
    </div>
  </li>;
};

export default PricingFeature;
