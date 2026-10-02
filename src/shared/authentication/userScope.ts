export const accountStorageKey = (baseKey: string, userId: string | null | undefined) => {
  if (!userId?.trim()) throw new Error(`Sign In To Access Your Saved Data`);
  return `${baseKey}:user:${userId}`;
};
