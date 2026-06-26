// Firebase Cloud Messaging Background Service Worker
// Imports the Firebase SDK compat versions to work securely within the Service Worker context
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

// Initialize Firebase App in the Service Worker.
// The config parameters must match the main app configuration.
firebase.initializeApp({
  apiKey: "AIzaSyB29m4hDsHKW2kKcZJjibGBRIINURtftXg",
  authDomain: "isometric-catalyst-dhh41.firebaseapp.com",
  projectId: "isometric-catalyst-dhh41",
  storageBucket: "isometric-catalyst-dhh41.firebasestorage.app",
  messagingSenderId: "462209499148",
  appId: "1:462209499148:web:1dc2cff80a49b637b8ee29"
});

const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const title = payload.notification?.title || payload.data?.title || 'DeadlineAI Alert';
  const body = payload.notification?.body || payload.data?.body || 'You have an important update.';
  const icon = payload.notification?.image || payload.data?.icon || '/favicon.svg';
  
  // Custom action URL (e.g., /tasks, /habits, etc.)
  const actionPath = payload.data?.click_action || payload.notification?.click_action || '/';

  const notificationOptions = {
    body: body,
    icon: icon,
    badge: '/favicon.svg',
    data: {
      url: actionPath
    },
    tag: payload.data?.tag || 'deadlineai-notification',
    renotify: true
  };

  return self.registration.showNotification(title, notificationOptions);
});

// Click action handler
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);
  
  // Close the notification
  event.notification.close();

  // Route URL (or default to root)
  const relativeUrl = event.notification.data?.url || '/';
  
  // Create absolute URL based on where the service worker is hosted
  const targetUrl = new URL(relativeUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // If there's an open window already, focus it and navigate
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no matching window is open, navigate any open client under this origin
        if (windowClients.length > 0) {
          const firstClient = windowClients[0];
          if ('navigate' in firstClient) {
            firstClient.navigate(targetUrl);
          }
          if ('focus' in firstClient) {
            return firstClient.focus();
          }
        }
        
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
