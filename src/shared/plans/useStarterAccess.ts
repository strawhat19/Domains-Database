import { useContext } from 'react';
import { StarterAccessContext } from './StarterAccessContext';

export const useStarterAccess = () => {
  const context = useContext(StarterAccessContext);
  if (!context) throw new Error(`Use Starter Access Inside Its Provider`);
  return context;
};
