
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/modules/auth';
import { d1Database } from '@/lib/d1Database';
import { createChannelWithCallback } from '@/lib/channel';
import { toast } from '@/components/ui/use-toast';
import { BattleLobbyConfig, Lobby, Participant } from './types';

export const useBattleLobby = (lobbyId?: string) => {
  const { user, token } = useAuth();
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreatingLobby, setIsCreatingLobby] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isLeavingLobby, setIsLeavingLobby] = useState(false);
  const [battleStarted, setBattleStarted] = useState(false);
  
  // For compatibility with old code using these properties
  const lobbyData = lobby;
  const lobbyMembers = participants;
  
  // Check if user is lobby owner
  useEffect(() => {
    if (lobby && user) {
      setIsOwner(lobby.created_by === user.id);
      setIsHost(lobby.created_by === user.id);
    } else {
      setIsOwner(false);
      setIsHost(false);
    }
  }, [lobby, user]);
  
  // Load lobby data
  const loadLobby = useCallback(async () => {
    if (!lobbyId || !token?.access_token) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Get lobby details
      const lobbyResult = await d1Database
        .from<Lobby>('battle_lobbies')
        .eq('id', lobbyId)
        .single();
      
      if (lobbyResult.error) {
        throw new Error('Lobby not found');
      }
      
      setLobby(lobbyResult.data);
      
      // Check if lobby exists and isn't completed
      if (!lobbyResult.data) {
        setError('Lobby not found');
        return;
      }
      
      if (lobbyResult.data.status === 'completed') {
        setError('This lobby has ended');
        return;
      }
      
      // Get participants
      const participantsResult = await d1Database.query(`
        SELECT lp.*, p.username, p.profile_image_url
        FROM lobby_participants lp
        LEFT JOIN profiles p ON lp.user_id = p.id
        WHERE lp.lobby_id = ?
        ORDER BY lp.player_number ASC
      `, { params: [lobbyId] });
      
      setParticipants(participantsResult || []);
      
    } catch (err) {
      console.error('Error loading lobby:', err);
      setError('Failed to load lobby data');
    } finally {
      setIsLoading(false);
    }
  }, [lobbyId, token]);
  
  // Initial load
  useEffect(() => {
    loadLobby();
  }, [loadLobby]);
  
  // Subscribe to lobby updates
  useEffect(() => {
    if (!lobbyId || !user) return;
    
    const { subscription } = createChannelWithCallback(
      `lobby:${lobbyId}`,
      'player_joined',
      () => {
        loadLobby();
      }
    );
    
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [lobbyId, user, loadLobby]);
  
  // Create new lobby function
  const createLobby = useCallback(async (config: BattleLobbyConfig) => {
    if (!user || !token?.access_token) return null;
    
    try {
      setIsCreatingLobby(true);
      
      // Generate a unique ID for the lobby
      const newLobbyId = crypto.randomUUID();
      
      // Create the lobby
      await d1Database.query(`
        INSERT INTO battle_lobbies (
          id, 
          name, 
          created_by, 
          battle_type, 
          max_players, 
          is_public,
          status,
          created_at
        ) 
        VALUES (?, ?, ?, ?, ?, ?, 'waiting', CURRENT_TIMESTAMP)
      `, {
        params: [
          newLobbyId,
          config.name,
          user.id,
          config.battleType,
          config.maxPlayers,
          config.isPublic ? 1 : 0
        ]
      });
      
      // Add creator as first participant
      await d1Database.query(`
        INSERT INTO lobby_participants (
          id,
          lobby_id, 
          user_id, 
          player_number
        )
        VALUES (?, ?, ?, 1)
      `, {
        params: [
          crypto.randomUUID(),
          newLobbyId,
          user.id
        ]
      });
      
      toast({
        title: "Lobby Created",
        description: `${config.name} lobby is ready`,
      });
      
      return newLobbyId;
    } catch (err) {
      console.error('Error creating lobby:', err);
      toast({
        title: "Error",
        description: "Failed to create lobby",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsCreatingLobby(false);
    }
  }, [user, token]);
  
  // Join lobby function
  const joinLobby = useCallback(async () => {
    if (!lobbyId || !user || !token?.access_token) return false;
    
    try {
      setIsUpdating(true);
      
      // Check if user is already in the lobby
      const existingParticipant = participants.find(p => p.user_id === user.id);
      
      if (existingParticipant) {
        toast({
          title: "Already Joined",
          description: "You're already in this lobby",
        });
        return true;
      }
      
      // Check if lobby is full
      if (participants.length >= (lobby?.max_players || 2)) {
        toast({
          title: "Lobby Full",
          description: "This lobby is already full",
          variant: "destructive"
        });
        return false;
      }
      
      // Join the lobby
      await d1Database.query(`
        INSERT INTO lobby_participants (id, lobby_id, user_id, player_number)
        VALUES (?, ?, ?, ?)
      `, {
        params: [
          crypto.randomUUID(),
          lobbyId,
          user.id,
          participants.length + 1
        ]
      });
      
      // Update local state
      await loadLobby();
      
      // Notify other users
      toast({
        title: "Lobby Joined",
        description: "You've joined the battle lobby",
      });
      
      return true;
    } catch (err) {
      console.error('Error joining lobby:', err);
      toast({
        title: "Join Failed",
        description: "Failed to join the lobby",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [lobbyId, user, token, participants, lobby, loadLobby]);
  
  // Leave lobby function
  const leaveLobby = useCallback(async () => {
    if (!lobbyId || !user || !token?.access_token) return false;
    
    try {
      setIsLeavingLobby(true);
      
      // Remove participant
      await d1Database.query(`
        DELETE FROM lobby_participants 
        WHERE lobby_id = ? AND user_id = ?
      `, {
        params: [lobbyId, user.id]
      });
      
      toast({
        title: "Lobby Left",
        description: "You've left the battle lobby",
      });
      
      return true;
    } catch (err) {
      console.error('Error leaving lobby:', err);
      toast({
        title: "Error",
        description: "Failed to leave the lobby",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLeavingLobby(false);
    }
  }, [lobbyId, user, token]);
  
  // Start battle function
  const startBattle = useCallback(async () => {
    if (!lobbyId || !user || !token?.access_token || !isOwner) return false;
    
    try {
      setIsUpdating(true);
      
      // Check if we have enough players
      if (participants.length < 2) {
        toast({
          title: "Not Enough Players",
          description: "You need at least 2 players to start a battle",
          variant: "destructive"
        });
        return false;
      }
      
      // Update lobby status
      await d1Database.query(`
        UPDATE battle_lobbies
        SET status = 'in_progress'
        WHERE id = ?
      `, {
        params: [lobbyId]
      });
      
      // Create battle session
      const battleId = crypto.randomUUID();
      await d1Database.query(`
        INSERT INTO battle_sessions (
          id, 
          lobby_id, 
          battle_type, 
          created_by, 
          status,
          current_round,
          current_player_index,
          created_at
        )
        VALUES (?, ?, ?, ?, 'in_progress', 1, 0, CURRENT_TIMESTAMP)
      `, {
        params: [
          battleId,
          lobbyId,
          lobby?.battle_type || '1v1',
          user.id
        ]
      });
      
      // Add participants to battle
      for (let i = 0; i < participants.length; i++) {
        const participant = participants[i];
        await d1Database.query(`
          INSERT INTO battle_participants (
            id,
            battle_id,
            user_id,
            player_number,
            rounds_won
          )
          VALUES (?, ?, ?, ?, 0)
        `, {
          params: [
            crypto.randomUUID(),
            battleId,
            participant.user_id,
            participant.player_number
          ]
        });
      }
      
      // Notify all participants
      toast({
        title: "Battle Started",
        description: "The battle has begun!",
      });
      
      setBattleStarted(true);
      
      return battleId;
    } catch (err) {
      console.error('Error starting battle:', err);
      toast({
        title: "Error",
        description: "Failed to start the battle",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [lobbyId, user, token, isOwner, participants, lobby]);
  
  // Kick player function (owner only)
  const kickPlayer = useCallback(async (userId: string) => {
    if (!lobbyId || !user || !token?.access_token || !isOwner) return false;
    
    try {
      setIsUpdating(true);
      
      // Can't kick yourself
      if (userId === user.id) {
        toast({
          title: "Cannot Kick Self",
          description: "You cannot kick yourself from the lobby",
          variant: "destructive"
        });
        return false;
      }
      
      // Remove participant
      await d1Database.query(`
        DELETE FROM lobby_participants 
        WHERE lobby_id = ? AND user_id = ?
      `, {
        params: [lobbyId, userId]
      });
      
      // Update local state
      await loadLobby();
      
      toast({
        title: "Player Kicked",
        description: "Player has been removed from the lobby",
      });
      
      return true;
    } catch (err) {
      console.error('Error kicking player:', err);
      toast({
        title: "Error",
        description: "Failed to kick player",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [lobbyId, user, token, isOwner, loadLobby]);
  
  // Update lobby settings (owner only)
  const updateLobbySettings = useCallback(async (settings: Partial<Lobby>) => {
    if (!lobbyId || !user || !token?.access_token || !isOwner) return false;
    
    try {
      setIsUpdating(true);
      
      // Build update query
      const updates: string[] = [];
      const values: any[] = [];
      
      if (settings.name) {
        updates.push('name = ?');
        values.push(settings.name);
      }
      
      if (settings.max_players) {
        updates.push('max_players = ?');
        values.push(settings.max_players);
      }
      
      if (settings.is_public !== undefined) {
        updates.push('is_public = ?');
        values.push(settings.is_public ? 1 : 0);
      }
      
      if (updates.length === 0) {
        return true; // Nothing to update
      }
      
      // Add lobby ID to values
      values.push(lobbyId);
      
      // Execute update
      await d1Database.query(`
        UPDATE battle_lobbies
        SET ${updates.join(', ')}
        WHERE id = ?
      `, {
        params: values
      });
      
      // Update local state
      await loadLobby();
      
      toast({
        title: "Settings Updated",
        description: "Lobby settings have been updated",
      });
      
      return true;
    } catch (err) {
      console.error('Error updating lobby settings:', err);
      toast({
        title: "Error",
        description: "Failed to update lobby settings",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [lobbyId, user, token, isOwner, loadLobby]);
  
  // Delete lobby (owner only)
  const deleteLobby = useCallback(async () => {
    if (!lobbyId || !user || !token?.access_token || !isOwner) return false;
    
    try {
      setIsUpdating(true);
      
      // Delete participants first (foreign key constraint)
      await d1Database.query(`
        DELETE FROM lobby_participants 
        WHERE lobby_id = ?
      `, {
        params: [lobbyId]
      });
      
      // Delete lobby
      await d1Database.query(`
        DELETE FROM battle_lobbies 
        WHERE id = ?
      `, {
        params: [lobbyId]
      });
      
      toast({
        title: "Lobby Deleted",
        description: "The lobby has been deleted",
      });
      
      return true;
    } catch (err) {
      console.error('Error deleting lobby:', err);
      toast({
        title: "Error",
        description: "Failed to delete lobby",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [lobbyId, user, token, isOwner]);
  
  return {
    lobby,
    participants,
    isLoading,
    isUpdating,
    error,
    isOwner,
    joinLobby,
    leaveLobby,
    startBattle,
    kickPlayer,
    updateLobbySettings,
    deleteLobby,
    refreshLobby: loadLobby,
    createLobby,
    isCreatingLobby,
    
    // For backward compatibility
    lobbyData,
    lobbyMembers,
    isHost,
    isReady,
    isLeavingLobby,
    battleStarted,
  };
};

export default useBattleLobby;
