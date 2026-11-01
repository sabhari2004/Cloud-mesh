import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { localStore } from './localStore';

const notifListeners = new Map();

export const notificationService = {
  // Create an in-app notification
  async createNotification({ userId, title, message, type = 'system', link = '' }) {
    if (!userId) return null;

    const notifData = {
      userId,
      title,
      message,
      type,
      link,
      read: false,
      createdAt: isFirebaseConfigured && db ? serverTimestamp() : new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      try {
        const docRef = await addDoc(collection(db, 'notifications'), notifData);
        return { id: docRef.id, ...notifData };
      } catch (err) {
        console.warn('Failed to write notification to Firestore, fallback to localStore:', err);
      }
    }

    const notifications = localStore.get('notifications', []);
    const newNotif = {
      id: 'notif_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      ...notifData,
      createdAt: new Date().toISOString(),
    };
    notifications.unshift(newNotif);
    localStore.set('notifications', notifications);

    // Notify active listeners for this user
    if (notifListeners.has(userId)) {
      notifListeners.get(userId).forEach((cb) => {
        try {
          cb(notifications.filter((n) => n.userId === userId));
        } catch (e) {
          console.error(e);
        }
      });
    }

    return newNotif;
  },

  // Get user's notifications
  async getUserNotifications(userId) {
    if (!userId) return [];

    if (isFirebaseConfigured && db) {
      try {
        const q = query(
          collection(db, 'notifications'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch (err) {
        console.warn('Firestore notification query error:', err);
      }
    }

    const notifications = localStore.get('notifications', []);
    return notifications.filter((n) => n.userId === userId);
  },

  // Real-time listener for user notifications
  subscribeToNotifications(userId, callback) {
    if (!userId) {
      callback([]);
      return () => {};
    }

    if (isFirebaseConfigured && db) {
      try {
        const q = query(
          collection(db, 'notifications'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        return onSnapshot(
          q,
          (snapshot) => {
            const list = snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            }));
            callback(list);
          },
          (err) => {
            console.warn('Real-time notification listener failed:', err);
          }
        );
      } catch (e) {
        console.warn('Could not attach Firestore listener:', e);
      }
    }

    // Local mode listener
    if (!notifListeners.has(userId)) {
      notifListeners.set(userId, new Set());
    }
    notifListeners.get(userId).add(callback);

    // Initial emit
    const notifications = localStore.get('notifications', []);
    callback(notifications.filter((n) => n.userId === userId));

    return () => {
      if (notifListeners.has(userId)) {
        notifListeners.get(userId).delete(callback);
      }
    };
  },

  // Mark single notification as read
  async markAsRead(notificationId) {
    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'notifications', notificationId), {
          read: true,
        });
        return true;
      } catch (err) {
        console.warn('Failed to mark read in Firestore:', err);
      }
    }

    const notifications = localStore.get('notifications', []);
    const idx = notifications.findIndex((n) => n.id === notificationId);
    if (idx !== -1) {
      notifications[idx].read = true;
      localStore.set('notifications', notifications);
      return true;
    }
    return false;
  },

  // Mark all user notifications as read
  async markAllAsRead(userId) {
    if (!userId) return;

    if (isFirebaseConfigured && db) {
      try {
        const q = query(
          collection(db, 'notifications'),
          where('userId', '==', userId),
          where('read', '==', false)
        );
        const snap = await getDocs(q);
        const updates = snap.docs.map((d) => updateDoc(d.ref, { read: true }));
        await Promise.all(updates);
      } catch (err) {
        console.warn('Error marking all notifications as read in Firestore:', err);
      }
    }

    const notifications = localStore.get('notifications', []);
    let changed = false;
    notifications.forEach((n) => {
      if (n.userId === userId && !n.read) {
        n.read = true;
        changed = true;
      }
    });

    if (changed) {
      localStore.set('notifications', notifications);
      if (notifListeners.has(userId)) {
        notifListeners.get(userId).forEach((cb) => cb(notifications.filter((n) => n.userId === userId)));
      }
    }
  }
};
