export const getAdSensePublisherId = () => {
  const value = process.env.EXPO_PUBLIC_ADSENSE_PUBLISHER_ID?.trim() ?? ``;
  const number = /^(?:ca-)?pub-(\d{16})$/.exec(value)?.[1];
  return number && !/^0+$/.test(number) ? `ca-pub-${number}` : null;
};

export const getAdsTxtLine = () => {
  const publisherId = getAdSensePublisherId()?.replace(/^ca-/, ``);
  return publisherId ? `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n` : null;
};
