import { useContext } from 'react';
import { DomainContext } from './DomainContext';

export const useDomains = () => {
  const context = useContext(DomainContext);
  if (!context) throw new Error(`Use Domains Inside Domain Provider`);
  return context;
};
