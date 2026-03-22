/**
 * IndexedDB Cache
 * Stores complete Part and Manual data for offline access
 */

const DB_NAME = 'fse-fieldpro-db';
const DB_VERSION = 1;
const STORES = {
  parts: 'parts',
  manuals: 'manuals',
  folders: 'folders',
  metadata: 'metadata',
};

let db = null;

export async function initIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      console.log('[IDB] IndexedDB initialized');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const newDb = event.target.result;

      // Create object stores if they don't exist
      if (!newDb.objectStoreNames.contains(STORES.parts)) {
        const partsStore = newDb.createObjectStore(STORES.parts, { keyPath: 'id' });
        partsStore.createIndex('brand', 'brand', { unique: false });
        partsStore.createIndex('pump_model', 'pump_model', { unique: false });
        partsStore.createIndex('system_area', 'system_area', { unique: false });
        partsStore.createIndex('component_type', 'component_type', { unique: false });
      }

      if (!newDb.objectStoreNames.contains(STORES.manuals)) {
        const manualsStore = newDb.createObjectStore(STORES.manuals, { keyPath: 'id' });
        manualsStore.createIndex('manufacturer', 'manufacturer', { unique: false });
        manualsStore.createIndex('model', 'model', { unique: false });
        manualsStore.createIndex('folder_id', 'folder_id', { unique: false });
      }

      if (!newDb.objectStoreNames.contains(STORES.folders)) {
        newDb.createObjectStore(STORES.folders, { keyPath: 'id' });
      }

      if (!newDb.objectStoreNames.contains(STORES.metadata)) {
        newDb.createObjectStore(STORES.metadata, { keyPath: 'key' });
      }

      console.log('[IDB] Object stores created');
    };
  });
}

// Parts
export async function cacheParts(parts) {
  if (!db) await initIndexedDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.parts], 'readwrite');
    const store = tx.objectStore(STORES.parts);

    // Clear old data
    store.clear();

    // Add all parts
    parts.forEach((part) => {
      store.add(part);
    });

    // Update metadata
    const metaTx = db.transaction([STORES.metadata], 'readwrite');
    metaTx.objectStore(STORES.metadata).put({
      key: 'parts_cached_at',
      value: Date.now(),
      count: parts.length,
    });

    tx.oncomplete = () => {
      console.log(`[IDB] Cached ${parts.length} parts`);
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCachedParts() {
  if (!db) await initIndexedDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.parts], 'readonly');
    const request = tx.objectStore(STORES.parts).getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function searchCachedParts(query) {
  const cached = await getCachedParts();
  const q = query.toLowerCase();

  return cached.filter((part) => {
    return (
      part.part_number?.toLowerCase().includes(q) ||
      part.description?.toLowerCase().includes(q) ||
      part.brand?.toLowerCase().includes(q) ||
      part.pump_model?.toLowerCase().includes(q) ||
      part.system_area?.toLowerCase().includes(q)
    );
  });
}

// Manuals
export async function cacheManuals(manuals) {
  if (!db) await initIndexedDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.manuals], 'readwrite');
    const store = tx.objectStore(STORES.manuals);

    store.clear();
    manuals.forEach((manual) => {
      store.add(manual);
    });

    const metaTx = db.transaction([STORES.metadata], 'readwrite');
    metaTx.objectStore(STORES.metadata).put({
      key: 'manuals_cached_at',
      value: Date.now(),
      count: manuals.length,
    });

    tx.oncomplete = () => {
      console.log(`[IDB] Cached ${manuals.length} manuals`);
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCachedManuals() {
  if (!db) await initIndexedDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.manuals], 'readonly');
    const request = tx.objectStore(STORES.manuals).getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function searchCachedManuals(query) {
  const cached = await getCachedManuals();
  const q = query.toLowerCase();

  return cached.filter((manual) => {
    return (
      manual.title?.toLowerCase().includes(q) ||
      manual.manufacturer?.toLowerCase().includes(q) ||
      manual.model?.toLowerCase().includes(q) ||
      manual.manual_text?.toLowerCase().includes(q)
    );
  });
}

// Folders
export async function cacheFolders(folders) {
  if (!db) await initIndexedDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.folders], 'readwrite');
    const store = tx.objectStore(STORES.folders);

    store.clear();
    folders.forEach((folder) => {
      store.add(folder);
    });

    tx.oncomplete = () => {
      console.log(`[IDB] Cached ${folders.length} folders`);
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCachedFolders() {
  if (!db) await initIndexedDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.folders], 'readonly');
    const request = tx.objectStore(STORES.folders).getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Metadata
export async function getCacheMetadata() {
  if (!db) await initIndexedDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.metadata], 'readonly');
    const request = tx.objectStore(STORES.metadata).getAll();

    request.onsuccess = () => {
      const metadata = {};
      request.result.forEach((item) => {
        metadata[item.key] = item.value;
      });
      resolve(metadata);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function clearAllCache() {
  if (!db) await initIndexedDB();

  return new Promise((resolve, reject) => {
    const storeNames = [STORES.parts, STORES.manuals, STORES.folders, STORES.metadata];
    const tx = db.transaction(storeNames, 'readwrite');

    storeNames.forEach((store) => {
      tx.objectStore(store).clear();
    });

    tx.oncomplete = () => {
      console.log('[IDB] All caches cleared');
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}