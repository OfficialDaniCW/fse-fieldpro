import { useEffect, useCallback, useRef } from 'react';
import { getQueue, dequeue, markFailed, markConflict, resolveConflict } from './pendingQueue';
import { base44 } from '@/api/base44Client';
import { ACTION_TYPES } from './pendingQueue';
import { toast } from 'sonner';

// Replays a single queued action against the live API
export async function replayAction(action) {
  if (action.type === ACTION_TYPES.CREATE_MANUAL) {
    await base44.entities.Manual.create(action.payload);
  } else if (action.type === ACTION_TYPES.CREATE_PART) {
    await base44.entities.Part.create(action.payload);
  } else if (action.type === ACTION_TYPES.UPDATE_MANUAL) {
    await base44.entities.Manual.update(action.payload.id, action.payload.data);
  } else if (action.type === ACTION_TYPES.UPDATE_PART) {
    await base44.entities.Part.update(action.payload.id, action.payload.data);
  } else {
    throw new Error(`Unknown action type: ${action.type}`);
  }
}

// Checks for conflicts by comparing local vs server version
export async function checkForConflict(action) {
  try {
    const entityType = action.type.startsWith('MANUAL') ? 'Manual' : 'Part';
    const entity = await base44.entities[entityType].get(action.payload.id);
    
    if (entity && action.payload.data) {
      // Check if any fields differ
      const hasConflict = Object.entries(action.payload.data).some(
        ([key, val]) => entity[key] !== val
      );
      
      if (hasConflict) {
        return { hasConflict: true, serverData: entity };
      }
    }
  } catch (err) {
    // Entity not found or other error - no conflict
  }
  return { hasConflict: false };
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
        // Check for conflicts before replaying UPDATE actions
        if (action.type.startsWith('UPDATE_')) {
          const { hasConflict, serverData } = await checkForConflict(action);
          if (hasConflict) {
            markConflict(action.id, action.payload.data, serverData);
            continue; // Skip this action, let user resolve
          }
        }
        
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