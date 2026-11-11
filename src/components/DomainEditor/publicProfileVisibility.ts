import { Roles } from '../../types/types';
import type { DomainInput } from '../../shared/types';
import { normalizeDomainName } from '../../shared/domainUtils';
import type { User } from '../../shared/models/users/User';

export const publicDomainLabel = `Show On Public Profile`;
export const publicDomainHint = `Show this domain name when your profile is public.`;
export const publicDomainRenameHint = `Save the new domain name before choosing whether to share it.`;

export const canSetPublicDomain = (user: Pick<User, `active` | `anonymous` | `role`> | null | undefined) =>
  Boolean(user?.active && !user.anonymous && user.role !== Roles.Guest);

export const publicDomainName = (name: string) => {
  try { return normalizeDomainName(name); }
  catch { return name.trim().toLowerCase(); }
};

export const setPublicDomain = (input: DomainInput, showOnPublicProfile: boolean): DomainInput => ({
  ...input,
  meta: { ...input.meta, showOnPublicProfile },
});

export const domainEditorMetadata = (metadata: DomainInput[`meta`], saved: DomainInput[`meta`]) => {
  if (!metadata || metadata.showOnPublicProfile === undefined || metadata.showOnPublicProfile !== saved?.showOnPublicProfile) return metadata;
  const changes = { ...metadata };
  delete changes.showOnPublicProfile;
  return changes;
};

export const updateDomainEditorName = (input: DomainInput, name: string): DomainInput => {
  const renamed = { ...input, name };
  return input.meta?.showOnPublicProfile === true && publicDomainName(input.name) !== publicDomainName(name)
    ? setPublicDomain(renamed, false) : renamed;
};
