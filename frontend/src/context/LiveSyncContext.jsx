import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import apiClient from '../api/client';

const LiveSyncContext = createContext();

export function LiveSyncProvider({ children }) {
  const [lastSyncTime, setLastSyncTime] = useState(Date.now());
  const [syncVersion, setSyncVersion] = useState(0);

  // BroadcastChannel for instant cross-tab live updates
  const [broadcastChannel] = useState(() => {
    try {
      return new BroadcastChannel('ganesh_chanda_live_sync');
    } catch (e) {
      return null;
    }
  });

  const notifyLiveUpdate = useCallback(() => {
    const now = Date.now();
    setLastSyncTime(now);
    setSyncVersion((prev) => prev + 1);

    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage({ type: 'LIVE_UPDATE', timestamp: now });
      } catch (e) {
        // Ignore broadcast errors
      }
    }
  }, [broadcastChannel]);

  useEffect(() => {
    if (!broadcastChannel) return;

    const handleMessage = (event) => {
      if (event.data?.type === 'LIVE_UPDATE') {
        setLastSyncTime(event.data.timestamp || Date.now());
        setSyncVersion((prev) => prev + 1);
      }
    };

    broadcastChannel.addEventListener('message', handleMessage);
    return () => {
      broadcastChannel.removeEventListener('message', handleMessage);
    };
  }, [broadcastChannel]);

  // Auto live-sync polling interval (every 10 seconds) for real-time dashboard & page updates across devices
  useEffect(() => {
    const pollInterval = setInterval(() => {
      setSyncVersion((prev) => prev + 1);
    }, 10000);
    return () => clearInterval(pollInterval);
  }, []);

  // Keep-Alive Ping Service — keeps Render backend warm every 4 minutes
  useEffect(() => {
    const pingBackend = async () => {
      try {
        await apiClient.get('/health/');
      } catch (err) {
        // Ignore ping failures
      }
    };

    // Initial warm-up ping
    pingBackend();

    // Ping every 4 minutes
    const interval = setInterval(pingBackend, 4 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <LiveSyncContext.Provider
      value={{
        lastSyncTime,
        syncVersion,
        notifyLiveUpdate,
        triggerSync: notifyLiveUpdate,
      }}
    >
      {children}
    </LiveSyncContext.Provider>
  );
}

export function useLiveSync() {
  return useContext(LiveSyncContext);
}
