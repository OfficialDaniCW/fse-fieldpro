import { QueryClient } from '@tanstack/react-query';
import { persistCache, loadCache } from './offlineCache';

export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      // Keep data fresh for 30 minutes — no refetch if navigating between pages
      staleTime: 30 * 60 * 1000,
      // Keep unused data in memory for 2 hours
      gcTime: 2 * 60 * 60 * 1000,
      // Don't throw if offline — return cached data
      networkMode: 'offlineFirst',
    },
  },
});

// Restore any previously persisted cache on startup
loadCache(queryClientInstance);

// Persist cache to localStorage whenever it changes
queryClientInstance.getQueryCache().subscribe(() => {
  persistCache(queryClientInstance);
});