import { useContext } from 'react';
import { ConnectionAvailabilityContext } from './ConnectionAvailabilityContext';

export const useConnectionAvailability = () => {
  const context = useContext(ConnectionAvailabilityContext);
  if (!context) throw new Error(`Use Connection Availability Inside Its Provider`);
  return context;
};
