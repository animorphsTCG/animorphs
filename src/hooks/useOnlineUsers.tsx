
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/modules/auth";
import { resetSupabaseConnection } from '@/lib/supabase';

export interface OnlineUser {
  id: string;
  username: string;
  profile_image_url?: string | null;
  status: 'online' | 'away' | 'busy' | 'offline';
  has_paid: boolean;
  last_seen: string;
}

export const useOnlineUsers = (autoRefreshInterval: number = 15000) => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  
  // Fetch online users with retry logic
  const fetchOnlineUsers = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      // Consider users online if they've been seen in the last 2 minutes
      const twoMinutesAgo = new Date();
      twoMinutesAgo.setMinutes(twoMinutesAgo.getMinutes() - 2);
      
      // First, get online users from user_presence table
      const { data: onlineUserIds, error: presenceError } = await supabase
        .from('user_presence')
        .select('user_id, last_seen, status')
        .gt('last_seen', twoMinutesAgo.toISOString())
        .in('status', ['online', 'away', 'busy']);
        
      if (presenceError) {
        throw presenceError;
      }
      
      if (!onlineUserIds || onlineUserIds.length === 0) {
        // No online users found
        console.log("No online users found");
        setOnlineUsers([]);
        setLoading(false);
        
        // Reset reconnect attempts on success (even if no users found)
        if (reconnectAttempts > 0) {
          setReconnectAttempts(0);
        }
        
        if (connectionStatus !== 'connected') {
          setConnectionStatus('connected');
        }
        
        return;
      }

      console.log("Online user IDs found:", onlineUserIds);
      
      // Then, fetch profile data for these users
      const userIds = onlineUserIds.map(u => u.user_id);
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, profile_image_url')
        .in('id', userIds);
        
      if (profilesError) {
        throw profilesError;
      }

      // Separately fetch payment status for the users
      const { data: paymentData, error: paymentError } = await supabase
        .from('payment_status')
        .select('id, has_paid')
        .in('id', userIds);
        
      if (paymentError) {
        throw paymentError;
      }
      
      console.log("Profiles data:", profilesData);
      console.log("Payment data:", paymentData);
      
      // Combine the data
      const formattedUsers: OnlineUser[] = onlineUserIds.map(presence => {
        const profile = profilesData?.find(p => p.id === presence.user_id);
        const payment = paymentData?.find(p => p.id === presence.user_id);
        
        return {
          id: presence.user_id,
          username: profile?.username || 'Unknown User',
          profile_image_url: profile?.profile_image_url,
          status: presence.status,
          has_paid: payment?.has_paid || false,
          last_seen: presence.last_seen
        };
      });
      
      console.log("Formatted online users:", formattedUsers);
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
        // Force reconnect after 3 failures
        resetSupabaseConnection();
        setConnectionStatus('disconnected');
      }
    } finally {
      setLoading(false);
    }
  }, [reconnectAttempts, connectionStatus]);
  
  // Set up realtime subscription for user presence changes
  useEffect(() => {
    // Initial fetch
    fetchOnlineUsers();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('user-presence-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'user_presence' }, 
        () => fetchOnlineUsers()
      )
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'user_presence' }, 
        () => fetchOnlineUsers()
      )
      .on('system', { event: 'disconnect' }, () => {
        console.log('Realtime system disconnected');
        setConnectionStatus('disconnected');
      })
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          console.log("Subscribed to user presence changes");
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          console.error("Error subscribing to user presence changes");
          setError("Failed to subscribe to user presence updates");
          setConnectionStatus('disconnected');
          
          // Attempt reconnect
          const attempts = reconnectAttempts + 1;
          setReconnectAttempts(attempts);
          
          if (attempts >= 3) {
            resetSupabaseConnection();
          }
        }
      });
    
    // Handle our own presence
    const updateUserPresence = async () => {
      if (!user) return;
      
      try {
        const now = new Date().toISOString();
        await supabase
          .from('user_presence')
          .upsert({
            user_id: user.id,
            last_seen: now,
            status: 'online'
          }, { onConflict: 'user_id' });
          
        console.log("Updated user presence for user:", user.id);
      } catch (err) {
        console.error("Error updating presence:", err);
      }
    };
    
    // Initial presence update
    if (user) {
      updateUserPresence();
    }
    
    // Set up regular updates (every 20 seconds)
    const presenceInterval = setInterval(() => {
      if (user) updateUserPresence();
    }, 20000);
    
    // Set up regular fetches
    const fetchInterval = setInterval(() => fetchOnlineUsers(), autoRefreshInterval);
    
    // Clean up
    return () => {
      clearInterval(presenceInterval);
      clearInterval(fetchInterval);
      supabase.removeChannel(channel);
      
      // Set presence to offline on unmount if user exists
      if (user) {
        supabase
          .from('user_presence')
          .update({ status: 'offline' })
          .eq('user_id', user.id)
          .then(null, err => console.error("Error updating presence on unmount:", err));
      }
    };
  }, [user, fetchOnlineUsers, autoRefreshInterval, reconnectAttempts]);
  
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
