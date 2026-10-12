import './styles.scss';
import { memo } from 'react';
import { useAccountBackdrop } from './useAccountBackdrop.web';
import { slabFaces, backdropDots, backdropSlabs } from './content';

const AccountBackdrop = () => {
  const backdropRef = useAccountBackdrop();
  return <div ref={backdropRef} id={`account-backdrop`} className={`account-backdrop`} aria-hidden={`true`} data-motion={`paused`}>
    <div id={`account-backdrop-glow`} className={`account-backdrop-glow`} />
    <div id={`account-backdrop-dots`} className={`account-backdrop-dots`}>
      <svg id={`account-backdrop-dot-grid`} className={`account-backdrop-dot-grid`} viewBox={`0 0 200 150`} focusable={`false`}>
        {backdropDots.map(({ x, y, index, opacity }) => <circle key={index} id={`account-backdrop-dot-${index}`} className={`account-backdrop-dot`} r={2.4} cx={x} cy={y} opacity={opacity} />)}
      </svg>
    </div>
    <div id={`account-backdrop-slabs`} className={`account-backdrop-slabs`}>
      <svg id={`account-backdrop-slab-field`} className={`account-backdrop-slab-field`} viewBox={`0 0 320 220`} focusable={`false`}>
        {backdropSlabs.map(({ x, y, index }) => <g key={index} id={`account-backdrop-slab-${index}`} className={`account-backdrop-slab`} transform={`translate(${x} ${y})`}>
          <path id={`account-backdrop-slab-top-${index}`} className={`account-backdrop-slab-top`} d={slabFaces.top} />
          <path id={`account-backdrop-slab-left-${index}`} className={`account-backdrop-slab-left`} d={slabFaces.left} />
          <path id={`account-backdrop-slab-right-${index}`} className={`account-backdrop-slab-right`} d={slabFaces.right} />
        </g>)}
      </svg>
    </div>
  </div>;
};

export default memo(AccountBackdrop);
