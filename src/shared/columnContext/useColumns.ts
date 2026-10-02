import { useContext } from 'react';
import { ColumnContext } from './ColumnContext';

export const useColumns = () => {
  const context = useContext(ColumnContext);
  if (!context) throw new Error(`useColumns Must Be Used Inside ColumnProvider`);
  return context;
};
