import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { localStore } from './localStore';

export const userService = {
  // Get user profile
  async getUserProfile(uid) {
    if (isFirebaseConfigured && db) {
      const snap = await getDoc(doc(db, 'users', uid));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() };
    }

    const users = localStore.get('users', []);
    return users.find((u) => u.uid === uid || u.id === uid) || null;
  },

  // Update profile (name, phone, location, bio)
  async updateUserProfile(uid, data) {
    // Disallow self-modification of role and status through this method
    const safeData = {
      displayName: data.displayName,
      phone: data.phone ?? '',
      location: data.location ?? '',
      bio: data.bio ?? '',
      updatedAt: isFirebaseConfigured && db ? serverTimestamp() : new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, 'users', uid), safeData);
      return safeData;
    }

    const users = localStore.get('users', []);
    const index = users.findIndex((u) => u.uid === uid || u.id === uid);
    if (index !== -1) {
      users[index] = { ...users[index], ...safeData };
      localStore.set('users', users);
      // update current session if active
      const session = JSON.parse(localStorage.getItem('cloudmesh_current_session') || '{}');
      if (session.uid === uid || session.id === uid) {
        localStorage.setItem('cloudmesh_current_session', JSON.stringify(users[index]));
      }
      return users[index];
    }
    throw new Error('User not found');
  },

  // Get all users (Admin view)
  async getAllUsers() {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }

    return localStore.get('users', []);
  },

  // Update role (Admin only)
  async updateUserRole(targetUid, newRole) {
    if (!['user', 'responder', 'admin'].includes(newRole)) {
      throw new Error('Invalid role specified');
    }

    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, 'users', targetUid), {
        role: newRole,
        updatedAt: serverTimestamp(),
      });
      return true;
    }

    const users = localStore.get('users', []);
    const idx = users.findIndex((u) => u.uid === targetUid || u.id === targetUid);
    if (idx !== -1) {
      users[idx].role = newRole;
      localStore.set('users', users);
      // update active session if it matches
      const session = JSON.parse(localStorage.getItem('cloudmesh_current_session') || '{}');
      if (session.uid === targetUid || session.id === targetUid) {
        session.role = newRole;
        localStorage.setItem('cloudmesh_current_session', JSON.stringify(session));
      }
      return true;
    }
    throw new Error('User not found');
  },

  // Update status (Admin only: active vs suspended)
  async updateUserStatus(targetUid, newStatus) {
    if (!['active', 'suspended'].includes(newStatus)) {
      throw new Error('Invalid status specified');
    }

    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, 'users', targetUid), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      return true;
    }

    const users = localStore.get('users', []);
    const idx = users.findIndex((u) => u.uid === targetUid || u.id === targetUid);
    if (idx !== -1) {
      users[idx].status = newStatus;
      localStore.set('users', users);
      return true;
    }
    throw new Error('User not found');
  }
};
