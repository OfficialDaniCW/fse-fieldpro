import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cacheParts, getCachedParts, searchCachedParts, cacheManuals, getCachedManuals, searchCachedManuals, getCacheMetadata } from '@/lib/indexedDBCache';

/**
 * Hook: useOfflineCache
 * Automatically caches query data to IndexedDB and provides offline fallback
 */
export function useOfflineCache(entityType, queryOptions) {
  const [offlineData, setOfflineData] = useState(null);

  const query = useQuery(queryOptions);

  // When data loads, cache it
  useEffect(() => {
    if (!query.data) return;

    const cacheData = async () => {
      try {
        if (entityType === 'parts') {
          await cacheParts(query.data);
        } else if (entityType === 'manuals') {
          await cacheManuals(query.data);
        }
      } catch (err) {
        console.error(`Failed to cache ${entityType}:`, err);
      }
    };

    cacheData();
  }, [query.data, entityType]);

  // If offline or no data, try to load from cache
  useEffect(() => {
    if (query.data || query.isLoading) return;

    const loadOfflineData = async () => {
      try {
        let cached;
        if (entityType === 'parts') {
          cached = await getCachedParts();
        } else if (entityType === 'manuals') {
          cached = await getCachedManuals();
        }

        if (cached?.length > 0) {
          setOfflineData(cached);
        }
      } catch (err) {
        console.error(`Failed to load offline ${entityType}:`, err);
      }
    };

    loadOfflineData();
  }, [entityType, query.data, query.isLoading]);

  return {
    ...query,
    data: query.data || offlineData,
    isOfflineData: !query.data && !!offlineData,
  };
}

/**
 * Hook: useCacheMetadata
 * Get cache age and stats
 */
export function useCacheMetadata() {
  const [metadata, setMetadata] = useState(null);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const data = await getCacheMetadata();
        setMetadata(data);
      } catch (err) {
        console.error('Failed to load cache metadata:', err);
      }
    };

    loadMetadata();
  }, []);

  return metadata;
}

/**
 * Helper: Search offline parts by query
 */
export async function searchOfflineParts(query) {
  return searchCachedParts(query);
}

/**
 * Helper: Search offline manuals by query
 */
export async function searchOfflineManuals(query) {
  return searchCachedManuals(query);
}