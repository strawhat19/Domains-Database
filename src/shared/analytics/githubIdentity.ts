export const normalizeGitHubAvatar = (value: unknown): string | null => {
  if (typeof value !== `string` || value.length > 512) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== `https:` || url.hostname !== `avatars.githubusercontent.com` || url.port || url.username || url.password
      || !/^\/(?:u|in)\/[1-9]\d*$/.test(url.pathname)) return null;
    const version = url.searchParams.get(`v`);
    return `https://avatars.githubusercontent.com${url.pathname}?s=64${version && /^\d{1,4}$/.test(version) ? `&v=${version}` : ``}`;
  } catch { return null; }
};
