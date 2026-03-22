// Offline pending action queue
// Actions are stored in localStorage and replayed when connectivity is restored.

const QUEUE_KEY = 'fse_fieldpro_pending_queue';

export function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function enqueue(action) {
  // action: { id, type, payload, createdAt }
  const queue = getQueue();
  queue.push({
    id: Date.now() + Math.random().toString(36).slice(2),
    createdAt: new Date().toISOString(),
    retries: 0,
    lastError: null,
    lastAttempt: null,
    ...action,
  });
  saveQueue(queue);
}

export function dequeue(id) {
  const queue = getQueue().filter(a => a.id !== id);
  saveQueue(queue);
}

export function markFailed(id, errorMessage) {
  const queue = getQueue().map(a =>
    a.id === id
      ? { ...a, retries: (a.retries || 0) + 1, lastError: errorMessage, lastAttempt: new Date().toISOString() }
      : a
  );
  saveQueue(queue);
}

export function markConflict(id, localData, serverData) {
  const queue = getQueue().map(a =>
    a.id === id
      ? { ...a, conflict: { local: localData, server: serverData }, hasConflict: true }
      : a
  );
  saveQueue(queue);
}

export function resolveConflict(id, resolution) {
  const queue = getQueue().map(a =>
    a.id === id
      ? { ...a, conflict: null, hasConflict: false, resolution }
      : a
  );
  saveQueue(queue);
}

export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

// ACTION TYPES
export const ACTION_TYPES = {
  CREATE_MANUAL: 'CREATE_MANUAL',
  CREATE_PART: 'CREATE_PART',
  UPDATE_MANUAL: 'UPDATE_MANUAL',
  UPDATE_PART: 'UPDATE_PART',
};