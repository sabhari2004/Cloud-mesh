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
  onSnapshot
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { localStore } from './localStore';
import { notificationService } from './notificationService';

const emergencyListeners = new Set();

export const emergencyService = {
  // Submit emergency report
  async createEmergencyReport(reportData, currentUser) {
    const isAnonymous = !currentUser;

    const cleanReport = {
      title: reportData.title.trim(),
      description: reportData.description.trim(),
      category: reportData.category || 'other',
      location: reportData.location.trim(),
      severity: reportData.severity || 'high', // 'critical', 'high', 'medium', 'low'
      immediateDanger: Boolean(reportData.immediateDanger),
      status: 'reported', // Initial status
      reporterId: isAnonymous ? 'anonymous' : (currentUser.uid || currentUser.id),
      reporterName: isAnonymous ? (reportData.contactName || 'Anonymous Community Member') : (currentUser.displayName || 'Community Member'),
      reporterContact: reportData.contactPhone || (currentUser ? (currentUser.phone || currentUser.email) : ''),
      assignedTo: null,
      assignedToName: null,
      responderNotes: '',
      timestamp: isFirebaseConfigured && db ? serverTimestamp() : new Date().toISOString(),
      updatedAt: isFirebaseConfigured && db ? serverTimestamp() : new Date().toISOString(),
    };

    let createdId = null;

    if (isFirebaseConfigured && db) {
      try {
        const docRef = await addDoc(collection(db, 'emergencyReports'), cleanReport);
        createdId = docRef.id;
      } catch (err) {
        console.warn('Firestore emergency report creation error, using local:', err);
      }
    }

    if (!createdId) {
      const list = localStore.get('emergencyReports', []);
      createdId = 'emg_' + Date.now().toString(36);
      const savedDoc = {
        id: createdId,
        ...cleanReport,
        timestamp: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      list.unshift(savedDoc);
      localStore.set('emergencyReports', list);

      // Notify local listeners
      emergencyListeners.forEach((cb) => cb(list));
    }

    return { id: createdId, ...cleanReport };
  },

  // Get emergency reports with optional filters
  async getEmergencyReports({
    status = 'all', // 'all', 'open', 'reported', 'verified', 'assigned', 'in_progress', 'resolved', 'rejected'
    severity = 'all',
    category = 'all',
  } = {}) {
    if (isFirebaseConfigured && db) {
      try {
        let q = collection(db, 'emergencyReports');
        const constraints = [orderBy('timestamp', 'desc')];

        if (severity && severity !== 'all') {
          constraints.unshift(where('severity', '==', severity));
        }

        if (category && category !== 'all') {
          constraints.unshift(where('category', '==', category));
        }

        const firestoreQuery = query(q, ...constraints);
        const snap = await getDocs(firestoreQuery);
        let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        if (status === 'open') {
          items = items.filter((i) => ['reported', 'verified', 'assigned', 'in_progress'].includes(i.status));
        } else if (status && status !== 'all') {
          items = items.filter((i) => i.status === status);
        }

        return items;
      } catch (e) {
        console.warn('Firestore emergency list query error:', e);
      }
    }

    // Local mode
    let list = localStore.get('emergencyReports', []);

    if (status === 'open') {
      list = list.filter((i) => ['reported', 'verified', 'assigned', 'in_progress'].includes(i.status));
    } else if (status && status !== 'all') {
      list = list.filter((i) => i.status === status);
    }

    if (severity && severity !== 'all') {
      list = list.filter((i) => i.severity === severity);
    }

    if (category && category !== 'all') {
      list = list.filter((i) => i.category === category);
    }

    return list;
  },

  // Subscribe to live emergency reports
  subscribeToEmergencies(callback) {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, 'emergencyReports'), orderBy('timestamp', 'desc'));
        return onSnapshot(
          q,
          (snapshot) => {
            const list = snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            }));
            callback(list);
          },
          (err) => console.warn('Emergency snapshot error:', err)
        );
      } catch (e) {
        console.warn('Could not set emergency snapshot listener:', e);
      }
    }

    emergencyListeners.add(callback);
    callback(localStore.get('emergencyReports', []));

    return () => {
      emergencyListeners.delete(callback);
    };
  },

  // Update emergency status & responder notes (Responders & Admins only)
  async updateIncidentStatus(reportId, {
    status,
    responderNotes,
    assignedTo = null,
    assignedToName = null,
  }, currentUser) {
    if (!currentUser) throw new Error('Authentication required');

    const isAuthorized = ['responder', 'admin'].includes(currentUser.role);
    if (!isAuthorized) {
      throw new Error('Unauthorized: Only verified First Responders and Administrators can manage emergency triage.');
    }

    const validStatuses = ['reported', 'verified', 'assigned', 'in_progress', 'resolved', 'rejected'];
    if (status && !validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    // Fetch report
    let report = null;
    if (isFirebaseConfigured && db) {
      const snap = await getDoc(doc(db, 'emergencyReports', reportId));
      if (!snap.exists()) throw new Error('Report not found');
      report = { id: snap.id, ...snap.data() };
    } else {
      const list = localStore.get('emergencyReports', []);
      report = list.find((r) => r.id === reportId);
      if (!report) throw new Error('Report not found');
    }

    const updates = {
      updatedAt: isFirebaseConfigured && db ? serverTimestamp() : new Date().toISOString(),
    };

    if (status) updates.status = status;
    if (responderNotes !== undefined) updates.responderNotes = responderNotes;
    if (assignedTo !== undefined) updates.assignedTo = assignedTo;
    if (assignedToName !== undefined) updates.assignedToName = assignedToName;

    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, 'emergencyReports', reportId), updates);
    } else {
      const list = localStore.get('emergencyReports', []);
      const idx = list.findIndex((r) => r.id === reportId);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates };
        localStore.set('emergencyReports', list);
        emergencyListeners.forEach((cb) => cb(list));
      }
    }

    // If report has an authenticated reporter, send notification
    if (report.reporterId && report.reporterId !== 'anonymous') {
      await notificationService.createNotification({
        userId: report.reporterId,
        title: `Incident Update: ${report.title}`,
        message: `Your emergency report status was changed to "${status?.toUpperCase() || report.status.toUpperCase()}" by ${currentUser.displayName || 'Emergency Responder'}.`,
        type: 'emergency_alert',
        link: '/emergency',
      });
    }

    return { ...report, ...updates };
  },

  // Get reports submitted by a specific user
  async getUserEmergencyReports(userId) {
    if (!userId) return [];

    if (isFirebaseConfigured && db) {
      try {
        const q = query(
          collection(db, 'emergencyReports'),
          where('reporterId', '==', userId),
          orderBy('timestamp', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch (e) {
        console.warn('Firestore user emergency query error:', e);
      }
    }

    const list = localStore.get('emergencyReports', []);
    return list.filter((r) => r.reporterId === userId);
  }
};
