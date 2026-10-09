import { useMemo, useState } from 'react';
import { persistenceEnabled } from '../../shared/config';
import { useWatching } from '../../shared/watching/useWatching';
import { getDomainSearchStatus } from '../DomainSearch/resultPresentation';

export const useWatchingPage = () => {
  const watching = useWatching();
  const [query, setQuery] = useState(``);
  const records = useMemo(() => watching.records.filter(record => record.listName === `Watching`), [watching.records]);
  const filteredRecords = useMemo(() => {
    const search = query.trim().toLowerCase();
    return records.filter(record => !search || [record.domain, ...record.connections.map(connection => connection.label)]
      .some(value => value.toLowerCase().includes(search)));
  }, [query, records]);
  const availableCount = records.filter(record => getDomainSearchStatus(record).state === `available`).length;
  const disabled = watching.loading || watching.busy || watching.syncing;
  const storageMessage = persistenceEnabled
    ? `Watching keeps your saved domains together.`
    : `Connect a backend to save Watching.`;

  return {
    ...watching,
    query,
    records,
    disabled,
    setQuery,
    availableCount,
    filteredRecords,
    storageMessage,
  };
};
