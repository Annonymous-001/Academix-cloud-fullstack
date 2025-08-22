// Service Worker for handling push notifications
// Version: 1.1.0

const CACHE_NAME = 'school-notifications-v1';
const NOTIFICATION_URL = '/';

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clean up old caches if any
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => caches.delete(cacheName))
        );
      })
    ])
  );
});

self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  // Default notification data
  let notificationData = {
    title: '🎓 School Notification',
    body: 'You have a new update from your school',
    icon: '/school_logo.png',
    badge: '/school_logo.png',
    tag: 'school-notification',
    requireInteraction: true, // Keep notification visible until user interacts
    silent: false,
    timestamp: Date.now(),
    actions: [
      {
        action: 'view',
        title: '👀 View',
        icon: '/view.png'
      },
      {
        action: 'dismiss',
        title: '❌ Dismiss',
        icon: '/close.png'
      }
    ]
  };

  // Parse notification data if available
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('Parsed notification data:', data);
      
      notificationData = {
        ...notificationData,
        title: data.title || notificationData.title,
        body: data.body || data.message || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || `notification-${Date.now()}`, // Unique tag for each notification
        requireInteraction: data.priority === 'HIGH' || data.priority === 'URGENT',
        data: {
          ...data,
          url: data.url || NOTIFICATION_URL,
          timestamp: Date.now()
        }
      };

      // Add priority-based styling
      if (data.priority === 'URGENT') {
        notificationData.requireInteraction = true;
        notificationData.silent = false;
        notificationData.title = `🚨 URGENT: ${notificationData.title}`;
      } else if (data.priority === 'HIGH') {
        notificationData.requireInteraction = true;
        notificationData.title = `⚠️ ${notificationData.title}`;
      }

      // Add type-based icons
      if (data.type) {
        switch (data.type) {
          case 'EXAM':
            notificationData.icon = '/exam.png';
            notificationData.title = `📝 ${notificationData.title}`;
            break;
          case 'ASSIGNMENT':
            notificationData.icon = '/assignment.png';
            notificationData.title = `📚 ${notificationData.title}`;
            break;
          case 'ANNOUNCEMENT':
            notificationData.icon = '/announcement.png';
            notificationData.title = `📢 ${notificationData.title}`;
            break;
          case 'EVENT':
            notificationData.icon = '/calendar.png';
            notificationData.title = `📅 ${notificationData.title}`;
            break;
          case 'FEE_DUE':
            notificationData.icon = '/payments.png';
            notificationData.title = `💰 ${notificationData.title}`;
            break;
          case 'ATTENDANCE':
            notificationData.icon = '/attendance.png';
            notificationData.title = `✅ ${notificationData.title}`;
            break;
          default:
            notificationData.icon = '/school_logo.png';
        }
      }
    } catch (error) {
      console.error('Error parsing push notification data:', error);
    }
  }

  // Show the notification
  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      silent: notificationData.silent,
      timestamp: notificationData.timestamp,
      actions: notificationData.actions,
      data: notificationData.data,
      // Additional options for better UX
      dir: 'ltr',
      lang: 'en',
      renotify: true,
      vibrate: notificationData.data?.priority === 'URGENT' ? [200, 100, 200] : [100]
    }
  );

  event.waitUntil(promiseChain);
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  console.log('Action:', event.action);
  console.log('Notification data:', event.notification.data);

  event.notification.close();

  // Handle dismiss action
  if (event.action === 'dismiss') {
    console.log('Notification dismissed by user');
    return;
  }

  // Determine URL to open
  let urlToOpen = '/';
  const notificationData = event.notification.data;
  
  if (notificationData) {
    // Try to determine the best URL based on notification type and data
    if (notificationData.url) {
      urlToOpen = notificationData.url;
    } else if (notificationData.type) {
      switch (notificationData.type) {
        case 'EXAM':
          urlToOpen = '/list/exams';
          break;
        case 'ASSIGNMENT':
          urlToOpen = '/list/assignments';
          break;
        case 'ANNOUNCEMENT':
          urlToOpen = '/list/announcements';
          break;
        case 'EVENT':
          urlToOpen = '/list/events';
          break;
        case 'FEE_DUE':
        case 'FEE_PAID':
          urlToOpen = '/list/fees';
          break;
        case 'ATTENDANCE':
          urlToOpen = '/list/attendence';
          break;
        case 'RESULT':
          urlToOpen = '/list/results';
          break;
        default:
          urlToOpen = '/';
      }
    }
    
    // If we have class information, try to navigate to class-specific page
    if (notificationData.relatedClassId) {
      urlToOpen += `?classId=${notificationData.relatedClassId}`;
    }
  }

  console.log('Opening URL:', urlToOpen);

  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    console.log('Found window clients:', windowClients.length);
    
    // Check if there's already a window/tab open
    let targetClient = null;
    
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      console.log('Client URL:', client.url);
      
      // Look for any window from the same origin
      if (client.url.includes(self.location.origin)) {
        targetClient = client;
        break;
      }
    }

    if (targetClient && 'focus' in targetClient) {
      console.log('Focusing existing window and navigating');
      // Focus the existing window and navigate to the target URL
      return targetClient.focus().then(() => {
        // Send a message to the client to navigate to the URL
        return targetClient.postMessage({
          type: 'NAVIGATE',
          url: urlToOpen,
          notificationData: notificationData
        });
      });
    }

    // If no window/tab is open, open a new one
    if (clients.openWindow) {
      console.log('Opening new window');
      return clients.openWindow(urlToOpen);
    }
    
    console.log('Could not open window - clients.openWindow not available');
  }).catch(error => {
    console.error('Error handling notification click:', error);
  });

  event.waitUntil(promiseChain);
});

self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
  
  // Track notification dismissals for analytics if needed
  const notificationData = event.notification.data;
  if (notificationData) {
    console.log('Notification dismissed:', {
      type: notificationData.type,
      title: event.notification.title,
      timestamp: Date.now()
    });
  }
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Handle manual notification requests from testing
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    console.log('Showing manual notification:', event.data.data);
    self.registration.showNotification(event.data.data.title, {
      body: event.data.data.body,
      icon: event.data.data.icon || '/school_logo.png',
      badge: event.data.data.badge || '/school_logo.png',
      tag: event.data.data.tag || `manual-${Date.now()}`,
      requireInteraction: event.data.data.requireInteraction || false,
      actions: event.data.data.actions || [],
      data: event.data.data.data || {},
      dir: 'ltr',
      lang: 'en',
      renotify: true,
      vibrate: [200, 100, 200]
    });
  }
});

// Handle sync events for offline functionality
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'notification-sync') {
    // Handle background sync for notifications
    event.waitUntil(handleNotificationSync());
  }
});

// Function to handle background sync
async function handleNotificationSync() {
  try {
    console.log('Handling notification sync...');
    // This could be used to sync pending notifications when online
    // For now, we'll just log it
  } catch (error) {
    console.error('Error during notification sync:', error);
  }
}
