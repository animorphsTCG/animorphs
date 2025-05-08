
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

export const useOnlineUsers = () => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!user) {
      setOnlineUsers([]);
      setLoading(false);
      return;
    }
    
    // Handle our own presence
    const updateUserPresence = async () => {
      try {
        const now = new Date().toISOString();
        await supabase
          .from('user_presence')
          .upsert({
            user_id: user.id,
            last_seen: now,
            status: 'online'
          }, { onConflict: 'user_id' });
      } catch (err) {
        console.error("Error updating presence:", err);
      }
    };
    
    // Update presence on load
    updateUserPresence();
    
    // Set up regular updates (every 30 seconds)
    const presenceInterval = setInterval(updateUserPresence, 30000);
    
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
          .gt('last_seen', twoMinutesAgo.toISOString())
          .neq('user_id', user.id); // Exclude current user
          
        if (error) {
          throw error;
        }
        
        const formattedUsers: OnlineUser[] = data.map(item => ({
          id: item.user_id,
          username: item.profiles?.username || 'Unknown User',
          profile_image_url: item.profiles?.profile_image_url,
          status: item.status,
          has_paid: item.payment_status?.has_paid || false,
          last_seen: item.last_seen
        }));
        
        setOnlineUsers(formattedUsers);
      } catch (err) {
        console.error("Error fetching online users:", err);
        setError(err.message || 'Failed to load online users');
      } finally {
        setLoading(false);
      }
    };
    
    // Initial fetch
    fetchOnlineUsers();
    
    // Set up regular fetches (every 10 seconds)
    const fetchInterval = setInterval(fetchOnlineUsers, 10000);
    
    // Set up realtime subscription for presence changes
    const channel = supabase
      .channel('presence-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'user_presence' }, 
        fetchOnlineUsers
      )
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'user_presence' }, 
        fetchOnlineUsers
      )
      .subscribe();
    
    // Clean up
    return () => {
      clearInterval(presenceInterval);
      clearInterval(fetchInterval);
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  return { onlineUsers, loading, error };
};

export default useOnlineUsers;
