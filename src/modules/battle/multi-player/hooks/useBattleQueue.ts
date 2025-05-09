
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/modules/auth';
import { toast } from '@/components/ui/use-toast';
import { AnimorphCard } from '@/types';
import { useEOSPresence } from './useEOSPresence';

export interface BattleQueueOptions {
  battleType: '1v1' | '3player' | '4player';
  deckCards: AnimorphCard[];
  metadata?: Record<string, any>;
}

export const useBattleQueue = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [inQueue, setInQueue] = useState(false);
  const [queueTime, setQueueTime] = useState(0);
  const [queueId, setQueueId] = useState<string | null>(null);
  const [matchFound, setMatchFound] = useState(false);
  const [lobbyId, setLobbyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queueIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize presence tracking with more frequent heartbeats while in queue
  const presence = useEOSPresence({
    heartbeatInterval: 10000, // More frequent when in queue
    logActivity: true,
  });
  
  // Start queue timer when inQueue changes
  useEffect(() => {
    if (inQueue) {
      queueIntervalRef.current = setInterval(() => {
        setQueueTime(prev => prev + 1);
      }, 1000);
    } else {
      if (queueIntervalRef.current) {
        clearInterval(queueIntervalRef.current);
        queueIntervalRef.current = null;
      }
      setQueueTime(0);
    }
    
    return () => {
      if (queueIntervalRef.current) {
        clearInterval(queueIntervalRef.current);
        queueIntervalRef.current = null;
      }
    };
  }, [inQueue]);
  
  // Subscribe to match notifications
  useEffect(() => {
    if (!user || !queueId) return;
    
    // Set up realtime subscription first
    const channel = supabase
      .channel(`match_notifications_${user.id}`)
      .on('broadcast', { event: `match:found:${user.id}` }, (payload) => {
        console.log('Received match notification:', payload);
        if (payload.payload && payload.payload.lobby_id) {
          handleMatchFound(payload.payload.lobby_id, payload.payload.battle_type);
        }
      })
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') {
          console.warn('Failed to subscribe to match notifications channel, falling back to polling');
          // Start polling as fallback
          startPollingForMatch();
        } else {
          console.log('Subscribed to match notifications channel');
          // Stop polling if we're subscribed properly
          stopPollingForMatch();
        }
      });
      
    return () => {
      supabase.removeChannel(channel);
      stopPollingForMatch();
    };
  }, [user, queueId]);
  
  // Polling fallback for match checking
  const startPollingForMatch = useCallback(() => {
    if (!user || !inQueue || pollingIntervalRef.current) return;
    
    console.log('Starting polling for match');
    pollingIntervalRef.current = setInterval(async () => {
      if (!user || !queueId) return;
      
      try {
        // Check if user has been matched
        const { data: lobbyData, error: lobbyError } = await supabase
          .from('lobby_members')
          .select('lobby_id, battle_lobbies!inner(battle_type)')
          .eq('user_id', user.id)
          .is('left_at', null)
          .order('joined_at', { ascending: false })
          .limit(1);
          
        if (lobbyError) throw lobbyError;
        
        if (lobbyData && lobbyData.length > 0) {
          const foundLobbyId = lobbyData[0].lobby_id;
          // Check if this is different from our current lobby (if any)
          if (foundLobbyId !== lobbyId) {
            console.log('Found match via polling:', foundLobbyId);
            handleMatchFound(
              foundLobbyId, 
              lobbyData[0].battle_lobbies?.battle_type as '1v1' | '3player' | '4player'
            );
          }
        }
      } catch (err) {
        console.error('Error during match polling:', err);
      }
    }, 5000); // Check every 5 seconds
    
    return () => stopPollingForMatch();
  }, [user, inQueue, queueId, lobbyId]);
  
  const stopPollingForMatch = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);
  
  // Join battle queue
  const joinQueue = useCallback(async (options: BattleQueueOptions) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You need to be logged in to join a battle queue",
        variant: "destructive"
      });
      return false;
    }
    
    if (!userProfile?.has_paid) {
      toast({
        title: "Full Access Required",
        description: "Only paid users can access multiplayer battles",
        variant: "destructive"
      });
      return false;
    }
    
    if (options.deckCards.length !== 10) {
      toast({
        title: "Invalid Deck",
        description: "You need exactly 10 cards for your battle deck",
        variant: "destructive"
      });
      return false;
    }
    
    try {
      setError(null);
      
      // Check user is not already in a battle or lobby
      const { data: userInBattle } = await supabase
        .rpc('user_in_battle', { user_id: user.id });
        
      if (userInBattle) {
        toast({
          title: 'Already in Battle',
          description: 'You are already participating in a battle',
          variant: 'destructive'
        });
        return false;
      }
      
      const { data: userInLobby } = await supabase
        .rpc('user_in_lobby', { user_id: user.id });
        
      if (userInLobby) {
        toast({
          title: 'Already in Lobby',
          description: 'You are already participating in a lobby',
          variant: 'destructive'
        });
        return false;
      }
      
      // Add to battle queue
      const queueEntry = {
        user_id: user.id,
        battle_type: options.battleType,
        deck_data: options.deckCards,
        metadata: {
          ...options.metadata,
          username: userProfile?.username || 'Unknown Player',
          device_info: navigator.userAgent
        }
      };
      
      const { data: queueData, error: queueError } = await supabase
        .from('battle_queue')
        .insert(queueEntry)
        .select()
        .single();
        
      if (queueError) throw queueError;
      
      setQueueId(queueData.id);
      setInQueue(true);
      presence.setStatus('online'); // Ensure online status
      
      toast({
        title: "Joined Queue",
        description: "Searching for opponents...",
      });
      
      // Start polling as a fallback measure
      startPollingForMatch();
      
      return true;
    } catch (err: any) {
      console.error("Error joining battle queue:", err);
      setError(err.message || "Failed to join queue");
      toast({
        title: "Error",
        description: "Failed to join matchmaking queue. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  }, [user, userProfile, presence]);
  
  // Leave battle queue
  const leaveQueue = useCallback(async () => {
    if (!user || !queueId) return false;
    
    try {
      // Remove from queue
      const { error } = await supabase
        .from('battle_queue')
        .delete()
        .eq('id', queueId);
        
      if (error) throw error;
      
      setInQueue(false);
      setQueueId(null);
      stopPollingForMatch();
      
      toast({
        title: "Left Queue",
        description: "You have left the matchmaking queue",
      });
      
      return true;
    } catch (err: any) {
      console.error("Error leaving queue:", err);
      toast({
        title: "Error",
        description: "Failed to leave queue. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  }, [user, queueId]);
  
  // Handle match found
  const handleMatchFound = useCallback((foundLobbyId: string, battleType: '1v1' | '3player' | '4player') => {
    setMatchFound(true);
    setLobbyId(foundLobbyId);
    stopPollingForMatch();
    
    toast({
      title: "Match Found!",
      description: "Preparing battle...",
    });
    
    // Navigate to correct battle page based on battle type
    setTimeout(() => {
      let battleRoute = '';
      
      switch (battleType) {
        case '1v1':
          battleRoute = `/battle/multiplayer/${foundLobbyId}`;
          break;
        case '3player':
          battleRoute = `/3-player-battle/${foundLobbyId}`;
          break;
        case '4player':
          battleRoute = `/4-player-user-lobby/${foundLobbyId}`;
          break;
      }
      
      navigate(battleRoute);
    }, 1500);
  }, [navigate]);
  
  // Format queue time for display (mm:ss)
  const formattedQueueTime = useCallback(() => {
    const minutes = Math.floor(queueTime / 60);
    const seconds = queueTime % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [queueTime]);
  
  return {
    inQueue,
    queueTime,
    formattedQueueTime,
    matchFound,
    error,
    presenceStatus: presence.connectionStatus,
    joinQueue,
    leaveQueue
  };
};
