import { doc, setDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '../firebase'; // Initialize app
import { db, auth } from '../firebase';
import { getEnvValue } from '../utils/env';

// Public VAPID key generated from Firebase Console
const VAPID_KEY = getEnvValue('VITE_FIREBASE_VAPID_KEY') || 'BEl5N6-Sg6VfP8m_B-pG9qVfR8WfH7YgP8XqH7M7D8h_A7_N6jS6F7e8J9wX_H7fK8g9J6G7e8L9wH_W8g_T8Y8';

export interface MessagePayload {
  data?: Record<string, string>;
  notification?: {
    title?: string;
    body?: string;
    [key: string]: any;
  };
}

export interface DeviceToken {
  token: string;
  createdAt: any;
  lastUpdated: any;
  deviceType: 'mobile' | 'desktop';
  userAgent: string;
  platform: string;
}

export interface NotificationPreferences {
  deadlines: boolean;
  habits: boolean;
  briefings: boolean;
  system: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  deadlines: true,
  habits: true,
  briefings: true,
  system: true,
};

// Safe lazy loading helper for firebase/messaging
const getFirebaseMessagingModule = async () => {
  try {
    return await import('firebase/messaging');
  } catch (err) {
    console.warn('Failed to dynamically import firebase/messaging:', err);
    return null;
  }
};

// Pre-flight check to verify if browser messaging components are securely accessible
export const isSafeToAccessMessaging = (): boolean => {
  try {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }

    // Cross-origin safe iframe detection
    let isIframe = false;
    try {
      isIframe = window.self !== window.top;
    } catch (_) {
      isIframe = true;
    }
    if (isIframe) {
      return false;
    }

    // Accessing or checking properties like 'serviceWorker' or 'indexedDB' can throw a SecurityError inside sandboxed iframes
    const hasServiceWorker = 'serviceWorker' in navigator && navigator.serviceWorker !== undefined;
    const hasNotification = 'Notification' in window && window.Notification !== undefined;
    const hasIndexedDB = 'indexedDB' in window && window.indexedDB !== undefined;
    return !!(hasServiceWorker && hasNotification && hasIndexedDB);
  } catch (err) {
    console.warn('Browser messaging components are not securely accessible (iframe/sandbox restriction):', err);
    return false;
  }
};

// Check if browser supports push notifications
export const checkNotificationSupport = async (): Promise<boolean> => {
  if (!isSafeToAccessMessaging()) {
    return false;
  }
  try {
    const messagingModule = await getFirebaseMessagingModule();
    if (!messagingModule) return false;
    const supported = await messagingModule.isSupported();
    return supported;
  } catch (err) {
    console.warn('FCM isSupported check failed (likely due to sandbox/iframe restrictions):', err);
    return false;
  }
};

// Safe helper to get notification permission without throwing security errors in iframes
export const getSafeNotificationPermission = (): NotificationPermission => {
  try {
    if (typeof window !== 'undefined') {
      let isIframe = false;
      try {
        isIframe = window.self !== window.top;
      } catch (_) {
        isIframe = true;
      }
      if (isIframe) return 'default';

      if ('Notification' in window && window.Notification) {
        return Notification.permission;
      }
    }
  } catch (err) {
    console.warn('Failed to safely read Notification.permission in iframe:', err);
  }
  return 'default';
};

// Get user's notification preferences
export const getNotificationPreferences = async (userId: string): Promise<NotificationPreferences> => {
  try {
    const prefRef = doc(db, 'users', userId, 'notification_preferences', 'settings');
    const snap = await getDoc(prefRef);
    if (snap.exists()) {
      return { ...DEFAULT_PREFERENCES, ...snap.data() } as NotificationPreferences;
    }
  } catch (err: any) {
    if (err?.code !== 'unavailable' && !err?.message?.includes('offline')) {
      console.warn('Failed to load notification preferences:', err);
    }
  }
  return DEFAULT_PREFERENCES;
};

// Update user's notification preferences
export const updateNotificationPreferences = async (userId: string, prefs: Partial<NotificationPreferences>): Promise<void> => {
  try {
    const prefRef = doc(db, 'users', userId, 'notification_preferences', 'settings');
    await setDoc(prefRef, prefs, { merge: true });
  } catch (err) {
    console.error('Failed to update notification preferences:', err);
    throw err;
  }
};

// Request permission and register token
export const requestNotificationPermission = async (userId: string, silent: boolean = false): Promise<string | null> => {
  // Check if we are running in an iframe
  try {
    if (window.self !== window.top) {
      if (!silent) console.warn("Push notifications are disabled inside the preview window. Please open the app in a new tab to enable notifications.");
      return null;
    }
  } catch (e) {
    // Cross-origin restriction implies we're in an iframe
    if (!silent) console.warn("Push notifications are disabled inside the preview window. Please open the app in a new tab to enable notifications.");
    return null;
  }

  if (!isSafeToAccessMessaging()) {
    if (!silent) console.warn("Push notifications are not safely accessible in this environment. Please open in a new tab.");
    return null;
  }

  try {
    // 1. Request permission FIRST to preserve the user gesture (crucial for Chrome)
    let permission: NotificationPermission = 'default';
    if ('Notification' in window && window.Notification && typeof Notification.requestPermission === 'function') {
      // If we are calling this silently (e.g. on load) and it's not already granted, don't trigger the prompt automatically.
      // Browsers block automatic prompts anyway, so we only request if it's not silent OR it's already granted.
      const currentPermission = getSafeNotificationPermission();
      if (currentPermission === 'granted' || !silent) {
        permission = await Notification.requestPermission();
      } else {
        permission = currentPermission;
      }
    }
    
    if (permission !== 'granted') {
      if (!silent && permission === 'denied') {
        console.warn('Notification permission was denied.');
      }
      return null;
    }

    // 2. Check browser support after we get permission
    const isSupportedBrowser = await checkNotificationSupport();
    if (!isSupportedBrowser) {
      if (!silent) console.warn('Push notifications are not supported in this browser or Firebase is blocked.');
      return null;
    }

    // 3. Get the FCM registration token
    const messagingModule = await getFirebaseMessagingModule();
    if (!messagingModule) return null;

    const messaging = messagingModule.getMessaging(app);
    let registration;
    try {
      if ('serviceWorker' in navigator) {
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        await navigator.serviceWorker.ready;
      }
    } catch (swError) {
      console.warn("Service worker registration failed for FCM: ", swError);
    }
    
    const token = await messagingModule.getToken(messaging, { 
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });
    
    if (token) {
      console.log('FCM Registration Token received:', token);
      
      // Store token securely under user profile in Firestore
      await saveFCMToken(userId, token);
      return token;
    } else {
      console.warn('No registration token available. Request permission inside service worker or verify configuration.');
      return null;
    }
  } catch (err) {
    console.error('An error occurred while requesting notification permission:', err);
    return null;
  }
};

// Save token in Firestore (stores multiple devices securely)
export const saveFCMToken = async (userId: string, token: string): Promise<void> => {
  try {
    const tokenRef = doc(db, 'users', userId, 'fcm_tokens', token);
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    
    const deviceData: DeviceToken = {
      token,
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
      deviceType: isMobile ? 'mobile' : 'desktop',
      userAgent: navigator.userAgent,
      platform: navigator.platform || 'Unknown'
    };

    await setDoc(tokenRef, deviceData, { merge: true });
    console.log('FCM Token stored in Firestore for user:', userId);
  } catch (err) {
    console.error('Failed to store FCM Token in Firestore:', err);
  }
};

// Delete a specific token from Firestore (on logout, or when a token is invalid)
export const deleteFCMToken = async (userId: string, token: string): Promise<void> => {
  try {
    const tokenRef = doc(db, 'users', userId, 'fcm_tokens', token);
    await deleteDoc(tokenRef);
    console.log('FCM Token removed from Firestore:', token);
  } catch (err) {
    console.error('Failed to delete FCM Token from Firestore:', err);
  }
};

// Set up the foreground notification listener
export const setupForegroundListener = async (
  onNotificationReceived: (payload: MessagePayload) => void
): Promise<(() => void) | null> => {
  const isSupportedBrowser = await checkNotificationSupport();
  if (!isSupportedBrowser) return null;

  try {
    const messagingModule = await getFirebaseMessagingModule();
    if (!messagingModule) return null;

    const messaging = messagingModule.getMessaging(app);
    const unsubscribe = messagingModule.onMessage(messaging, (payload) => {
      console.log('Received foreground message:', payload);
      onNotificationReceived(payload);
    });
    return unsubscribe;
  } catch (err) {
    console.error('Error setting up foreground message listener:', err);
    return null;
  }
};
