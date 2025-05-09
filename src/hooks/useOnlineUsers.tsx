
import { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/modules/auth";

export interface OnlineUser {
  id: string;
  username: string;
  profile_image_url?: string | null;
  status: 'online' | 'away' | 'busy';
  has_paid: boolean;
  last_seen: string;
}

// Define TypeScript interface for the Supabase query result
interface UserPresenceRow {
  user_id: string;
  last_seen: string;
  status: 'online' | 'away' | 'busy';
  profiles: {
    username: string;
    profile_image_url: string | null;
  } | null;
  payment_status: {
    has_paid: boolean;
  } | null;
}

export const useOnlineUsers = () => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Set up realtime subscription for user presence changes
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
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          console.log("Subscribed to user presence changes");
        } else if (status === 'CHANNEL_ERROR') {
          console.error("Error subscribing to user presence changes");
          setError("Failed to subscribe to user presence updates");
        }
      });
      
    // Function to fetch online users
    const fetchOnlineUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Consider users online if they've been seen in the last 2 minutes
        const twoMinutesAgo = new Date();
        twoMinutesAgo.setMinutes(twoMinutesAgo.getMinutes() - 2);
        
        const { data, error } = await supabase
          .from('user_presence')
          .select(`
            user_id,
            last_seen,
            status,
            profiles:user_id (username, profile_image_url),
            payment_status:user_id (has_paid)
          `)
          .gt('last_seen', twoMinutesAgo.toISOString());
          
        if (error) {
          throw error;
        }
        
        if (data) {
          console.log("Online users raw data:", data);
          
          // Safely cast the data to the correct type
          const typedData = data as unknown as UserPresenceRow[];
          
          const formattedUsers: OnlineUser[] = typedData.map(item => ({
            id: item.user_id,
            username: item.profiles?.username || 'Unknown User',
            profile_image_url: item.profiles?.profile_image_url,
            status: item.status,
            has_paid: item.payment_status?.has_paid || false,
            last_seen: item.last_seen
          }));
          
          console.log("Formatted online users:", formattedUsers);
          setOnlineUsers(formattedUsers);
        }
      } catch (err: any) {
        console.error("Error fetching online users:", err);
        setError(err.message || 'Failed to load online users');
      } finally {
        setLoading(false);
      }
    };
    
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
    
    // Initial fetch and presence update
    if (user) {
      updateUserPresence();
      fetchOnlineUsers();
    } else {
      setOnlineUsers([]);
      setLoading(false);
    }
    
    // Set up regular updates (every 20 seconds)
    const presenceInterval = setInterval(() => {
      if (user) updateUserPresence();
    }, 20000);
    
    // Set up regular fetches (every 15 seconds)
    const fetchInterval = setInterval(fetchOnlineUsers, 15000);
    
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
  }, [user]);
  
  return { onlineUsers, loading, error };
};

export default useOnlineUsers;
