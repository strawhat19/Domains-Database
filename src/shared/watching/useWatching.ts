import { useContext } from 'react';
import { WatchingContext } from './WatchingContext';

export const useWatching = () => {
  const context = useContext(WatchingContext);
  if (!context) throw new Error(`Use Watching Inside Watching Provider`);
  return context;
};
