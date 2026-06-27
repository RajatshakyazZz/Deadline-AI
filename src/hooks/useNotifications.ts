import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc, 
  updateDoc, 
  writeBatch, 
  deleteDoc, 
  addDoc, 
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { useApp } from '../components/AppContext';
import { safeStorage } from '../utils/storage';

export interface DBNotification {
  id: string;
  type: 'crisis' | 'warning' | 'complete' | 'ai' | 'calendar' | 'focus' | 'streak' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  taskId?: string;
}

export const useNotifications = () => {
  const { user, isDemo } = useApp();
  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Sync real-time notifications
  useEffect(() => {
    if (!user && !isDemo) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    if (isDemo) {
      // Local storage sync for demo mode
      const guestUid = user?.uid || 'guest';
      const cached = safeStorage.getItem(`deadlineai_demo_notifications_${guestUid}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setNotifications(parsed);
          setUnreadCount(parsed.filter((n: DBNotification) => !n.read).length);
        } catch (_) {}
      } else {
        // Create initial default mock notifications for demonstration
        const initial: DBNotification[] = [
          {
            id: 'mock-notif-1',
            type: 'ai',
            title: '🤖 AI Briefing Ready',
            message: 'Your morning daily tactical plan has been compiled.',
            read: false,
            createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            actionUrl: '/briefing'
          },
          {
            id: 'mock-notif-2',
            type: 'warning',
            title: '⚠️ 12h Deadline Warning',
            message: 'Your task "Deploy Production Core Server" is approaching its deadline.',
            read: false,
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            actionUrl: '/tasks'
          },
          {
            id: 'mock-notif-3',
            type: 'complete',
            title: '✅ Task Completed Successfully',
            message: 'Congratulations on beating your timeline goals!',
            read: true,
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            actionUrl: '/tasks'
          }
        ];
        setNotifications(initial);
        setUnreadCount(2);
        safeStorage.setItem(`deadlineai_demo_notifications_${guestUid}`, JSON.stringify(initial));
      }
      return;
    }

    // Real firestore query: Max 50 notifications
    const notifCollectionRef = collection(db, 'users', user.uid, 'notifications');
    const q = query(notifCollectionRef, orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: DBNotification[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as DBNotification);
      });
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.read).length);

      // Clean up older than 7 days automatically (runs in background on snapshot load)
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      snapshot.forEach(async (d) => {
        const data = d.data();
        const dateMs = new Date(data.createdAt).getTime();
        if (dateMs < sevenDaysAgo) {
          try {
            await deleteDoc(doc(db, 'users', user.uid, 'notifications', d.id));
          } catch (_) {}
        }
      });
    }, (err) => {
      console.warn('Firestore notifications sync failed, using local offline fallback:', err);
      const cached = safeStorage.getItem(`deadlineai_notifications_${user.uid}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setNotifications(parsed);
          setUnreadCount(parsed.filter((n: DBNotification) => !n.read).length);
        } catch (_) {}
      }
    });

    return () => unsubscribe();
  }, [user, isDemo]);

  // Sync to local storage for offline support
  useEffect(() => {
    if (user && !isDemo && notifications.length > 0) {
      safeStorage.setItem(`deadlineai_notifications_${user.uid}`, JSON.stringify(notifications));
    }
  }, [user, isDemo, notifications]);

  const addNotification = useCallback(async (notif: Omit<DBNotification, 'id' | 'createdAt' | 'read'>) => {
    if (!user && !isDemo) return;

    const newNotif: Omit<DBNotification, 'id'> = {
      ...notif,
      read: false,
      createdAt: new Date().toISOString()
    };

    if (isDemo) {
      const guestUid = user?.uid || 'guest';
      setNotifications(prev => {
        const updated = [{ id: Math.random().toString(36).substring(2, 9), ...newNotif } as DBNotification, ...prev].slice(0, 50);
        safeStorage.setItem(`deadlineai_demo_notifications_${guestUid}`, JSON.stringify(updated));
        return updated;
      });
      return;
    }

    try {
      const notifRef = collection(db, 'users', user.uid, 'notifications');
      await addDoc(notifRef, newNotif);
    } catch (err) {
      console.warn('Failed to add notification to firestore:', err);
    }
  }, [user, isDemo]);

  const markAsRead = useCallback(async (id: string) => {
    if (!user && !isDemo) return;

    if (isDemo) {
      const guestUid = user?.uid || 'guest';
      setNotifications(prev => {
        const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
        safeStorage.setItem(`deadlineai_demo_notifications_${guestUid}`, JSON.stringify(updated));
        return updated;
      });
      return;
    }

    try {
      const ref = doc(db, 'users', user.uid, 'notifications', id);
      await updateDoc(ref, { read: true });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, [user, isDemo]);

  const markAllAsRead = useCallback(async () => {
    if (!user && !isDemo) return;

    if (isDemo) {
      const guestUid = user?.uid || 'guest';
      setNotifications(prev => {
        const updated = prev.map(n => ({ ...n, read: true }));
        safeStorage.setItem(`deadlineai_demo_notifications_${guestUid}`, JSON.stringify(updated));
        return updated;
      });
      return;
    }

    try {
      const batch = writeBatch(db);
      notifications.forEach((n) => {
        if (!n.read) {
          const ref = doc(db, 'users', user.uid, 'notifications', n.id);
          batch.update(ref, { read: true });
        }
      });
      await batch.commit();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, [user, isDemo, notifications]);

  const dismissNotification = useCallback(async (id: string) => {
    if (!user && !isDemo) return;

    if (isDemo) {
      const guestUid = user?.uid || 'guest';
      setNotifications(prev => {
        const updated = prev.filter(n => n.id !== id);
        safeStorage.setItem(`deadlineai_demo_notifications_${guestUid}`, JSON.stringify(updated));
        return updated;
      });
      return;
    }

    try {
      const ref = doc(db, 'users', user.uid, 'notifications', id);
      await deleteDoc(ref);
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }, [user, isDemo]);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    dismissNotification
  };
};
