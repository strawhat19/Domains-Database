import { useContext } from 'react';
import { AccountNavigationContext } from './AccountNavigationContext';

export const useAccountNavigationState = () => {
  const context = useContext(AccountNavigationContext);
  if (!context) throw new Error(`Use Account Navigation Inside Its Provider`);
  return context;
};
