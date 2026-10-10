import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';

export const useDomainVisibilityButton = (domainId: string, disabled = false) => {
  const preferences = usePortfolioPreferences();
  const hidden = preferences.hiddenDomainIds.includes(domainId);
  const toggle = () => {
    if (disabled || preferences.loading) return;
    const changed = preferences.toggleDomainVisibility(domainId);
    if (changed && !hidden && !preferences.showHiddenDomains) {
      document.getElementById(`portfolio-table-settings`)?.focus({ preventScroll: true });
    }
  };

  return { hidden, toggle, disabled: disabled || preferences.loading };
};
