import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, CloudOff, CheckCircle2 } from 'lucide-react';

export const NetworkStatusBanner = () => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setJustReconnected(true);
      const timer = setTimeout(() => setJustReconnected(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setJustReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !justReconnected) return null;

  if (justReconnected) {
    return (
      <div className="bg-emerald-600 text-white px-4 py-2 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-sm animate-in slide-in-from-top-2">
        <CheckCircle2 className="w-4 h-4" />
        <span>Internet connection restored. Synchronizing mutual aid records with Cloud Firestore.</span>
      </div>
    );
  }

  return (
    <div className="bg-amber-600 text-white px-4 py-2 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-sm animate-in slide-in-from-top-2">
      <WifiOff className="w-4 h-4 animate-pulse" />
      <span>
        <strong>Offline Crisis Mode Active:</strong> Network disconnected. Mutual aid requests & emergency logs are cached locally in your browser and will sync automatically when signal returns.
      </span>
    </div>
  );
};
