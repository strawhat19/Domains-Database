import './styles.scss';
import { useState, type CSSProperties } from 'react';
import { Code2, GitBranch, UserRound } from 'lucide-react';
import { getGitHubLanguageIdentity, type GitHubIdentityProps } from './data';
import { normalizeGitHubAvatar } from '../../../shared/analytics/githubIdentity';

const Artwork = ({ id, kind, name = ``, avatarUrl, large }: GitHubIdentityProps) => {
  const [failed, setFailed] = useState(false);
  const author = kind === `author`;
  const language = kind === `language` ? getGitHubLanguageIdentity(name) : null;
  const avatar = author ? normalizeGitHubAvatar(avatarUrl) : null;
  const asset = kind === `github` ? `/analytics/brands/github.svg` : language ? `/analytics/languages/${language.slug}.svg` : ``;
  const Icon = kind === `github` ? GitBranch : author ? UserRound : Code2;
  const initial = author && name && name !== `Unlinked Author` ? name.slice(0, 1).toUpperCase() : ``;
  return <span id={id} aria-hidden={`true`} className={`dd-github-identity${author ? ` is-avatar` : ``}${large ? ` is-large` : ``}`}>
    {initial ? <span id={`${id}-initial`} className={`dd-github-identity-initial`}>{initial}</span> : <Icon id={`${id}-fallback`} size={large ? 24 : 15} className={`dd-github-identity-fallback`} />}
    {avatar && !failed ? <img
      alt={``}
      width={24}
      height={24}
      src={avatar}
      loading={`lazy`}
      decoding={`async`}
      id={`${id}-image`}
      referrerPolicy={`no-referrer`}
      onError={() => setFailed(true)}
      className={`dd-github-identity-avatar`}
    /> : asset && !failed ? <span id={`${id}-mark`} className={`dd-github-identity-mark`} style={{ '--github-identity-color': language?.color ?? `currentColor`, '--github-identity-image': `url('${asset}')` } as CSSProperties}>
      <img alt={``} src={asset} id={`${id}-source`} onError={() => setFailed(true)} className={`dd-github-identity-source`} />
    </span> : null}
  </span>;
};
const GitHubIdentity = (props: GitHubIdentityProps) => <Artwork {...props} key={`${props.kind}:${props.name ?? ``}:${props.avatarUrl ?? ``}`} />;
export default GitHubIdentity;
