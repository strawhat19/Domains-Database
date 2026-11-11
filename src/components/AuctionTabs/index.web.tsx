import './styles.scss';
import { Link } from 'expo-router';
import RouterAnchor from '../RouterAnchor';
import '../SegmentedControl/styles.scss';
import { Gavel, Store } from 'lucide-react';
import { auctionTabs, type AuctionTab } from './tabs';

const icons = { markets: Store, auctions: Gavel };

const AuctionTabs = ({ activeTab }: { activeTab: AuctionTab }) => (
  <nav id={`auction-tabs`} aria-label={`Market And Auctions`} className={`auction-tabs segmented-control`}>
    {auctionTabs.map(({ id, href, label, beta }) => {
      const Icon = icons[id];
      const selected = activeTab === id;
      return (
        <Link key={id} asChild href={href}>
          <RouterAnchor
            id={`auction-tab-${id}`}
            aria-current={selected ? `page` : undefined}
            className={`auction-tabs-option segmented-control-option`}
            onClick={event => {
              if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              if (selected) event.preventDefault();
              else window.scrollTo({ top: 0, behavior: `instant` });
            }}
          >
            <Icon size={16} aria-hidden id={`auction-tab-icon-${id}`} className={`segmented-control-icon`} />
            <span id={`auction-tab-label-${id}`} className={`segmented-control-text`}>{label}</span>
            {beta && <span id={`auction-tab-beta-${id}`} className={`auction-tabs-beta`}>{`Beta`}</span>}
          </RouterAnchor>
        </Link>
      );
    })}
  </nav>
);

export default AuctionTabs;
