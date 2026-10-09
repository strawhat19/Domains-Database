import { useState, useEffect } from 'react';
import { Alert, Linking } from 'react-native';
import { blogFeedsAPI } from '../../api/blogFeeds';
import type { BlogFeeds } from '../../shared/blog/resources';

export const formatFeedDate = (value: string) => {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat(`en-US`, { day: `numeric`, month: `short`, timeZone: `UTC` }).format(date) : ``;
};

export const openBlogResource = async (url: string) => {
  try { await Linking.openURL(url); }
  catch { Alert.alert(`Unable To Open Link`, `Open This Resource In Your Browser:\n${url}`); }
};

export const useBlogResources = () => {
  const [error, setError] = useState(``);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [feeds, setFeeds] = useState<BlogFeeds | null>(null);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    setError(``);
    setLoading(true);
    void blogFeedsAPI.getFeeds(controller.signal).then(result => {
      if (active) setFeeds(result);
    }).catch(() => { if (active) setError(`Could Not Refresh Community Feeds — Explore The Sources Below`); })
      .finally(() => { clearTimeout(timeout); if (active) setLoading(false); });
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [revision]);
  return { feeds, error, loading, refresh: () => setRevision(current => current + 1) };
};
