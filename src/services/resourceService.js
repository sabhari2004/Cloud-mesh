import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  limit as firestoreLimit,
  onSnapshot
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { localStore } from './localStore';

export const resourceService = {
  // Get all resources with search, filtering, and sorting
  async getResources({
    category = 'all',
    availability = 'all',
    search = '',
    sortBy = 'newest', // 'newest', 'quantity_desc', 'expiry'
    limitCount = 50,
  } = {}) {
    if (isFirebaseConfigured && db) {
      try {
        let q = collection(db, 'resources');
        const constraints = [];

        if (category && category !== 'all') {
          constraints.push(where('category', '==', category));
        }

        if (availability && availability !== 'all') {
          constraints.push(where('availability', '==', availability));
        }

        if (sortBy === 'quantity_desc') {
          constraints.push(orderBy('quantity', 'desc'));
        } else if (sortBy === 'expiry') {
          constraints.push(orderBy('expiryDate', 'asc'));
        } else {
          constraints.push(orderBy('createdAt', 'desc'));
        }

        constraints.push(firestoreLimit(limitCount));

        const firestoreQuery = query(q, ...constraints);
        const snap = await getDocs(firestoreQuery);
        let results = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        // In-memory text search if provided
        if (search && search.trim() !== '') {
          const lower = search.toLowerCase();
          results = results.filter((r) =>
            r.title?.toLowerCase().includes(lower) ||
            r.description?.toLowerCase().includes(lower) ||
            r.location?.toLowerCase().includes(lower) ||
            r.category?.toLowerCase().includes(lower)
          );
        }

        return results;
      } catch (err) {
        console.warn('Firestore query failed, falling back to local dataset:', err);
      }
    }

    // Local Persistence mode
    let resources = localStore.get('resources', []);

    if (category && category !== 'all') {
      resources = resources.filter((r) => r.category === category);
    }

    if (availability && availability !== 'all') {
      resources = resources.filter((r) => r.availability === availability);
    }

    if (search && search.trim() !== '') {
      const lower = search.toLowerCase();
      resources = resources.filter((r) =>
        r.title?.toLowerCase().includes(lower) ||
        r.description?.toLowerCase().includes(lower) ||
        r.location?.toLowerCase().includes(lower) ||
        r.category?.toLowerCase().includes(lower)
      );
    }

    // Sorting
    resources.sort((a, b) => {
      if (sortBy === 'quantity_desc') {
        return (b.quantity || 0) - (a.quantity || 0);
      } else if (sortBy === 'expiry') {
        return new Date(a.expiryDate || 0) - new Date(b.expiryDate || 0);
      } else {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });

    return resources.slice(0, limitCount);
  },

  // Get resource by ID
  async getResourceById(id) {
    if (isFirebaseConfigured && db) {
      const snap = await getDoc(doc(db, 'resources', id));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() };
    }

    const resources = localStore.get('resources', []);
    return resources.find((r) => r.id === id) || null;
  },

  // Create new resource listing
  async createResource(resourceData, currentUser) {
    if (!currentUser) throw new Error('Authentication required to create a resource');

    const cleanData = {
      title: resourceData.title.trim(),
      description: resourceData.description.trim(),
      category: resourceData.category,
      quantity: Number(resourceData.quantity),
      unit: resourceData.unit || 'units',
      availability: 'available',
      location: resourceData.location.trim(),
      ownerId: currentUser.uid || currentUser.id,
      ownerName: currentUser.displayName || 'Community Member',
      ownerContact: resourceData.contact || currentUser.email,
      contactPreferences: resourceData.contactPreferences || 'in_app',
      urgent: Boolean(resourceData.urgent),
      expiryDate: resourceData.expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: isFirebaseConfigured && db ? serverTimestamp() : new Date().toISOString(),
      updatedAt: isFirebaseConfigured && db ? serverTimestamp() : new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      const docRef = await addDoc(collection(db, 'resources'), cleanData);
      return { id: docRef.id, ...cleanData };
    }

    const resources = localStore.get('resources', []);
    const newDoc = {
      id: 'res_' + Date.now().toString(36),
      ...cleanData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    resources.unshift(newDoc);
    localStore.set('resources', resources);
    return newDoc;
  },

  // Update resource listing
  async updateResource(id, updateData, currentUser) {
    if (!currentUser) throw new Error('Authentication required');

    const existing = await this.getResourceById(id);
    if (!existing) throw new Error('Resource not found');

    const isOwner = existing.ownerId === (currentUser.uid || currentUser.id);
    const isAdmin = currentUser.role === 'admin';
    if (!isOwner && !isAdmin) {
      throw new Error('Unauthorized: You can only edit resources that you own');
    }

    const safeUpdates = {
      title: updateData.title !== undefined ? updateData.title.trim() : existing.title,
      description: updateData.description !== undefined ? updateData.description.trim() : existing.description,
      category: updateData.category || existing.category,
      quantity: updateData.quantity !== undefined ? Number(updateData.quantity) : existing.quantity,
      unit: updateData.unit || existing.unit,
      availability: updateData.availability || existing.availability,
      location: updateData.location !== undefined ? updateData.location.trim() : existing.location,
      urgent: updateData.urgent !== undefined ? Boolean(updateData.urgent) : existing.urgent,
      expiryDate: updateData.expiryDate || existing.expiryDate,
      updatedAt: isFirebaseConfigured && db ? serverTimestamp() : new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, 'resources', id), safeUpdates);
      return { id, ...existing, ...safeUpdates };
    }

    const resources = localStore.get('resources', []);
    const idx = resources.findIndex((r) => r.id === id);
    if (idx !== -1) {
      resources[idx] = { ...resources[idx], ...safeUpdates };
      localStore.set('resources', resources);
      return resources[idx];
    }
    throw new Error('Resource not found');
  },

  // Delete resource listing
  async deleteResource(id, currentUser) {
    if (!currentUser) throw new Error('Authentication required');

    const existing = await this.getResourceById(id);
    if (!existing) return true;

    const isOwner = existing.ownerId === (currentUser.uid || currentUser.id);
    const isAdmin = currentUser.role === 'admin';
    if (!isOwner && !isAdmin) {
      throw new Error('Unauthorized: You can only delete resources that you own');
    }

    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, 'resources', id));
      return true;
    }

    const resources = localStore.get('resources', []);
    const filtered = resources.filter((r) => r.id !== id);
    localStore.set('resources', filtered);
    return true;
  },

  // Get resources owned by a specific user
  async getUserResources(userId) {
    if (isFirebaseConfigured && db) {
      const q = query(
        collection(db, 'resources'),
        where('ownerId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }

    const resources = localStore.get('resources', []);
    return resources.filter((r) => r.ownerId === userId);
  },

  // Real-time synchronization subscription for live catalog updates
  subscribeToResources(callback) {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'), firestoreLimit(50));
      return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        callback(items);
      }, (err) => {
        console.warn('Firestore resource subscription notice:', err.message);
      });
    }

    // Offline / Local storage fallback observer
    const pollInterval = setInterval(() => {
      callback(localStore.get('resources', []));
    }, 5000);

    return () => clearInterval(pollInterval);
  }
};
