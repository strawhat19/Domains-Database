import './styles.scss';
import PageMeta from '../PageMeta';
import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import RouterAnchor from '../RouterAnchor';
import { routes } from '../../shared/routes';
import DiscoveryBackdrop from '../DiscoveryBackdrop';
import { useSellerProfile } from './useSellerProfile';
import { publicHttpsUrl } from '../../shared/social/content';
import { sellerProfilePath } from '../../shared/marketplace/paths';
import { usePublicProfilePortfolio } from '../PublicProfile/usePublicProfilePortfolio';
import { PortfolioDomainCount, SharedProfileDomains } from '../PublicProfile/PortfolioDetails';
import { sellerStatus, sellerProfileUrl, formatSellerJoinDate, formatSellerListingPrice } from './presentation';
import { Check, X, Lock, Store, House, Globe2, Pencil, Search, UserRound, UsersRound, CalendarDays, CircleAlert, RefreshCw, ChevronRight } from 'lucide-react';

const SellerProfile = ({ username }: { username: string }) => {
  const state = useSellerProfile(username);
  const { active, profile, canEdit, editor, privatePage, isOwnProfile } = state;
  const portfolioId = privatePage ? undefined : profile?.id;
  const portfolio = usePublicProfilePortfolio(portfolioId);
  const sharedDomains = portfolio.data?.domains;
  const [failedPhoto, setFailedPhoto] = useState(``);
  const editTrigger = useRef<HTMLButtonElement>(null);
  const photo = profile?.photoURL ? publicHttpsUrl(profile.photoURL) : null;
  const photoKey = `${profile?.username ?? ``}:${photo ?? ``}`;
  const joined = formatSellerJoinDate(profile?.joinedAt);
  const status = sellerStatus(privatePage, active.result?.state === `not-found`, active.error);
  const VisibilityIcon = privatePage ? Lock : Globe2;
  const StatusIcon = privatePage ? Lock : active.error ? CircleAlert : UserRound;
  const cancelEdit = () => {
    state.cancelEdit();
    requestAnimationFrame(() => editTrigger.current?.focus());
  };

  return (
    <article id={`seller-profile`} className={`seller-profile`} aria-busy={active.loading} aria-labelledby={active.loading ? undefined : `seller-profile-heading`}>
      <PageMeta noIndex title={`Domainer Profile`} description={`Explore domainer profiles and published domain listings on Domains Database.`} canonicalPath={sellerProfilePath(profile?.username ?? state.username)} />
      <header id={`seller-profile-cover`} className={`seller-profile__cover`} data-scroll-hero>
        <DiscoveryBackdrop suffix={`seller-profile-cover`} />
        <div id={`seller-profile-cover-inner`} className={`seller-profile__cover-inner`}>
          <div id={`seller-profile-identity`} className={`seller-profile__identity`} data-unavailable={!profile && !active.loading || undefined}>
            {active.loading ? (
              <div id={`seller-profile-identity-loading`} className={`seller-profile__identity-main`} role={`status`}>
                <span className={`seller-profile__sr-only`}>{`Loading Domainer Profile`}</span>
                <span aria-hidden className={`seller-profile__avatar seller-profile__skeleton`} />
                <div aria-hidden className={`seller-profile__identity-copy`}>
                  <span className={`seller-profile__skeleton seller-profile__skeleton--short`} />
                  <span className={`seller-profile__skeleton seller-profile__skeleton--title`} />
                </div>
              </div>
            ) : profile ? (
              <div id={`seller-profile-identity-main`} className={`seller-profile__identity-main`}>
                <div id={`seller-profile-avatar-${profile.username}`} className={`seller-profile__avatar`} aria-hidden>
                  <span id={`seller-profile-avatar-initial-${profile.username}`}>{profile.name.trim()?.[0]?.toUpperCase() || profile.username?.[0]?.toUpperCase()}</span>
                  {photo && failedPhoto !== photoKey ? <img key={photoKey} id={`seller-profile-avatar-image-${profile.username}`} className={`seller-profile__avatar-image`} src={photo} alt={``} referrerPolicy={`no-referrer`} onError={() => setFailedPhoto(photoKey)} /> : null}
                </div>
                <div id={`seller-profile-identity-copy`} className={`seller-profile__identity-copy`}>
                  <div id={`seller-profile-identity-meta`} className={`seller-profile__identity-meta`}>
                    <span id={`seller-profile-badge`} className={`seller-profile__badge`}><Store size={13} aria-hidden />{`Domainer`}</span>
                    {editor ? (
                      <form
                        id={`seller-profile-username-editor`}
                        aria-busy={editor.busy}
                        className={`seller-profile__editor`}
                        onSubmit={event => { event.preventDefault(); void state.saveUsername(); }}
                        onKeyDown={event => { if (event.key === `Escape` && !editor.busy) cancelEdit(); }}
                      >
                        <label htmlFor={`seller-profile-username-input`} className={`seller-profile__sr-only`}>{`Profile URL`}</label>
                        <div id={`seller-profile-username-input-row`} className={`seller-profile__editor-row`}>
                          <input autoFocus required type={`text`} maxLength={30} value={editor.draft} disabled={editor.busy} autoComplete={`off`} spellCheck={false} autoCapitalize={`none`} id={`seller-profile-username-input`} aria-invalid={Boolean(editor.error)} aria-describedby={`seller-profile-username-hint`} className={`seller-profile__input`} onChange={event => state.changeDraft(event.currentTarget.value)} />
                          <button type={`submit`} disabled={editor.busy} id={`seller-profile-username-save`} title={`Save Profile URL`} aria-label={editor.busy ? `Saving Profile URL` : `Save Profile URL`} className={`seller-profile__square seller-profile__square--primary`}><Check size={16} aria-hidden /></button>
                          <button type={`button`} disabled={editor.busy} id={`seller-profile-username-cancel`} title={`Cancel Editing Profile URL`} aria-label={`Cancel Editing Profile URL`} className={`seller-profile__square`} onClick={cancelEdit}><X size={16} aria-hidden /></button>
                        </div>
                        <p id={`seller-profile-username-hint`} className={`seller-profile__editor-hint`}>{`${sellerProfilePath(editor.draft.trim().toLowerCase() || `username`)} · 3–30 lowercase letters or numbers`}</p>
                        {editor.error ? <p role={`alert`} id={`seller-profile-username-error`} className={`seller-profile__editor-error`}>{editor.error}</p> : null}
                      </form>
                    ) : canEdit ? (
                      <button type={`button`} ref={editTrigger} id={`seller-profile-edit-username`} title={`Edit Profile URL`} aria-label={`Edit Profile URL for @${profile.username}`} className={`seller-profile__username seller-profile__username--editable`} onClick={state.startEdit}>
                        <span><b aria-hidden>@</b>{profile.username}</span><Pencil size={14} aria-hidden />
                      </button>
                    ) : <span id={`seller-profile-username`} className={`seller-profile__username`}><b aria-hidden>@</b>{profile.username}</span>}
                  </div>
                  <h1 id={`seller-profile-heading`} className={`seller-profile__title`}>{profile.name}</h1>
                  {joined ? <p id={`seller-profile-joined`} className={`seller-profile__joined`}><CalendarDays size={14} aria-hidden />{`Joined `}<time dateTime={profile.joinedAt}>{joined}</time></p> : null}
                </div>
              </div>
            ) : null}
            <div id={`seller-profile-identity-side`} className={`seller-profile__identity-side`}>
              {portfolioId ? <PortfolioDomainCount id={portfolioId} portfolio={portfolio} /> : null}
              <nav aria-label={`Breadcrumb`} id={`seller-profile-breadcrumbs`} className={`seller-profile__breadcrumbs`}>
                <ol>
                  <li><Link href={routes.home.href} asChild><RouterAnchor id={`seller-profile-breadcrumb-home`} className={`seller-profile__crumb`}><House size={14} aria-hidden />{routes.home.label}</RouterAnchor></Link></li>
                  <li><ChevronRight size={13} aria-hidden /><Link href={routes.domainers.href} asChild><RouterAnchor id={`seller-profile-breadcrumb-domainers`} className={`seller-profile__crumb`}><UsersRound size={14} aria-hidden />{routes.domainers.label}</RouterAnchor></Link></li>
                  <li className={`seller-profile__crumb-current`}>
                    <ChevronRight size={13} aria-hidden />
                    <span aria-current={`page`} id={`seller-profile-breadcrumb-current`} className={`seller-profile__crumb`}>
                      <UserRound size={14} aria-hidden /><span>{profile?.name ?? `Domainer Profile`}</span>
                    </span>
                  </li>
                </ol>
              </nav>
            </div>
          </div>
        </div>
      </header>
      <div id={`seller-profile-canvas`} className={`seller-profile__canvas`}>
        {active.loading ? (
          <div id={`seller-profile-content-loading`} className={`seller-profile__layout`} aria-hidden>
            <div className={`seller-profile__skeleton seller-profile__skeleton--details`} />
            <div className={`seller-profile__skeleton seller-profile__skeleton--listings`} />
          </div>
        ) : profile ? (
          <>
            {privatePage ? <p id={`seller-profile-private-note`} className={`seller-profile__private-note`}><Lock size={15} aria-hidden />{`Visitors cannot see the details or listings on this profile page.`}</p> : null}
            <div id={`seller-profile-body`} className={`seller-profile__layout`}>
              <aside id={`seller-profile-details`} className={`seller-profile__details`} aria-labelledby={`seller-profile-details-heading`}>
                <h2 id={`seller-profile-details-heading`}>{`Profile Details`}</h2>
                <dl id={`seller-profile-details-record`} className={`seller-profile__details-record`}>
                  <div id={`seller-profile-visibility`} className={`seller-profile__detail`}><dt>{`Visibility`}</dt><dd><VisibilityIcon size={15} aria-hidden />{privatePage ? `Private` : `Public`}</dd></div>
                  <div id={`seller-profile-address`} className={`seller-profile__detail`}><dt>{`Profile URL`}</dt><dd className={`seller-profile__address`}>{sellerProfileUrl(profile.username)}</dd></div>
                  {profile.description ? <div id={`seller-profile-bio`} className={`seller-profile__detail`}><dt>{`Bio`}</dt><dd className={`seller-profile__bio`}>{profile.description}</dd></div> : null}
                </dl>
                {isOwnProfile ? <Link href={routes.profile.href} asChild><RouterAnchor id={`seller-profile-settings`} className={`seller-profile__action`}><Pencil size={14} aria-hidden />{`Profile Settings`}</RouterAnchor></Link> : null}
                {portfolioId && sharedDomains?.length ? <div id={`seller-profile-portfolio`} className={`seller-profile__portfolio`}><SharedProfileDomains id={portfolioId} domains={sharedDomains} /></div> : null}
              </aside>
              <section id={`seller-profile-listings`} className={`seller-profile__listings`} aria-labelledby={`seller-profile-listings-heading`}>
                <div id={`seller-profile-listings-heading-row`} className={`seller-profile__section-heading`}>
                  <h2 id={`seller-profile-listings-heading`}><Store size={21} aria-hidden />{`Published Listings`}</h2>
                  <button type={`button`} disabled={state.loadingMore || editor?.busy} title={`Refresh Domainer Profile`} aria-label={`Refresh Domainer Profile`} id={`seller-profile-refresh`} className={`seller-profile__square`} onClick={state.refresh}><RefreshCw size={16} aria-hidden /></button>
                </div>
                {state.listings.length ? (
                  <ul id={`seller-profile-listing-list`} className={`seller-profile__listing-list`}>
                    {state.listings.map(listing => (
                      <li key={listing.id} id={`seller-profile-listing-row-${listing.id}`} className={`seller-profile__listing-row`}>
                        <Link href={{ pathname: routes.market.href, params: { listing: listing.id } }} asChild>
                          <RouterAnchor id={`seller-profile-listing-${listing.id}`} className={`seller-profile__listing`}>
                            <span id={`seller-profile-listing-mark-${listing.id}`} className={`seller-profile__listing-mark`}><Globe2 size={21} aria-hidden /></span>
                            <span id={`seller-profile-listing-copy-${listing.id}`} className={`seller-profile__listing-copy`}><strong>{listing.domain}</strong>{listing.description ? <span>{listing.description}</span> : null}</span>
                            <span id={`seller-profile-listing-price-${listing.id}`} className={`seller-profile__listing-price`}>{formatSellerListingPrice(listing)}</span>
                            <ChevronRight size={16} aria-hidden id={`seller-profile-listing-chevron-${listing.id}`} className={`seller-profile__listing-chevron`} />
                          </RouterAnchor>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : <div id={`seller-profile-listings-empty`} className={`seller-profile__empty`}><Search size={27} aria-hidden /><h3>{`No Published Listings`}</h3></div>}
                {state.hasMore ? <button type={`button`} disabled={state.loadingMore} onClick={state.loadMore} id={`seller-profile-load-more`} className={`seller-profile__action seller-profile__load-more`} aria-busy={state.loadingMore}>{state.loadingMore ? `Loading Listings` : `Load More Listings`}</button> : null}
              </section>
            </div>
          </>
        ) : (
          <section id={`seller-profile-status`} className={`seller-profile__status`} aria-labelledby={`seller-profile-heading`}>
            <span className={`seller-profile__status-icon`}><StatusIcon size={29} aria-hidden /></span>
            <h1 id={`seller-profile-heading`} className={`seller-profile__title`}>{status.title}</h1>
            <p id={`seller-profile-status-detail`}>{status.detail}</p>
            <div id={`seller-profile-status-actions`} className={`seller-profile__status-actions`}>
              <Link href={routes.market.href} asChild><RouterAnchor id={`seller-profile-browse-market`} className={`seller-profile__action`}><Store size={15} aria-hidden />{`Browse Markets`}</RouterAnchor></Link>
              {active.error ? <button type={`button`} id={`seller-profile-retry`} className={`seller-profile__action`} onClick={state.refresh}><RefreshCw size={15} aria-hidden />{`Retry`}</button> : null}
            </div>
          </section>
        )}
      </div>
    </article>
  );
};

export default SellerProfile;
