import { Plug, UserRound, ShieldCheck } from 'lucide-react';
import { useFeatureFlags } from '../../shared/featureFlags/useFeatureFlags';

const profileFields = [`name`, `email`, `bio`];
const metadataFields = [`role`, `plan`, `privacy`, `joined`];
const portfolioFields = [`domains`, `renewals`, `cost`];
const Placeholder = ({ id, variant = `` }: { id: string; variant?: string }) => (
  <span id={id} className={`account-loading-placeholder${variant ? ` ${variant}` : ``}`} />
);

const ProfileSkeleton = ({ connections = false }: { connections?: boolean }) => {
  const { flags, ready: featuresReady } = useFeatureFlags();
  const scope = `account-loading-${connections ? `connection` : `profile`}`;
  const HeadingIcon = connections ? Plug : UserRound;
  return (
    <div aria-hidden id={scope} className={`account-loading-profile${connections ? ` is-connections` : ``}`}>
      <div id={`${scope}-main`} className={`account-loading-profile-main`}>
        <div id={`${scope}-heading`} className={`account-loading-profile-heading`}>
          <span id={`${scope}-eyebrow`} className={`account-loading-profile-eyebrow`}>{`Your Account`}</span>
          <h1 id={`${scope}-title`} className={`account-loading-profile-title`}>
            <HeadingIcon size={28} id={`${scope}-title-icon`} className={`account-loading-profile-title-icon`} />
            {connections ? `Connections` : <><span id={`${scope}-greeting`} className={`account-loading-profile-greeting`}>{`Hello,`}</span><Placeholder id={`${scope}-name`} variant={`account-loading-title-line`} /></>}
          </h1>
        </div>
        {connections ? (
          <div id={`${scope}-registrar`} className={`account-loading-panel`}>
            <div id={`${scope}-tabs`} className={`account-loading-connection-tabs`}>
              {[0, 1, 2, 3].map(index => <Placeholder key={index} id={`${scope}-tab-${index}`} variant={`is-button`} />)}
            </div>
            <div id={`${scope}-registrar-heading`} className={`account-loading-panel-heading`}>
              <Plug size={20} id={`${scope}-registrar-icon`} className={`account-loading-panel-icon`} />
              <Placeholder id={`${scope}-registrar-title`} variant={`account-loading-title-line`} />
              <Placeholder id={`${scope}-add`} variant={`is-button`} />
            </div>
            <Placeholder id={`${scope}-description`} variant={`is-long`} />
            <div id={`${scope}-fields`} className={`account-loading-connection-fields`}>
              {[`key`, `secret`].map(field => (
                <div key={field} id={`${scope}-field-${field}`} className={`account-loading-profile-value`}>
                  <Placeholder id={`${scope}-label-${field}`} variant={`is-short`} />
                  <Placeholder id={`${scope}-input-${field}`} variant={`is-input`} />
                  <Placeholder id={`${scope}-hint-${field}`} variant={`is-long`} />
                </div>
              ))}
            </div>
            <div id={`${scope}-actions`} className={`account-loading-profile-actions`}>
              {[`clear`, `save`].map(action => <Placeholder key={action} id={`${scope}-action-${action}`} variant={`is-button`} />)}
            </div>
          </div>
        ) : (
          <div id={`${scope}-record`} className={`account-loading-profile-record`}>
            {profileFields.map(field => (
              <div key={field} id={`${scope}-row-${field}`} className={`account-loading-profile-row`}>
                <div id={`${scope}-label-${field}`} className={`account-loading-profile-label`}>
                  <Placeholder id={`${scope}-label-placeholder-${field}`} variant={`is-short`} />
                </div>
                <div id={`${scope}-value-${field}`} className={`account-loading-profile-value`}>
                  <Placeholder id={`${scope}-input-${field}`} variant={field === `bio` ? `is-textarea` : `is-input`} />
                  {field === `name` && <div id={`${scope}-name-actions`} className={`account-loading-profile-actions`}>
                    {[`save`, `cancel`].map(action => <Placeholder key={action} id={`${scope}-name-${action}`} variant={`is-button`} />)}
                  </div>}
                </div>
              </div>
            ))}
            <div id={`${scope}-privacy-row`} className={`account-loading-profile-row`}>
              <div id={`${scope}-privacy-label`} className={`account-loading-profile-label`}><Placeholder id={`${scope}-privacy-label-placeholder`} variant={`is-short`} /></div>
              <div id={`${scope}-privacy-value`} className={`account-loading-profile-actions`}>
                {[`private`, `public`].map(privacy => <Placeholder key={privacy} id={`${scope}-privacy-${privacy}`} variant={`is-button`} />)}
              </div>
            </div>
            <div id={`${scope}-sharing-row`} className={`account-loading-profile-row`}>
              <div id={`${scope}-sharing-label`} className={`account-loading-profile-label`}><Placeholder id={`${scope}-sharing-label-placeholder`} variant={`is-short`} /></div>
              <div id={`${scope}-sharing-value`} className={`account-loading-profile-preference`}>
                <Placeholder id={`${scope}-sharing-toggle`} variant={`is-toggle`} />
                <Placeholder id={`${scope}-sharing-copy`} variant={`is-long`} />
              </div>
            </div>
            <div id={`${scope}-account-row`} className={`account-loading-profile-row`}>
              <div id={`${scope}-account-label`} className={`account-loading-profile-label`}><Placeholder id={`${scope}-account-label-placeholder`} variant={`is-short`} /></div>
              <div id={`${scope}-account-actions`} className={`account-loading-profile-actions`}>
                {[`signout`, `data`, `connections`].map(action => <Placeholder key={action} id={`${scope}-account-${action}`} variant={`is-button`} />)}
              </div>
            </div>
          </div>
        )}
      </div>
      {!connections && (
        <aside id={`${scope}-details`} className={`account-loading-panel account-loading-profile-details`}>
          <div id={`${scope}-details-heading`} className={`account-loading-panel-heading`}>
            <Placeholder id={`${scope}-details-title`} variant={`account-loading-title-line`} />
            <ShieldCheck size={18} id={`${scope}-details-icon`} className={`account-loading-panel-icon`} />
          </div>
          <div id={`${scope}-metadata`} className={`account-loading-profile-metadata`}>
            {metadataFields.map(field => (
              <div key={field} id={`${scope}-metadata-row-${field}`} className={`account-loading-profile-metadata-row`}>
                <Placeholder id={`${scope}-metadata-label-${field}`} variant={`is-short`} />
                <Placeholder id={`${scope}-metadata-value-${field}`} variant={`is-long`} />
              </div>
            ))}
          </div>
          {featuresReady && flags.themeToggle && <div id={`${scope}-theme`} className={`account-loading-profile-portfolio`}>
            <Placeholder id={`${scope}-theme-label`} variant={`is-short`} />
            <div id={`${scope}-theme-options`} className={`account-loading-profile-actions`}>
              {[`light`, `dark`].map(theme => <Placeholder key={theme} id={`${scope}-theme-${theme}`} variant={`is-button`} />)}
            </div>
          </div>}
          <div id={`${scope}-portfolio`} className={`account-loading-profile-portfolio`}>
            <Placeholder id={`${scope}-portfolio-title`} variant={`is-short`} />
            {portfolioFields.map(field => (
              <div key={field} id={`${scope}-portfolio-row-${field}`} className={`account-loading-profile-metadata-row`}>
                <Placeholder id={`${scope}-portfolio-label-${field}`} variant={`is-long`} />
                <Placeholder id={`${scope}-portfolio-value-${field}`} variant={`is-short`} />
              </div>
            ))}
          </div>
          <div id={`${scope}-identity`} className={`account-loading-profile-identity`}>
            <Placeholder id={`${scope}-source`} variant={`is-short`} />
            <Placeholder id={`${scope}-id`} variant={`is-long`} />
          </div>
        </aside>
      )}
    </div>
  );
};

export default ProfileSkeleton;
