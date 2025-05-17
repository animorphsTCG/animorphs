
import { useState, useEffect } from 'react';
import { useAuth } from '@/modules/auth';
import { createChannel } from '@/lib/channel';

export function useEOSLobby(lobbyId?: string) {
  const { user } = useAuth();
  const [lobbyData, setLobbyData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  
  useEffect(() => {
    if (!lobbyId || !user?.id) {
      setLoading(false);
      return;
    }
    
    let channel: any;
    let subscription: any;
    
    const initLobby = async () => {
      try {
        setLoading(true);
        
        // Create channel for lobby
        channel = createChannel(`lobby:${lobbyId}`, user.id);
        subscription = channel.subscribe();
        
        // Mock implementation - in a real app, we would fetch actual lobby data
        setLobbyData({
          id: lobbyId,
          owner: user.id,
          created_at: new Date().toISOString(),
          max_members: 2,
          status: 'open'
        });
        
        // Set members as empty array initially
        setMembers([]);
        
      } catch (err: any) {
        console.error("Error initializing EOS lobby:", err);
        setError(err.message || "Failed to initialize lobby");
      } finally {
        setLoading(false);
      }
    };
    
    initLobby();
    
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
      
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [lobbyId, user]);
  
  const joinLobby = async () => {
    if (!lobbyId || !user?.id) {
      setError("No lobby ID or user");
      return false;
    }
    
    try {
      // Mock implementation - in a real app, we would call EOS API
      setMembers(prev => [...prev, { 
        id: user.id, 
        username: user.displayName || 'User-' + user.id.substring(0, 5),
        joined_at: new Date().toISOString()
      }]);
      
      return true;
    } catch (err: any) {
      console.error("Error joining lobby:", err);
      setError(err.message || "Failed to join lobby");
      return false;
    }
  };
  
  const leaveLobby = async () => {
    if (!lobbyId || !user?.id) {
      return false;
    }
    
    try {
      // Mock implementation - in a real app, we would call EOS API
      setMembers(prev => prev.filter(m => m.id !== user.id));
      return true;
    } catch (err: any) {
      console.error("Error leaving lobby:", err);
      setError(err.message || "Failed to leave lobby");
      return false;
    }
  };
  
  return {
    lobbyData,
    members,
    loading,
    error,
    joinLobby,
    leaveLobby
  };
}
