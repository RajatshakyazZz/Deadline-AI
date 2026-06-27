import { getSafeNotificationPermission, isSafeToAccessMessaging } from '../services/messaging';

// Helper to register the Service Worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isSafeToAccessMessaging() || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    console.log('Service Worker registered with scope:', registration.scope);
    return registration;
  } catch (err) {
    console.warn('Service Worker registration failed:', err);
    return null;
  }
}

// Triggers a native local push notification if supported
export function sendPushNotification(options: {
  title: string;
  body: string;
  tag?: string;
  urgent?: boolean;
  actionUrl?: string;
}) {
  try {
    if (!isSafeToAccessMessaging()) return;

    const permission = getSafeNotificationPermission();
    if (permission !== 'granted') return;

    // Use service worker notification first, falls back to new Notification
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(options.title, {
          body: options.body,
          icon: '/favicon.svg',
          tag: options.tag || 'deadline-monitor-alert',
          requireInteraction: options.urgent || false,
          data: { url: options.actionUrl || '/tasks' }
        });
      }).catch(() => {
        // Fallback
        new Notification(options.title, {
          body: options.body,
          icon: '/favicon.svg',
          tag: options.tag || 'deadline-monitor-alert',
        });
      });
    } else {
      new Notification(options.title, {
        body: options.body,
        icon: '/favicon.svg',
        tag: options.tag || 'deadline-monitor-alert',
      });
    }
  } catch (err) {
    console.warn('Native push notification display failed:', err);
  }
}
