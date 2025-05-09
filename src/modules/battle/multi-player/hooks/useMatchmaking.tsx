
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/modules/auth';
import { toast } from '@/components/ui/use-toast';
import { AnimorphCard } from '@/types';

export interface MatchmakingOptions {
  deckCards: AnimorphCard[];
  battleType: '1v1' | '3player' | '4player';
}

export const useMatchmaking = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [inQueue, setInQueue] = useState(false);
  const [queueTime, setQueueTime] = useState(0);
  const [queueInterval, setQueueInterval] = useState<NodeJS.Timeout | null>(null);
  const [matchFound, setMatchFound] = useState(false);
  const [matchLobbyId, setMatchLobbyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (queueInterval) {
        clearInterval(queueInterval);
      }
    };
  }, [queueInterval]);
  
  const joinQueue = async (options: MatchmakingOptions) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to join a battle queue",
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
        description: "You need to select exactly 10 cards for your deck",
        variant: "destructive"
      });
      return false;
    }
    
    try {
      setError(null);
      
      // Check if user is already in another battle or lobby
      const { data: userInBattle } = await supabase
        .rpc('user_in_battle', { user_id: user.id });
        
      if (userInBattle) {
        toast({
          title: 'Already in battle',
          description: 'You are already participating in a battle',
          variant: 'destructive'
        });
        return false;
      }
      
      const { data: userInLobby } = await supabase
        .rpc('user_in_lobby', { user_id: user.id });
        
      if (userInLobby) {
        toast({
          title: 'Already in lobby',
          description: 'You are already participating in a lobby',
          variant: 'destructive'
        });
        return false;
      }
      
      // First, check for an available lobby in the matchmaking queue
      const { data: availableLobbies, error: lobbyError } = await supabase
        .from('battle_lobbies')
        .select('*')
        .eq('status', 'waiting')
        .eq('battle_type', options.battleType)
        .eq('requires_payment', true)
        .neq('host_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1);
        
      if (lobbyError) throw lobbyError;
      
      let lobbyId: string;
      
      if (availableLobbies && availableLobbies.length > 0) {
        // Join an existing lobby
        console.log("Joining existing lobby", availableLobbies[0].id);
        lobbyId = availableLobbies[0].id;
        
        // Get current participant count
        const { data: participants, error: participantError } = await supabase
          .from('lobby_participants')
          .select('player_number')
          .eq('lobby_id', lobbyId)
          .order('player_number', { ascending: false });
          
        if (participantError) throw participantError;
        
        const nextPlayerNumber = participants && participants.length > 0 
          ? participants[0].player_number + 1 
          : 1;
        
        // Join as participant
        await supabase
          .from('lobby_participants')
          .insert({
            lobby_id: lobbyId,
            user_id: user.id,
            player_number: nextPlayerNumber,
            is_ready: true
          });
          
        // Update lobby status to in_progress
        await supabase
          .from('battle_lobbies')
          .update({ 
            status: 'in_progress',
            started_at: new Date().toISOString()
          })
          .eq('id', lobbyId);
          
      } else {
        // Create a new lobby for matchmaking
        console.log("Creating new matchmaking lobby");
        const { data: newLobby, error: createError } = await supabase
          .from('battle_lobbies')
          .insert({
            name: `Matchmaking: ${userProfile?.username || 'Anonymous'}`,
            host_id: user.id,
            max_players: options.battleType === '1v1' ? 2 : 
                         options.battleType === '3player' ? 3 : 4,
            battle_type: options.battleType,
            requires_payment: true,
            status: 'waiting'
          })
          .select()
          .single();
          
        if (createError) throw createError;
        
        lobbyId = newLobby.id;
        
        // Join as participant (host)
        await supabase
          .from('lobby_participants')
          .insert({
            lobby_id: lobbyId,
            user_id: user.id,
            player_number: 1,
            is_ready: true
          });
      }
      
      // Start queue timer
      const interval = setInterval(() => {
        setQueueTime(prev => prev + 1);
      }, 1000);
      setQueueInterval(interval);
      
      // Set up subscription to watch for opponent joining and lobby status changes
      const channel = supabase.channel(`lobby_status:${lobbyId}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'battle_lobbies',
          filter: `id=eq.${lobbyId}`
        }, (payload: any) => {
          // Check if status changed to in_progress
          if (payload.new && payload.new.status === 'in_progress') {
            handleMatchFound(lobbyId, options);
          }
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'lobby_participants',
          filter: `lobby_id=eq.${lobbyId}`
        }, () => {
          // Check if this is the last player needed to start
          checkLobbyFull(lobbyId);
        })
        .subscribe();
        
      // Store the channel for cleanup
      setMatchLobbyId(lobbyId);
      setInQueue(true);
      
      return true;
    } catch (err: any) {
      console.error("Error joining queue:", err);
      setError(err.message || "Failed to join matchmaking queue");
      toast({
        title: "Error",
        description: "Failed to join matchmaking queue. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };
  
  const checkLobbyFull = async (lobbyId: string) => {
    try {
      // Get lobby details
      const { data: lobby, error: lobbyError } = await supabase
        .from('battle_lobbies')
        .select('*')
        .eq('id', lobbyId)
        .single();
        
      if (lobbyError) throw lobbyError;
      
      // Get participant count
      const { data: participants, error: participantError } = await supabase
        .from('lobby_participants')
        .select('*')
        .eq('lobby_id', lobbyId);
        
      if (participantError) throw participantError;
      
      // If we have all the players needed, update status to in_progress
      if (participants && participants.length >= lobby.max_players) {
        await supabase
          .from('battle_lobbies')
          .update({ 
            status: 'in_progress',
            started_at: new Date().toISOString()
          })
          .eq('id', lobbyId);
      }
    } catch (err) {
      console.error("Error checking if lobby is full:", err);
    }
  };
  
  const handleMatchFound = (lobbyId: string, options: MatchmakingOptions) => {
    // Stop the queue timer
    if (queueInterval) {
      clearInterval(queueInterval);
      setQueueInterval(null);
    }

    setMatchFound(true);
    setMatchLobbyId(lobbyId);
    
    // Notify user
    toast({
      title: "Match Found!",
      description: "Preparing battle...",
    });
    
    // Send to battle page after short delay
    setTimeout(() => {
      let battleRoute = '';
      
      switch (options.battleType) {
        case '1v1':
          battleRoute = `/battle/multiplayer/${lobbyId}`;
          break;
        case '3player':
          battleRoute = `/3-player-battle/${lobbyId}`;
          break;
        case '4player':
          battleRoute = `/4-player-user-lobby/${lobbyId}`;
          break;
      }
      
      navigate(battleRoute);
    }, 1500);
  };
  
  const leaveQueue = async () => {
    if (!user || !matchLobbyId) return false;
    
    try {
      // Stop the queue timer
      if (queueInterval) {
        clearInterval(queueInterval);
        setQueueInterval(null);
      }
      
      // Remove from lobby
      await supabase
        .from('lobby_participants')
        .delete()
        .eq('lobby_id', matchLobbyId)
        .eq('user_id', user.id);
        
      // If host, delete the lobby
      const { data: lobby } = await supabase
        .from('battle_lobbies')
        .select('host_id')
        .eq('id', matchLobbyId)
        .single();
        
      if (lobby && lobby.host_id === user.id) {
        await supabase
          .from('battle_lobbies')
          .delete()
          .eq('id', matchLobbyId);
      }
      
      setInQueue(false);
      setQueueTime(0);
      setMatchLobbyId(null);
      setMatchFound(false);
      
      toast({
        title: "Left Queue",
        description: "You have left the matchmaking queue",
      });
      
      return true;
    } catch (err: any) {
      console.error("Error leaving queue:", err);
      setError(err.message || "Failed to leave matchmaking queue");
      return false;
    }
  };
  
  return {
    inQueue,
    queueTime,
    matchFound,
    matchLobbyId,
    error,
    joinQueue,
    leaveQueue
  };
};
