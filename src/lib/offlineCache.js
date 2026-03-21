const CACHE_KEY = 'fse_fieldpro_query_cache';
const CACHE_VERSION = 1;
// Only persist these query keys (the heavy datasets)
const PERSIST_KEYS = ['parts', 'manuals'];

export function persistCache(queryClient) {
  try {
    const queries = queryClient.getQueryCache().getAll();
    const toSave = queries
      .filter(q => {
        const key = q.queryKey[0];
        return PERSIST_KEYS.includes(key) && q.state.status === 'success';
      })
      .map(q => ({
        queryKey: q.queryKey,
        data: q.state.data,
        dataUpdatedAt: q.state.dataUpdatedAt,
      }));

    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ version: CACHE_VERSION, queries: toSave, savedAt: Date.now() })
    );
  } catch (_) {
    // localStorage may be full or unavailable — silently ignore
  }
}

export function loadCache(queryClient) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return;

    const { version, queries } = JSON.parse(raw);
    if (version !== CACHE_VERSION) return;

    queries.forEach(({ queryKey, data, dataUpdatedAt }) => {
      // Only restore if TanStack doesn't already have fresh data
      const existing = queryClient.getQueryData(queryKey);
      if (!existing) {
        queryClient.setQueryData(queryKey, data, { updatedAt: dataUpdatedAt });
      }
    });
  } catch (_) {
    // Corrupt cache — silently ignore
  }
}

export function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (_) {}
}