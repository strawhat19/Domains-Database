import { useSyncExternalStore } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { getMarketRouteParams, getLegacyMarketRouteParams, type MarketSearchParams } from '../marketRoutes';

const subscribe = () => () => undefined;
const clientSnapshot = () => true;
const serverSnapshot = () => false;

const useMarketSearchParams = () => {
  const params = useLocalSearchParams<MarketSearchParams>();
  const clientReady = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  return clientReady ? params : {};
};

export const useMarketRouteParams = () => getMarketRouteParams(useMarketSearchParams());
export const useLegacyMarketRouteParams = () => getLegacyMarketRouteParams(useMarketSearchParams());
