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

export function enqueue(action) {
  // action: { id, type, payload, createdAt }
  const queue = getQueue();
  queue.push({
    id: Date.now() + Math.random().toString(36).slice(2),
    createdAt: new Date().toISOString(),
    ...action,
  });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function dequeue(id) {
  const queue = getQueue().filter(a => a.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

// ACTION TYPES
export const ACTION_TYPES = {
  CREATE_MANUAL: 'CREATE_MANUAL',
};