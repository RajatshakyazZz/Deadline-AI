import { getMessaging, getToken, onMessage, isSupported, MessagePayload } from 'firebase/messaging';
import { doc, setDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '../firebase'; // Initialize app
import { db, auth } from '../firebase';

// Public VAPID key generated from Firebase Console (or fallback if not configured in .env)
const VAPID_KEY = (import.meta as any).env?.VITE_FIREBASE_VAPID_KEY || 'BEl5N6-Sg6VfP8m_B-pG9qVfR8WfH7YgP8XqH7M7D8h_A7_N6jS6F7e8J9wX_H7fK8g9J6G7e8L9wH_W8g_T8Y8';

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

// Check if browser supports push notifications
export const checkNotificationSupport = async (): Promise<boolean> => {
  try {
    if (typeof window === 'undefined') {
      return false;
    }
    // Accessing 'serviceWorker' or 'Notification' in restricted iframe can throw "The operation is insecure"
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
      return false;
    }
    const supported = await isSupported();
    return supported;
  } catch (err) {
    console.warn('FCM isSupported check failed (likely due to sandbox/iframe restrictions):', err);
    return false;
  }
};

// Safe helper to get notification permission without throwing security errors in iframes
export const getSafeNotificationPermission = (): NotificationPermission => {
  try {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
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
  } catch (err) {
    console.error('Failed to load notification preferences:', err);
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
export const requestNotificationPermission = async (userId: string): Promise<string | null> => {
  const isSupportedBrowser = await checkNotificationSupport();
  if (!isSupportedBrowser) {
    console.log('Push notifications are not supported in this browser.');
    return null;
  }

  try {
    // Request permission from user safely
    let permission: NotificationPermission = 'default';
    if ('Notification' in window && typeof Notification.requestPermission === 'function') {
      permission = await Notification.requestPermission();
    }
    if (permission !== 'granted') {
      console.log('Notification permission was denied.');
      return null;
    }

    // Get the FCM registration token
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    
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
    const messaging = getMessaging(app);
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Received foreground message:', payload);
      onNotificationReceived(payload);
    });
    return unsubscribe;
  } catch (err) {
    console.error('Error setting up foreground message listener:', err);
    return null;
  }
};
