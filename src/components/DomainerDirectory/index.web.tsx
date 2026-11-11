import './styles.scss';
import { useRef } from 'react';
import { Link } from 'expo-router';
import { Roles } from '../../types/types';
import StatePanel from '../StatePanel';
import RouterAnchor from '../RouterAnchor';
import DiscoveryBackdrop from '../DiscoveryBackdrop';
import { ProfileAvatar } from '../Community/ProfileCard';
import { useDomainerDirectory } from './useDomainerDirectory';
import { routes, getPublicProfileHref } from '../../shared/routes';
import { profileOrders, profileFilters, directoryDescription } from './options';
import { X, Crown, Globe2, House, Search, UserRound, UsersRound, ChevronDown, ChevronRight, RotateCw } from 'lucide-react';

const DomainerDirectory = () => {
  const directory = useDomainerDirectory();
  const search = useRef<HTMLInputElement>(null);
  const { query, filter, order, profiles, loading, searching, loadingMore, hasMore, error } = directory;
  const filtered = Boolean(query.trim()) || filter !== `all`;
  const clearSearch = () => {
    directory.setQuery(``);
    search.current?.focus();
  };

  return (
    <article id={`domainer-directory`} className={`domainer-directory`} aria-labelledby={`domainer-directory-title`}>
      <header id={`domainer-directory-cover`} className={`domainer-directory__cover`} data-scroll-hero>
        <DiscoveryBackdrop suffix={`domainer-directory-cover`} />
        <div id={`domainer-directory-cover-inner`} className={`domainer-directory__frame`}>
          <div id={`domainer-directory-hero`} className={`domainer-directory__hero`}>
            <div id={`domainer-directory-identity`} className={`domainer-directory__identity`}>
              <div id={`domainer-directory-mark`} className={`domainer-directory__mark`}><UsersRound size={29} aria-hidden /></div>
              <div id={`domainer-directory-hero-copy`} className={`domainer-directory__hero-copy`}>
                <h1 id={`domainer-directory-title`}>{`Domainers`}</h1>
                <p id={`domainer-directory-description`}>{directoryDescription}</p>
              </div>
            </div>
            <nav id={`domainer-directory-breadcrumbs`} className={`domainer-directory__breadcrumbs`} aria-label={`Breadcrumb`}>
              <ol>
                <li><Link asChild href={routes.home.href}><RouterAnchor id={`domainer-directory-home`}><House size={14} aria-hidden />{routes.home.label}</RouterAnchor></Link></li>
                <li><ChevronRight size={13} aria-hidden /><span aria-current={`page`}><UsersRound size={14} aria-hidden />{routes.domainers.label}</span></li>
              </ol>
            </nav>
          </div>
        </div>
      </header>

      <section id={`domainer-directory-results`} className={`domainer-directory__frame domainer-directory__results`} aria-label={`Public Domainer Profiles`}>
        <div id={`domainer-directory-controls`} className={`domainer-directory__controls`}>
          <div id={`domainer-directory-search-field`} className={`domainer-directory__search`}>
            <Search size={17} aria-hidden />
            <input
              ref={search}
              type={`search`}
              value={query}
              maxLength={120}
              autoComplete={`off`}
              id={`domainer-directory-search`}
              aria-label={`Search Domainers`}
              placeholder={`Search by name or bio`}
              className={`domainer-directory__search-input`}
              onChange={event => directory.setQuery(event.currentTarget.value)}
            />
            {query ? <button type={`button`} onClick={clearSearch} title={`Clear Search`} aria-label={`Clear Search`} id={`domainer-directory-clear`} className={`domainer-directory__clear`}><X size={15} aria-hidden /></button> : null}
          </div>
          <select
            value={filter}
            id={`domainer-directory-filter`}
            aria-label={`Filter Profiles`}
            className={`domainer-directory__select`}
            onChange={event => directory.setFilter(event.currentTarget.value === `with-bio` ? `with-bio` : `all`)}
          >
            {profileFilters.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select
            value={order}
            id={`domainer-directory-order`}
            aria-label={`Sort Profiles By Name`}
            className={`domainer-directory__select`}
            onChange={event => directory.setOrder(event.currentTarget.value === `za` ? `za` : `az`)}
          >
            {profileOrders.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>

        <p role={`status`} id={`domainer-directory-status`} className={`domainer-directory__status`}>
          {loading ? `Loading Profiles` : searching ? `Searching Public Profiles` : loadingMore ? `Loading More Profiles` : profiles.length ? `${profiles.length.toLocaleString()} ${profiles.length === 1 ? `profile` : `profiles`} shown` : null}
        </p>

        {loading || ((searching || loadingMore) && !profiles.length) ? (
          <div aria-hidden id={`domainer-directory-loading`} className={`domainer-directory__grid`}>
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} id={`domainer-directory-skeleton-${index}`} className={`domainer-directory__card domainer-directory__skeleton`}>
                <div className={`domainer-directory__skeleton-identity`}><span /><span /></div>
                <span className={`domainer-directory__skeleton-bio`} />
                <div className={`domainer-directory__metadata domainer-directory__skeleton-meta`}><span /><span /></div>
              </div>
            ))}
          </div>
        ) : profiles.length ? (
          <ul id={`domainer-directory-grid`} className={`domainer-directory__grid`}>
            {profiles.map(profile => {
              const role = profile.cardMetadata?.role;
              const RoleIcon = role === Roles.Owner ? Crown : UserRound;
              const count = profile.cardMetadata?.totalDomains?.toLocaleString();
              const metadataId = `domainer-directory-metadata-${profile.id}`;
              return <li key={profile.id} id={`domainer-directory-item-${profile.id}`} className={`domainer-directory__item`}>
                <Link asChild href={getPublicProfileHref(profile.id)}>
                  <RouterAnchor aria-describedby={metadataId} id={`domainer-directory-profile-${profile.id}`} className={`domainer-directory__card`} aria-labelledby={`domainer-directory-name-${profile.id}`}>
                    <div className={`domainer-directory__card-heading`}>
                      <div className={`domainer-directory__avatar`} aria-hidden><ProfileAvatar key={profile.photoURL} profile={profile} scope={`domainer-directory-${profile.id}`} /></div>
                      <h2 id={`domainer-directory-name-${profile.id}`}>{profile.name}</h2>
                      <ChevronRight size={17} aria-hidden />
                    </div>
                    {profile.description.trim() ? <p id={`domainer-directory-bio-${profile.id}`} className={`domainer-directory__bio`}>{profile.description}</p> : null}
                    <div id={metadataId} className={`domainer-directory__metadata`}>
                      <span id={`domainer-directory-role-${profile.id}`} className={`domainer-directory__role`}><RoleIcon size={12} aria-hidden />{role ?? `Role Unavailable`}</span>
                      <span id={`domainer-directory-domain-count-${profile.id}`} className={`domainer-directory__domain-count`}>
                        <Globe2 size={13} aria-hidden />{`Total Domains`}
                        {count === undefined ? <><strong aria-hidden title={`Total Domains Unavailable`}>{`—`}</strong><span className={`domainer-directory__sr-only`}>{`Unavailable`}</span></> : <strong>{count}</strong>}
                      </span>
                    </div>
                  </RouterAnchor>
                </Link>
              </li>;
            })}
          </ul>
        ) : !hasMore && !error ? (
          <StatePanel
            variant={`inline`}
            id={`domainer-directory-empty`}
            icon={filtered ? `search` : `community`}
            title={filtered ? `No Matching Profiles` : `No Public Profiles Yet`}
            description={filtered ? `Try another search or change the profile filter.` : `Public profiles will appear here when available.`}
          />
        ) : null}

        {error ? (
          <StatePanel alert title={error} icon={`error`} variant={`inline`} id={`domainer-directory-error`} description={profiles.length ? `Try loading more profiles again.` : `Try loading the directory again.`}>
            <button type={`button`} onClick={directory.retry} id={`domainer-directory-retry`} className={`domainer-directory__action`}><RotateCw size={15} aria-hidden />{`Try Again`}</button>
          </StatePanel>
        ) : hasMore && !loading && !searching ? (
          <button type={`button`} disabled={loadingMore} onClick={directory.loadMore} id={`domainer-directory-load-more`} className={`domainer-directory__action domainer-directory__more`}>
            <ChevronDown size={16} aria-hidden />{loadingMore ? `Loading Profiles` : `Load More Profiles`}
          </button>
        ) : null}
      </section>
    </article>
  );
};

export default DomainerDirectory;
