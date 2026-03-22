/**
 * Service Worker Manager
 * Handles SW registration, offline detection, and cache strategies
 */

let swRegistration = null;

export async function registerServiceWorker() {
  // Service worker registration disabled due to platform redirect issues
  console.log('[SW] Service worker registration disabled');
  return null;
  
  /* Disabled registration
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service Workers not supported in this browser');
    return null;
  }

  try {
    swRegistration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none', // Always check for SW updates
    });*/

    /*console.log('[SW] Registered successfully:', swRegistration);

    // Listen for updates
    swRegistration.addEventListener('updatefound', () => {
      const newWorker = swRegistration.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New SW ready, notify user
          console.log('[SW] New version available');
          // Dispatch custom event that components can listen to
          window.dispatchEvent(new CustomEvent('sw-update-available'));
        }
      });
    });

    // Check for updates every 60 seconds
    setInterval(() => {
      swRegistration?.update();
    }, 60000);

    return swRegistration;
  } catch (error) {
    console.error('[SW] Registration failed:', error);
    return null;
  }*/
}

export function skipWaitingServiceWorker() {
  if (swRegistration?.waiting) {
    swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  }
}

export function clearServiceWorkerCache() {
  if (swRegistration?.active) {
    swRegistration.active.postMessage({ type: 'CLEAR_CACHE' });
  }
}

export function isOnline() {
  return navigator.onLine;
}

export function isServiceWorkerAvailable() {
  return !!swRegistration?.active;
}

// Listen for online/offline events
export function onOnlineStatusChange(callback) {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}