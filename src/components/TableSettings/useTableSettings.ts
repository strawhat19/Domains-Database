import { useRef } from 'react';
import { useModalFocus } from '../DomainEditor/useDomainEditor';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';

export const useTableSettings = (onClose: () => void) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const preferences = usePortfolioPreferences();
  useModalFocus(modalRef, true, onClose, true);

  return { ...preferences, modalRef };
};
