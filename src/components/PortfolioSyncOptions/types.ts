import type { ManualSyncChoice } from '../../shared/registrarSync/useRegistrarSync';

export interface PortfolioSyncOptionsProps {
  busy: boolean;
  onClose: () => void;
  onSyncAll: () => void;
  choices: ManualSyncChoice[];
  onSync: (connectionId: string) => void;
}
