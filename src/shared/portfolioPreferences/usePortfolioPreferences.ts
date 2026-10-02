import { useContext } from 'react';
import { PortfolioPreferencesContext } from './PortfolioPreferencesContext';

export const usePortfolioPreferences = () => {
  const context = useContext(PortfolioPreferencesContext);
  if (!context) throw new Error(`usePortfolioPreferences Must Be Used Inside PortfolioPreferencesProvider`);
  return context;
};
