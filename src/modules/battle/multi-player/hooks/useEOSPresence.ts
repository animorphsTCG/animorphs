
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/modules/auth';
import { toast } from '@/components/ui/use-toast';
import { presenceWorker } from '@/lib/cloudflare/presenceWorker';

// Define types for presence data
export interface UserPresence {
  user_id: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  last_ping: number; // Timestamp
  metadata?: Record<string, any>;
}

interface UseEOSPresenceOptions {
  autoReconnect?: boolean;
  heartbeatInterval?: number;
  logActivity?: boolean;
}

// Default options
const defaultOptions: UseEOSPresenceOptions = {
  autoReconnect: true,
  heartbeatInterval: 15000, // 15 seconds
  logActivity: false,
};

export const useEOSPresence = (options: UseEOSPresenceOptions = {}) => {
  const { user, token } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [presenceError, setPresenceError] = useState<string | null>(null);
  const [lastHeartbeat, setLastHeartbeat] = useState<number>(0);
  
  // Merge provided options with defaults
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Track presence with exponential backoff retry
  const trackPresence = useCallback(async (status: 'online' | 'away' | 'busy' | 'offline' = 'online') => {
    if (!user || !token?.access_token) return;
    
    try {
      const now = Date.now();
      setLastHeartbeat(now);
      
      // Update the presence record using Cloudflare worker
      await presenceWorker.updatePresence(
        user.id,
        status,
        {
          last_ping: now,
          user_agent: navigator.userAgent,
        },
        token.access_token
      );
      
      // Reset error and reconnect attempts on success
      if (presenceError) setPresenceError(null);
      if (reconnectAttempts > 0) setReconnectAttempts(0);
      
      if (mergedOptions.logActivity) {
        console.log(`[EOS Presence] Heartbeat sent at ${new Date().toLocaleTimeString()}`);
      }
      
      if (connectionStatus !== 'connected') {
        setConnectionStatus('connected');
      }
    } catch (error: any) {
      console.error('[EOS Presence] Error updating presence:', error);
      setPresenceError(error.message || 'Failed to update presence');
      
      if (mergedOptions.autoReconnect) {
        const attempts = reconnectAttempts + 1;
        setReconnectAttempts(attempts);
        
        // Exponential backoff with max delay of 30s
        const delay = Math.min(Math.pow(2, attempts) * 1000, 30000);
        
        console.warn(`[EOS Presence] Reconnecting in ${delay}ms (attempt ${attempts})`);
        setTimeout(() => trackPresence(status), delay);
      }
    }
  }, [user, token, presenceError, reconnectAttempts, connectionStatus, mergedOptions]);
  
  // Set up heartbeat interval
  useEffect(() => {
    if (!user) return;
    
    // Initial presence update
    trackPresence('online');
    
    // Set up heartbeat interval
    const heartbeatInterval = setInterval(() => {
      trackPresence('online');
    }, mergedOptions.heartbeatInterval);
    
    // Handle visibility changes to update away/online status
    const handleVisibilityChange = () => {
      const status = document.visibilityState === 'visible' ? 'online' : 'away';
      trackPresence(status);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Set status to offline when component unmounts
      if (user && token?.access_token) {
        presenceWorker.updatePresence(
          user.id,
          'offline',
          { last_ping: Date.now() },
          token.access_token
        )
        .then(() => {
          if (mergedOptions.logActivity) {
            console.log('[EOS Presence] Set status to offline on unmount');
          }
        })
        .catch(err => console.error('[EOS Presence] Error updating offline status:', err));
      }
    };
  }, [user, token, trackPresence, mergedOptions.heartbeatInterval, mergedOptions.logActivity]);
  
  // Function to manually update status
  const setStatus = useCallback((status: 'online' | 'away' | 'busy' | 'offline') => {
    trackPresence(status);
  }, [trackPresence]);
  
  return {
    connectionStatus,
    lastHeartbeat,
    presenceError,
    reconnectAttempts,
    setStatus,
    forceUpdate: () => trackPresence('online'),
  };
};
