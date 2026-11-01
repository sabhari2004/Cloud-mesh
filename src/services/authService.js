import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { localStore } from './localStore';

const CURRENT_USER_KEY = 'cloudmesh_current_session';

// Auth State listeners list for local mode
const authListeners = new Set();

const notifyListeners = (user) => {
  authListeners.forEach((callback) => {
    try {
      callback(user);
    } catch (e) {
      console.error('Error in auth state listener:', e);
    }
  });
};

export const authService = {
  // Register new user
  async register({ email, password, displayName, phone = '', location = '', role = 'user' }) {
    if (isFirebaseConfigured && auth && db) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        await updateProfile(firebaseUser, { displayName });

        // Create user document in Firestore
        const userProfile = {
          uid: firebaseUser.uid,
          id: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: displayName || email.split('@')[0],
          phone,
          location,
          role: role || 'user', // Default is 'user'
          status: 'active',
          bio: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await setDoc(doc(db, 'users', firebaseUser.uid), userProfile);

        return { ...userProfile, uid: firebaseUser.uid };
      } catch (error) {
        console.error('Firebase Auth Register Error:', error);
        throw new Error(error.message || 'Registration failed');
      }
    }

    // Local Persistence fallback
    const users = localStore.get('users', []);
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const newUser = {
      id: 'usr_' + Date.now().toString(36),
      uid: 'usr_' + Date.now().toString(36),
      email,
      displayName: displayName || email.split('@')[0],
      phone,
      location,
      role: role || 'user',
      status: 'active',
      bio: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStore.set('users', users);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    notifyListeners(newUser);
    return newUser;
  },

  // Sign In existing user
  async login({ email, password }) {
    if (isFirebaseConfigured && auth && db) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // Fetch user profile from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        let profile = null;
        if (userDoc.exists()) {
          profile = userDoc.data();
        } else {
          // If doc doesn't exist, create baseline profile
          profile = {
            uid: firebaseUser.uid,
            id: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || email.split('@')[0],
            phone: '',
            location: '',
            role: 'user',
            status: 'active',
            createdAt: serverTimestamp(),
          };
          await setDoc(userDocRef, profile);
        }

        if (profile.status === 'suspended') {
          await signOut(auth);
          throw new Error('This account has been suspended by an administrator.');
        }

        return { ...profile, uid: firebaseUser.uid };
      } catch (error) {
        console.error('Firebase Auth Login Error:', error);
        throw new Error(error.message || 'Login failed. Please check credentials.');
      }
    }

    // Local Persistence mode
    const users = localStore.get('users', []);
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new Error('No user found with this email. Please check or register.');
    }
    if (user.status === 'suspended') {
      throw new Error('This account has been suspended. Please contact community support.');
    }

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    notifyListeners(user);
    return user;
  },

  // Sign out user
  async logout() {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    }
    localStorage.removeItem(CURRENT_USER_KEY);
    notifyListeners(null);
  },

  // Password reset
  async resetPassword(email) {
    if (isFirebaseConfigured && auth) {
      return await sendPasswordResetEmail(auth, email);
    }
    // Local mode simulation
    const users = localStore.get('users', []);
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found) {
      throw new Error('No user registered with this email address.');
    }
    return true;
  },

  // Subscribe to auth state changes
  onAuthChange(callback) {
    if (isFirebaseConfigured && auth && db) {
      return onAuthStateChanged(auth, async (firebaseUser) => {
        if (!firebaseUser) {
          callback(null);
          return;
        }
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            callback({ ...userDoc.data(), uid: firebaseUser.uid });
          } else {
            callback({
              uid: firebaseUser.uid,
              id: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || 'Community Member',
              role: 'user',
              status: 'active',
            });
          }
        } catch (e) {
          console.error('Error fetching user profile in auth change:', e);
          callback({
            uid: firebaseUser.uid,
            id: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            role: 'user',
          });
        }
      });
    }

    // Local persistence mode
    authListeners.add(callback);
    // Emit initial cached state immediately
    const saved = localStorage.getItem(CURRENT_USER_KEY);
    if (saved) {
      try {
        callback(JSON.parse(saved));
      } catch {
        callback(null);
      }
    } else {
      // Default to the first seed user (Sarah Miller) so the app is instantly rich & interactive
      const defaultUser = localStore.get('users')[2]; // Sarah Miller
      if (defaultUser) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(defaultUser));
        callback(defaultUser);
      } else {
        callback(null);
      }
    }

    return () => {
      authListeners.delete(callback);
    };
  },

  // Quick switch role/user for testing and demo evaluation
  quickSwitchUser(role) {
    const users = localStore.get('users', []);
    const target = users.find((u) => u.role === role) || users[0];
    if (target) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(target));
      notifyListeners(target);
      return target;
    }
    return null;
  }
};
