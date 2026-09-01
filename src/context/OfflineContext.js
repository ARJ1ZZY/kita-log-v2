import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncAllQueuedOperations } from '../services/syncService';

const OfflineContext = createContext({
  isOffline: false,
  setOffline: () => {},
  pendingOperations: 0,
  syncNow: () => {},
  isSyncing: false,
});

export const useOffline = () => useContext(OfflineContext);

const QUEUE_KEY = '@kita_log_write_queue';

export const OfflineProvider = ({ children }) => {
  const [isOffline, setIsOffline] = useState(false);
  const [pendingOperations, setPendingOperations] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncTimerRef = useRef(null);
  const mountedRef = useRef(true);

  // Check queue size on mount and when coming online
  const checkQueueSize = async () => {
    try {
      const queue = await AsyncStorage.getItem(QUEUE_KEY);
      const items = queue ? JSON.parse(queue) : [];
      if (mountedRef.current) {
        setPendingOperations(items.length);
      }
      return items.length;
    } catch (e) {
      return 0;
    }
  };

  // Setup offline/online listeners
  useEffect(() => {
    mountedRef.current = true;

    const handleOnline = () => {
      console.log('🟢 App is online - triggering sync');
      setIsOffline(false);
      // Debounce sync to avoid multiple triggers
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
      syncTimerRef.current = setTimeout(() => {
        syncNow();
      }, 2000);
    };

    const handleOffline = () => {
      console.log('🔴 App is offline');
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
    }

    checkQueueSize();

    return () => {
      mountedRef.current = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, []);

  const syncNow = async () => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      await syncAllQueuedOperations();
      const remaining = await checkQueueSize();
      if (remaining === 0 && mountedRef.current) {
        setIsOffline(false);
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      if (mountedRef.current) {
        setIsSyncing(false);
      }
    }
  };

  const setOffline = (offline) => {
    if (mountedRef.current) {
      setIsOffline(offline);
    }
  };

  const value = {
    isOffline,
    setOffline,
    pendingOperations,
    syncNow,
    isSyncing,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};