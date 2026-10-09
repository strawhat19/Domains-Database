import './styles.scss';
import { memo } from 'react';
import HeroCubes from '../HeroCubes/index.web';
import { Search, Plug, Globe2, Layers3, ArrowUpRight } from 'lucide-react';
import { onboardingCopy, workspacePreview, onboardingBenefits, type AuthOnboardingProps } from './content';

const benefitIcons = { search: Search, organize: Layers3, connect: Plug };

const AuthOnboarding = ({ mode }: AuthOnboardingProps) => {
  const copy = onboardingCopy[mode];
  const scope = `auth-onboarding-${mode}`;

  return (
    <aside id={scope} className={`auth-onboarding`} aria-labelledby={`${scope}-title`}>
      <div id={`${scope}-art`} className={`auth-onboarding-art`} aria-hidden>
        <HeroCubes />
      </div>
      <div id={`${scope}-heading`} className={`auth-onboarding-heading`}>
        <p id={`${scope}-eyebrow`} className={`auth-onboarding-eyebrow`}>
          <Layers3 size={15} aria-hidden id={`${scope}-eyebrow-icon`} className={`auth-onboarding-eyebrow-icon`} />
          {`YOUR DOMAIN WORKSPACE`}
        </p>
        <h2 id={`${scope}-title`} className={`auth-onboarding-title`}>
          {copy.title}
          <span id={`${scope}-title-accent`} className={`auth-onboarding-title-accent`}>{copy.accent}</span>
        </h2>
        <p id={`${scope}-description`} className={`auth-onboarding-description`}>{copy.description}</p>
      </div>
      <figure id={`${scope}-preview`} className={`auth-onboarding-preview`} aria-label={`Illustrative Workspace Preview With Example Domain Names`}>
        <figcaption id={`${scope}-preview-heading`} className={`auth-onboarding-preview-heading`}>
          <span id={`${scope}-preview-label`} className={`auth-onboarding-preview-label`}>
            <Layers3 size={14} aria-hidden id={`${scope}-preview-icon`} className={`auth-onboarding-preview-icon`} />
            {`Workspace preview`}
          </span>
          <span id={`${scope}-preview-tag`} className={`auth-onboarding-preview-tag`}>{`Illustration`}</span>
        </figcaption>
        <div id={`${scope}-search`} className={`auth-onboarding-search`} aria-hidden>
          <Search size={16} id={`${scope}-search-icon`} className={`auth-onboarding-search-icon`} />
          <span id={`${scope}-search-query`} className={`auth-onboarding-search-query`}>{`your next idea`}</span>
          <span id={`${scope}-search-extensions`} className={`auth-onboarding-search-extensions`}>{`.com · .io · .dev`}</span>
        </div>
        <ul id={`${scope}-records`} className={`auth-onboarding-records`} aria-label={`Example Portfolio`}>
          {workspacePreview.map(record => (
            <li key={record.id} id={`${scope}-record-${record.id}`} className={`auth-onboarding-record`}>
              <span id={`${scope}-record-symbol-${record.id}`} className={`auth-onboarding-record-symbol`} aria-hidden>
                <Globe2 size={15} id={`${scope}-record-icon-${record.id}`} className={`auth-onboarding-record-icon`} />
              </span>
              <span id={`${scope}-record-copy-${record.id}`} className={`auth-onboarding-record-copy`}>
                <span id={`${scope}-record-name-${record.id}`} className={`auth-onboarding-record-name`}>{record.name}</span>
                <span id={`${scope}-record-note-${record.id}`} className={`auth-onboarding-record-note`}>{record.note}</span>
              </span>
              <span id={`${scope}-record-label-${record.id}`} className={`auth-onboarding-record-label`}>{record.label}</span>
            </li>
          ))}
        </ul>
        <p id={`${scope}-preview-note`} className={`auth-onboarding-preview-note`}>
          {`Example names. Your workspace starts with your own domains.`}
          <ArrowUpRight size={13} aria-hidden id={`${scope}-preview-note-icon`} className={`auth-onboarding-preview-note-icon`} />
        </p>
      </figure>
      <ul id={`${scope}-benefits`} className={`auth-onboarding-benefits`} aria-label={`Workspace Features`}>
        {onboardingBenefits.map(benefit => {
          const Icon = benefitIcons[benefit.id];
          return (
            <li key={benefit.id} id={`${scope}-benefit-${benefit.id}`} className={`auth-onboarding-benefit`}>
              <span id={`${scope}-benefit-heading-${benefit.id}`} className={`auth-onboarding-benefit-heading`}>
                <Icon size={15} aria-hidden id={`${scope}-benefit-icon-${benefit.id}`} className={`auth-onboarding-benefit-icon`} />
                <strong id={`${scope}-benefit-label-${benefit.id}`} className={`auth-onboarding-benefit-label`}>{benefit.label}</strong>
              </span>
              <p id={`${scope}-benefit-copy-${benefit.id}`} className={`auth-onboarding-benefit-copy`}>{benefit.copy}</p>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

export default memo(AuthOnboarding);
