// Service Worker for DeadlineAI Push Notifications

self.addEventListener('push', (event) => {
  try {
    const data = event.data ? event.data.json() : {
      title: '⚡ DeadlineAI',
      body: 'You have an approaching deadline!',
      actionUrl: '/tasks'
    };

    const options = {
      body: data.body,
      icon: '/favicon.svg',
      badge: '/badge.png',
      tag: data.tag || 'deadlineai-push-tag',
      requireInteraction: data.urgent || false,
      actions: data.actions || [
        { action: 'view', title: 'View Task' },
        { action: 'dismiss', title: 'Dismiss' }
      ],
      data: {
        url: data.actionUrl || '/tasks'
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title || '⚡ DeadlineAI', options)
    );
  } catch (err) {
    console.error('Failed to parse push event data or show native notification:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data ? event.notification.data.url : '/tasks';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If there's an active tab, focus it and redirect
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'NAVIGATE', url: urlToOpen });
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
