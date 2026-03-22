import { useEffect, useCallback, useRef } from 'react';
import { getQueue, dequeue, markFailed } from './pendingQueue';
import { base44 } from '@/api/base44Client';
import { ACTION_TYPES } from './pendingQueue';
import { toast } from 'sonner';

// Replays a single queued action against the live API
export async function replayAction(action) {
  if (action.type === ACTION_TYPES.CREATE_MANUAL) {
    await base44.entities.Manual.create(action.payload);
  } else {
    throw new Error(`Unknown action type: ${action.type}`);
  }
}

export default function useSyncManager({ onSynced } = {}) {
  const isSyncing = useRef(false);

  const runSync = useCallback(async () => {
    if (isSyncing.current || !navigator.onLine) return;
    const queue = getQueue();
    if (queue.length === 0) return;

    isSyncing.current = true;
    let successCount = 0;
    let failCount = 0;

    for (const action of queue) {
      try {
        await replayAction(action);
        dequeue(action.id);
        successCount++;
      } catch (err) {
        markFailed(action.id, err?.message || 'Unknown error');
        failCount++;
      }
    }

    isSyncing.current = false;

    if (successCount > 0) {
      toast.success(`Synced ${successCount} offline action${successCount > 1 ? 's' : ''} to server.`);
      onSynced?.();
    }
    if (failCount > 0) {
      toast.error(`${failCount} action${failCount > 1 ? 's' : ''} failed to sync. Check Sync Manager.`);
    }
  }, [onSynced]);

  useEffect(() => {
    runSync();
    window.addEventListener('online', runSync);
    return () => window.removeEventListener('online', runSync);
  }, [runSync]);

  return { runSync };
}