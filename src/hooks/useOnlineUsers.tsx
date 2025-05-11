
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/modules/auth/context/EOSAuthContext';
import { getOnlineUsers, UserPresence } from '@/lib/eos/eosPresence';

export interface OnlineUser {
  id: string;
  username: string;
  profile_image_url?: string | null;
  status: 'online' | 'away' | 'busy' | 'offline';
  has_paid: boolean;
  last_seen: string;
}

export const useOnlineUsers = (autoRefreshInterval: number = 15000) => {
  const { user, token } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  
  // Fetch online users with retry logic
  const fetchOnlineUsers = useCallback(async (retryCount = 0) => {
    if (!token?.access_token) {
      setOnlineUsers([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch online users from our presence system
      const users = await getOnlineUsers(token.access_token);
      
      // Format the response to match our interface
      const formattedUsers: OnlineUser[] = users.map(user => ({
        id: user.user_id,
        username: user.username,
        profile_image_url: user.profile_image_url,
        status: user.status,
        has_paid: user.has_paid,
        last_seen: user.last_seen
      }));
      
      console.log("Online users:", formattedUsers);
      setOnlineUsers(formattedUsers);
      
      // Reset reconnect attempts on success
      if (reconnectAttempts > 0) {
        setReconnectAttempts(0);
      }
      
      if (connectionStatus !== 'connected') {
        setConnectionStatus('connected');
      }
    } catch (err: any) {
      console.error("Error fetching online users:", err);
      setError(err.message || 'Failed to load online users');
      
      // Implement exponential backoff for retries
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`Retrying fetch in ${delay}ms (attempt ${retryCount + 1}/3)`);
        setTimeout(() => fetchOnlineUsers(retryCount + 1), delay);
      } else {
        // After 3 failures, mark as disconnected
        setConnectionStatus('disconnected');
        
        // Increment reconnect attempts for tracking
        const attempts = reconnectAttempts + 1;
        setReconnectAttempts(attempts);
      }
    } finally {
      setLoading(false);
    }
  }, [token, reconnectAttempts, connectionStatus]);
  
  // Initial fetch and automatic refresh
  useEffect(() => {
    // Initial fetch
    fetchOnlineUsers();
    
    // Set up regular fetches
    const fetchInterval = setInterval(() => fetchOnlineUsers(), autoRefreshInterval);
    
    // Clean up
    return () => {
      clearInterval(fetchInterval);
    };
  }, [fetchOnlineUsers, autoRefreshInterval]);
  
  // Provide a manual refresh function
  const refreshUsers = () => {
    fetchOnlineUsers();
  };
  
  return { 
    onlineUsers, 
    loading, 
    error, 
    connectionStatus,
    refreshUsers
  };
};

export default useOnlineUsers;
