import type { PortfolioSections } from '../../shared/portfolioPreferences/types';

export interface PortfolioSettingsActionsProps {
  id: string;
  label: string;
  hidden: boolean;
  disabled?: boolean;
  treeAvailable?: boolean;
  sections: PortfolioSections;
  onToggleVisibility: () => void;
}
