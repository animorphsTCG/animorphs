
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/modules/auth';
import { toast } from '@/components/ui/use-toast';
import { useEOSPresence } from './useEOSPresence';

export interface BattleLobbyConfig {
  name: string;
  battleType: '1v1' | '3player' | '4player';
  maxPlayers?: number;
  useTimer?: boolean;
  useMusic?: boolean;
  metadata?: Record<string, any>;
}

export interface LobbyMember {
  id: string;
  username: string;
  profile_image_url?: string | null;
  player_number: number;
  is_ready: boolean;
  is_host: boolean;
  joined_at: string;
}

export const useBattleLobby = (lobbyId?: string) => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [lobbyData, setLobbyData] = useState<any | null>(null);
  const [lobbyMembers, setLobbyMembers] = useState<LobbyMember[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isCreatingLobby, setIsCreatingLobby] = useState(false);
  const [isJoiningLobby, setIsJoiningLobby] = useState(false);
  const [isLeavingLobby, setIsLeavingLobby] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [battleStarted, setBattleStarted] = useState(false);

  // Initialize presence tracking
  const presence = useEOSPresence({
    heartbeatInterval: 10000, // More frequent for lobby members
  });
  
  // Fetch lobby data and members
  const fetchLobbyData = useCallback(async () => {
    if (!lobbyId || !user) return;
    
    try {
      // Get lobby data
      const { data: lobbyData, error: lobbyError } = await supabase
        .from('battle_lobbies')
        .select('*')
        .eq('id', lobbyId)
        .single();
        
      if (lobbyError) throw lobbyError;
      
      setLobbyData(lobbyData);
      setIsHost(lobbyData.host_id === user.id);
      
      // Get members data
      const { data: membersData, error: membersError } = await supabase
        .from('lobby_participants')
        .select(`
          id,
          user_id,
          player_number,
          is_ready,
          join_time,
          profiles:user_id (
            username,
            profile_image_url
          )
        `)
        .eq('lobby_id', lobbyId)
        .is('left_at', null)
        .order('player_number', { ascending: true });
        
      if (membersError) throw membersError;
      
      // Fix here: Correctly handle the profiles data structure
      const formattedMembers: LobbyMember[] = membersData.map(member => {
        // Extract profile data from the nested structure
        // The profiles field is likely returning a single object, not an array
        const profileData = member.profiles as unknown;
        // Type assertion to help TypeScript understand the structure
        const profile = profileData as { username?: string; profile_image_url?: string | null } | null;
        
        return {
          id: member.user_id,
          username: profile?.username || 'Unknown Player',
          profile_image_url: profile?.profile_image_url || null,
          player_number: member.player_number,
          is_ready: member.is_ready,
          is_host: member.user_id === lobbyData.host_id,
          joined_at: member.join_time
        };
      });
      
      setLobbyMembers(formattedMembers);
      
      // Set user's ready status
      const userMember = membersData.find(m => m.user_id === user.id);
      if (userMember) {
        setIsReady(userMember.is_ready);
      }
      
      // Check if battle has started
      setBattleStarted(lobbyData.status === 'active');
      
    } catch (err: any) {
      console.error("Error fetching lobby data:", err);
      setError(err.message || "Failed to load lobby data");
      
      if (err.code === 'PGRST116') { // Not found error
        toast({
          title: "Lobby Not Found",
          description: "This lobby doesn't exist or has been closed",
          variant: "destructive"
        });
        navigate('/battle');
      }
    }
  }, [lobbyId, user, navigate]);
  
  // Subscribe to lobby updates
  useEffect(() => {
    if (!lobbyId || !user) return;
    
    fetchLobbyData();
    
    // Subscribe to lobby changes
    const lobbyChannel = supabase
      .channel(`lobby_updates:${lobbyId}`)
      .on('postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'battle_lobbies', filter: `id=eq.${lobbyId}` },
          (payload) => {
            console.log('Lobby updated:', payload);
            const updatedLobby = payload.new as any;
            setLobbyData(updatedLobby);
            
            if (updatedLobby.status === 'active' && !battleStarted) {
              setBattleStarted(true);
              handleBattleStart(updatedLobby.battle_type);
            }
          })
      .subscribe();
      
    // Subscribe to members changes
    const membersChannel = supabase
      .channel(`lobby_members:${lobbyId}`)
      .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'lobby_participants', filter: `lobby_id=eq.${lobbyId}` }, 
          () => fetchLobbyData())
      .on('postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'lobby_participants', filter: `lobby_id=eq.${lobbyId}` }, 
          () => fetchLobbyData())
      .on('postgres_changes', 
          { event: 'DELETE', schema: 'public', table: 'lobby_participants', filter: `lobby_id=eq.${lobbyId}` }, 
          () => fetchLobbyData())
      .subscribe();
    
    return () => {
      supabase.removeChannel(lobbyChannel);
      supabase.removeChannel(membersChannel);
    };
  }, [lobbyId, user, fetchLobbyData, battleStarted]);
  
  // Create a new lobby
  const createLobby = useCallback(async (config: BattleLobbyConfig) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You need to be logged in to create a battle lobby",
        variant: "destructive"
      });
      return null;
    }
    
    if (!userProfile?.has_paid) {
      toast({
        title: "Full Access Required",
        description: "Only paid users can create battle lobbies",
        variant: "destructive"
      });
      return null;
    }
    
    setIsCreatingLobby(true);
    setError(null);
    
    try {
      // Check user is not already in a battle or lobby
      const { data: userInBattle } = await supabase
        .rpc('user_in_battle', { user_id: user.id });
        
      if (userInBattle) {
        toast({
          title: 'Already in Battle',
          description: 'You are already participating in a battle',
          variant: 'destructive'
        });
        setIsCreatingLobby(false);
        return null;
      }
      
      const { data: userInLobby } = await supabase
        .rpc('user_in_lobby', { user_id: user.id });
        
      if (userInLobby) {
        toast({
          title: 'Already in Lobby',
          description: 'You are already participating in a lobby',
          variant: 'destructive'
        });
        setIsCreatingLobby(false);
        return null;
      }
      
      // Determine max players based on battle type
      const maxPlayers = config.maxPlayers || 
        (config.battleType === '1v1' ? 2 : 
         config.battleType === '3player' ? 3 : 4);
      
      // Create lobby
      const { data: lobby, error: lobbyError } = await supabase
        .from('battle_lobbies')
        .insert({
          name: config.name,
          host_id: user.id,
          battle_type: config.battleType,
          max_players: maxPlayers,
          use_timer: config.useTimer || false,
          use_music: config.useMusic || false,
          requires_payment: true,
          metadata: config.metadata || {}
        })
        .select()
        .single();
        
      if (lobbyError) throw lobbyError;
      
      // Join as first participant
      const { error: participantError } = await supabase
        .from('lobby_participants')
        .insert({
          lobby_id: lobby.id,
          user_id: user.id,
          player_number: 1,
          is_ready: false
        });
        
      if (participantError) throw participantError;
      
      // Update presence for lobby
      presence.setStatus('online');
      
      return lobby;
    } catch (err: any) {
      console.error("Error creating lobby:", err);
      setError(err.message || "Failed to create lobby");
      toast({
        title: "Error",
        description: "Failed to create battle lobby",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsCreatingLobby(false);
    }
  }, [user, userProfile, presence]);
  
  // Join an existing lobby
  const joinLobby = useCallback(async (lobbyId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You need to be logged in to join a battle lobby",
        variant: "destructive"
      });
      return false;
    }
    
    if (!userProfile?.has_paid) {
      toast({
        title: "Full Access Required",
        description: "Only paid users can join battle lobbies",
        variant: "destructive"
      });
      return false;
    }
    
    setIsJoiningLobby(true);
    setError(null);
    
    try {
      // Check if lobby exists and isn't full
      const { data: lobbyData, error: lobbyError } = await supabase
        .from('battle_lobbies')
        .select('*, lobby_participants(count)')
        .eq('id', lobbyId)
        .single();
        
      if (lobbyError) throw lobbyError;
      
      if (lobbyData.status !== 'waiting') {
        toast({
          title: "Cannot Join",
          description: "This lobby is no longer accepting new players",
          variant: "destructive"
        });
        return false;
      }
      
      const participantCount = lobbyData.lobby_participants?.[0]?.count || 0;
      if (participantCount >= lobbyData.max_players) {
        toast({
          title: "Lobby Full",
          description: "This lobby is already full",
          variant: "destructive"
        });
        return false;
      }
      
      // Get current player number
      const { data: participants, error: countError } = await supabase
        .from('lobby_participants')
        .select('player_number')
        .eq('lobby_id', lobbyId)
        .order('player_number', { ascending: false })
        .limit(1);
        
      if (countError) throw countError;
      
      const nextPlayerNumber = (participants && participants.length > 0) 
        ? participants[0].player_number + 1 : 1;
      
      // Join lobby
      const { error: joinError } = await supabase
        .from('lobby_participants')
        .insert({
          lobby_id: lobbyId,
          user_id: user.id,
          player_number: nextPlayerNumber,
          is_ready: false
        });
        
      if (joinError) throw joinError;
      
      // Update presence
      presence.setStatus('online');
      
      return true;
    } catch (err: any) {
      console.error("Error joining lobby:", err);
      setError(err.message || "Failed to join lobby");
      toast({
        title: "Error",
        description: "Failed to join battle lobby",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsJoiningLobby(false);
    }
  }, [user, userProfile, presence]);
  
  // Leave lobby
  const leaveLobby = useCallback(async () => {
    if (!user || !lobbyId) return false;
    
    setIsLeavingLobby(true);
    
    try {
      // Add left_at timestamp
      const { error: leaveError } = await supabase
        .from('lobby_participants')
        .update({ left_at: new Date().toISOString() })
        .eq('lobby_id', lobbyId)
        .eq('user_id', user.id);
        
      if (leaveError) throw leaveError;
      
      // If host is leaving, either assign new host or delete lobby
      if (isHost) {
        // Find next player to be host
        const { data: remainingMembers } = await supabase
          .from('lobby_participants')
          .select('user_id')
          .eq('lobby_id', lobbyId)
          .is('left_at', null)
          .neq('user_id', user.id)
          .order('player_number', { ascending: true })
          .limit(1);
          
        if (remainingMembers && remainingMembers.length > 0) {
          // Transfer host status
          await supabase
            .from('battle_lobbies')
            .update({ host_id: remainingMembers[0].user_id })
            .eq('id', lobbyId);
        } else {
          // Delete lobby if empty
          await supabase
            .from('battle_lobbies')
            .update({ status: 'closed' })
            .eq('id', lobbyId);
        }
      }
      
      return true;
    } catch (err: any) {
      console.error("Error leaving lobby:", err);
      toast({
        title: "Error",
        description: "Failed to leave lobby properly",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLeavingLobby(false);
    }
  }, [user, lobbyId, isHost]);
  
  // Set ready status
  const setReadyStatus = useCallback(async (ready: boolean) => {
    if (!user || !lobbyId) return false;
    
    try {
      const { error } = await supabase
        .from('lobby_participants')
        .update({ is_ready: ready })
        .eq('lobby_id', lobbyId)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      setIsReady(ready);
      return true;
    } catch (err: any) {
      console.error("Error setting ready status:", err);
      toast({
        title: "Error",
        description: "Failed to update ready status",
        variant: "destructive"
      });
      return false;
    }
  }, [user, lobbyId]);
  
  // Start battle (host only)
  const startBattle = useCallback(async () => {
    if (!user || !lobbyId || !isHost) return false;
    
    try {
      // Check if all members are ready
      const notReadyMembers = lobbyMembers.filter(member => !member.is_ready);
      if (notReadyMembers.length > 0) {
        toast({
          title: "Cannot Start Battle",
          description: "All players must be ready to start",
          variant: "destructive"
        });
        return false;
      }
      
      // Check sufficient players
      if (lobbyMembers.length < 2) {
        toast({
          title: "Cannot Start Battle",
          description: "At least 2 players are required to start",
          variant: "destructive"
        });
        return false;
      }
      
      // Update lobby status to active
      const { error } = await supabase
        .from('battle_lobbies')
        .update({ 
          status: 'active',
          started_at: new Date().toISOString()
        })
        .eq('id', lobbyId);
        
      if (error) throw error;
      
      setBattleStarted(true);
      return true;
    } catch (err: any) {
      console.error("Error starting battle:", err);
      toast({
        title: "Error",
        description: "Failed to start battle",
        variant: "destructive"
      });
      return false;
    }
  }, [user, lobbyId, isHost, lobbyMembers]);
  
  // Handle battle start navigation
  const handleBattleStart = useCallback((battleType: string) => {
    if (!lobbyId) return;
    
    toast({
      title: "Battle Starting",
      description: "Preparing the arena...",
    });
    
    setTimeout(() => {
      let battleRoute = '';
      
      switch (battleType) {
        case '1v1':
          battleRoute = `/battle/multiplayer/${lobbyId}`;
          break;
        case '3player':
          battleRoute = `/3-player-battle/${lobbyId}`;
          break;
        case '4player':
          battleRoute = `/4-player-user-lobby/${lobbyId}`;
          break;
        default:
          battleRoute = `/battle/multiplayer/${lobbyId}`;
      }
      
      navigate(battleRoute);
    }, 1000);
  }, [lobbyId, navigate]);
  
  return {
    lobbyData,
    lobbyMembers,
    isHost,
    isReady,
    isCreatingLobby,
    isJoiningLobby, 
    isLeavingLobby,
    error,
    battleStarted,
    createLobby,
    joinLobby,
    leaveLobby,
    setReadyStatus,
    startBattle,
    refreshLobby: fetchLobbyData
  };
};
