'use client';

import './traffic-segment-icon.scss';
import { useState, type CSSProperties } from 'react';
import type { TrafficSegmentIdentity } from './traffic-segment-identity';

type TrafficSegmentIconProps = { id: string; identity: TrafficSegmentIdentity };
const SegmentArtwork = ({ id, identity }: TrafficSegmentIconProps) => {
  const [assetFailed, setAssetFailed] = useState(false);
  const { Icon, brand, countryCode } = identity;
  const hasFlag = Boolean(countryCode && !assetFailed);
  const hasBrand = Boolean(brand && !assetFailed);

  return (
    <span id={id} aria-hidden={`true`} className={`dd-traffic-segment-icon${hasFlag ? ` is-flag` : hasBrand ? ` is-brand` : ``}`}>
      {hasFlag ? <img alt={``} width={24} height={18} id={`${id}-flag`} className={`dd-traffic-segment-flag`} src={`/analytics/flags/${countryCode}.svg`} onError={() => setAssetFailed(true)} /> : hasBrand && brand ? <span id={`${id}-brand`} className={`dd-traffic-segment-brand`} style={{ '--dd-traffic-brand-color': brand.color, '--dd-traffic-brand-image': `url('/analytics/brands/${brand.key}.svg')` } as CSSProperties}><img hidden alt={``} id={`${id}-brand-source`} className={`dd-traffic-segment-brand-source`} src={`/analytics/brands/${brand.key}.svg`} onError={() => setAssetFailed(true)} /></span> : <Icon className={`dd-report-icon`} size={15} id={`${id}-glyph`} />}
    </span>
  );
};

const TrafficSegmentIcon = (props: TrafficSegmentIconProps) => <SegmentArtwork {...props} key={`${props.identity.countryCode ?? ``}:${props.identity.brand?.key ?? ``}:${props.identity.icon}:${props.identity.caption ?? props.identity.label}`} />;
export default TrafficSegmentIcon;
