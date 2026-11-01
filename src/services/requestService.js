import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  runTransaction,
  limit as firestoreLimit
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { localStore } from './localStore';
import { notificationService } from './notificationService';

export const requestService = {
  // Create a new resource request
  async createRequest(requestData, currentUser) {
    if (!currentUser) throw new Error('You must be logged in to request resources');

    const userId = currentUser.uid || currentUser.id;

    if (requestData.ownerId === userId) {
      throw new Error('You cannot request your own resource listing.');
    }

    const requestedQty = Number(requestData.requestedQuantity) || 1;
    if (requestedQty <= 0) {
      throw new Error('Requested quantity must be at least 1.');
    }

    // Check for existing pending request by this user for the same resource
    const existingRequests = await this.getUserRequests(userId);
    const hasActive = existingRequests.some(
      (r) => r.resourceId === requestData.resourceId && ['pending', 'accepted'].includes(r.status)
    );
    if (hasActive) {
      throw new Error('You already have an active request for this resource.');
    }

    const newRequestData = {
      resourceId: requestData.resourceId,
      resourceTitle: requestData.resourceTitle,
      resourceCategory: requestData.resourceCategory || 'essentials',
      ownerId: requestData.ownerId,
      ownerName: requestData.ownerName || 'Resource Owner',
      requesterId: userId,
      requesterName: currentUser.displayName || 'Community Member',
      requesterContact: requestData.requesterContact || currentUser.email || currentUser.phone || '',
      requestedQuantity: requestedQty,
      neededByDate: requestData.neededByDate || '',
      notes: (requestData.notes || '').trim(),
      status: 'pending',
      decisionNotes: '',
      createdAt: isFirebaseConfigured && db ? serverTimestamp() : new Date().toISOString(),
      updatedAt: isFirebaseConfigured && db ? serverTimestamp() : new Date().toISOString(),
    };

    let createdId = null;

    if (isFirebaseConfigured && db) {
      const docRef = await addDoc(collection(db, 'resourceRequests'), newRequestData);
      createdId = docRef.id;
    } else {
      const requests = localStore.get('resourceRequests', []);
      createdId = 'req_' + Date.now().toString(36);
      const savedDoc = {
        id: createdId,
        ...newRequestData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      requests.unshift(savedDoc);
      localStore.set('resourceRequests', requests);
    }

    // Send in-app notification to the resource owner
    await notificationService.createNotification({
      userId: requestData.ownerId,
      title: 'New Resource Request Received',
      message: `${currentUser.displayName || 'A community member'} requested ${requestedQty} units of "${requestData.resourceTitle}".`,
      type: 'request_received',
      link: '/profile?tab=incoming',
    });

    return { id: createdId, ...newRequestData };
  },

  // Get requests submitted by a user
  async getUserRequests(userId) {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(
          collection(db, 'resourceRequests'),
          where('requesterId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch (e) {
        console.warn('Firestore request query error:', e);
      }
    }

    const requests = localStore.get('resourceRequests', []);
    return requests.filter((r) => r.requesterId === userId);
  },

  // Get requests received by a resource owner
  async getOwnerRequests(ownerId) {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(
          collection(db, 'resourceRequests'),
          where('ownerId', '==', ownerId),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch (e) {
        console.warn('Firestore owner request query error:', e);
      }
    }

    const requests = localStore.get('resourceRequests', []);
    return requests.filter((r) => r.ownerId === ownerId);
  },

  // Update request status (accept, reject, complete, cancel)
  async updateRequestStatus(requestId, newStatus, decisionNotes = '', currentUser) {
    if (!currentUser) throw new Error('Authentication required');

    const validStatuses = ['pending', 'accepted', 'rejected', 'completed', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }

    const userId = currentUser.uid || currentUser.id;
    const isAdmin = currentUser.role === 'admin';

    // Retrieve request
    let requestItem = null;
    if (isFirebaseConfigured && db) {
      const snap = await getDoc(doc(db, 'resourceRequests', requestId));
      if (!snap.exists()) throw new Error('Request record not found');
      requestItem = { id: snap.id, ...snap.data() };
    } else {
      const list = localStore.get('resourceRequests', []);
      requestItem = list.find((r) => r.id === requestId);
      if (!requestItem) throw new Error('Request record not found');
    }

    const isOwner = requestItem.ownerId === userId;
    const isRequester = requestItem.requesterId === userId;

    // Authorization checks:
    // Requester can only 'cancel'
    // Owner can 'accept', 'reject', 'complete', 'cancelled'
    // Admin can do any
    if (isRequester && !isOwner && !isAdmin) {
      if (newStatus !== 'cancelled') {
        throw new Error('Requesters can only cancel their own pending requests.');
      }
    } else if (isOwner || isAdmin) {
      // Allowed
    } else {
      throw new Error('Unauthorized to modify this resource request');
    }

    // Perform status update and handle resource availability updates
    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, 'resourceRequests', requestId), {
        status: newStatus,
        decisionNotes: decisionNotes || requestItem.decisionNotes || '',
        updatedAt: serverTimestamp(),
      });

      // If accepted or completed, optionally update resource status
      if (newStatus === 'accepted' || newStatus === 'completed') {
        try {
          const resRef = doc(db, 'resources', requestItem.resourceId);
          const resSnap = await getDoc(resRef);
          if (resSnap.exists()) {
            const resData = resSnap.data();
            const newQty = Math.max(0, (resData.quantity || 0) - (requestItem.requestedQuantity || 1));
            const newAvailability = newQty <= 0 ? 'reserved' : 'partially_available';
            await updateDoc(resRef, {
              quantity: newQty,
              availability: newAvailability,
              updatedAt: serverTimestamp(),
            });
          }
        } catch (e) {
          console.warn('Could not auto-adjust resource availability:', e);
        }
      }
    } else {
      // Local persistence mode
      const requests = localStore.get('resourceRequests', []);
      const idx = requests.findIndex((r) => r.id === requestId);
      if (idx !== -1) {
        requests[idx].status = newStatus;
        requests[idx].decisionNotes = decisionNotes || requests[idx].decisionNotes || '';
        requests[idx].updatedAt = new Date().toISOString();
        localStore.set('resourceRequests', requests);
      }

      // Adjust local resource quantity
      if (newStatus === 'accepted' || newStatus === 'completed') {
        const resources = localStore.get('resources', []);
        const resIdx = resources.findIndex((r) => r.id === requestItem.resourceId);
        if (resIdx !== -1) {
          const currentQty = resources[resIdx].quantity || 0;
          const newQty = Math.max(0, currentQty - (requestItem.requestedQuantity || 1));
          resources[resIdx].quantity = newQty;
          resources[resIdx].availability = newQty <= 0 ? 'reserved' : 'partially_available';
          localStore.set('resources', resources);
        }
      }
    }

    // Send notifications to the appropriate counterpart
    if (isOwner || isAdmin) {
      // Notify requester of decision
      const statusLabels = {
        accepted: 'Approved! Please coordinate handover details.',
        rejected: 'Declined.',
        completed: 'Marked as Completed. Thank you!',
        cancelled: 'Cancelled by owner.',
      };
      await notificationService.createNotification({
        userId: requestItem.requesterId,
        title: `Request ${newStatus.toUpperCase()}: ${requestItem.resourceTitle}`,
        message: `${currentUser.displayName || 'The owner'} marked your request as ${newStatus}. ${decisionNotes ? `Note: "${decisionNotes}"` : (statusLabels[newStatus] || '')}`,
        type: 'request_update',
        link: '/profile?tab=requests',
      });
    } else if (isRequester) {
      // Notify owner that requester cancelled
      await notificationService.createNotification({
        userId: requestItem.ownerId,
        title: 'Request Cancelled',
        message: `${currentUser.displayName || 'Requester'} has cancelled their request for "${requestItem.resourceTitle}".`,
        type: 'request_update',
        link: '/profile?tab=incoming',
      });
    }

    return { ...requestItem, status: newStatus, decisionNotes };
  },

  // Get all requests across the system (For Admin oversight)
  async getAllRequests({ status = 'all', limitCount = 100 } = {}) {
    if (isFirebaseConfigured && db) {
      try {
        let q = collection(db, 'resourceRequests');
        const constraints = [orderBy('createdAt', 'desc')];
        if (status && status !== 'all') {
          constraints.unshift(where('status', '==', status));
        }
        if (limitCount) {
          constraints.push(firestoreLimit(limitCount));
        }
        const snap = await getDocs(query(q, ...constraints));
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch (e) {
        console.warn('Firestore getAllRequests error, falling back to local dataset:', e);
      }
    }

    let requests = localStore.get('resourceRequests', []);
    if (status && status !== 'all') {
      requests = requests.filter((r) => r.status === status);
    }
    return requests.slice(0, limitCount);
  },

  // Calculate platform request metrics
  async getRequestStats() {
    let requests = [];
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'resourceRequests'));
        requests = snap.docs.map((d) => d.data());
      } catch (e) {
        // Fallback gracefully if permissions or network restricts unauthenticated queries
        requests = localStore.get('resourceRequests', []);
      }
    } else {
      requests = localStore.get('resourceRequests', []);
    }

    const activeCount = requests.filter((r) => ['pending', 'accepted'].includes(r.status)).length;
    const completedCount = requests.filter((r) => r.status === 'completed').length;
    const pendingCount = requests.filter((r) => r.status === 'pending').length;

    return {
      activeCount,
      completedCount,
      pendingCount,
      totalCount: requests.length,
    };
  }
};

