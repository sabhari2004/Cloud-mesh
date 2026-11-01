import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { isFirebaseConfigured } from '../lib/firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsubscribe = authService.onAuthChange((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const user = await authService.login({ email, password });
      setCurrentUser(user);
      return user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const register = async (userData) => {
    setAuthError(null);
    try {
      const user = await authService.register(userData);
      setCurrentUser(user);
      return user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setCurrentUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const resetPassword = async (email) => {
    return await authService.resetPassword(email);
  };

  const updateProfileData = async (data) => {
    if (!currentUser) return null;
    const uid = currentUser.uid || currentUser.id;
    const updated = await userService.updateUserProfile(uid, data);
    setCurrentUser((prev) => ({ ...prev, ...updated }));
    return updated;
  };

  const quickSwitchRole = (role) => {
    const user = authService.quickSwitchUser(role);
    if (user) {
      setCurrentUser(user);
    }
    return user;
  };

  const role = currentUser?.role || 'guest';
  const isAdmin = role === 'admin';
  const isResponder = role === 'responder' || role === 'admin';

  const value = {
    currentUser,
    loading,
    role,
    isAdmin,
    isResponder,
    authError,
    setAuthError,
    login,
    register,
    logout,
    resetPassword,
    updateProfileData,
    quickSwitchRole,
    isFirebaseLive: isFirebaseConfigured,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
