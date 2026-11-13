import type { DomainContextValue } from '../../shared/domainContext/DomainContext';
import { useAfternicPortfolioSync } from '../../shared/marketplaceAfternic/PortfolioSyncContext';

type RegistrarSync = Pick<DomainContextValue, `loading` | `syncing` | `syncManually` | `canSyncManually` | `manualSyncMessage` | `manualSyncWaitSeconds`>;

export const usePortfolioSync = (registrar: RegistrarSync, afternicEnabled: boolean) => {
  const afternic = useAfternicPortfolioSync(afternicEnabled);
  const syncing = registrar.syncing || afternic.syncing;
  const canSync = registrar.canSyncManually || afternic.connected || Boolean(afternic.error);
  const wait = registrar.manualSyncWaitSeconds;
  const blocked = registrar.loading || syncing || wait > 0;
  const label = syncing ? `Syncing…` : wait > 0
    ? `Wait ${Math.floor(wait / 60)}:${String(wait % 60).padStart(2, `0`)}` : `Sync`;
  const syncManually = async () => {
    if (!canSync || blocked) return;
    if (registrar.canSyncManually) await registrar.syncManually(undefined, afternic.sync);
    else await afternic.sync();
  };

  return { canSync, blocked, syncing, label, message: registrar.manualSyncMessage, afternicError: afternic.error, syncManually };
};
