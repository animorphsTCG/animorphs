
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/modules/auth';
import { toast } from '@/components/ui/use-toast';

export interface BattleLobbyConfig {
  name: string;
  battleType: '1v1' | '3player' | '4player';
  useTimer: boolean;
  useMusic: boolean;
}

export const useBattleLobby = () => {
  const { user } = useAuth();
  const [isCreatingLobby, setIsCreatingLobby] = useState(false);
  const [currentLobbyId, setCurrentLobbyId] = useState<string | null>(null);

  const createLobby = async (config: BattleLobbyConfig) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a battle lobby",
        variant: "destructive"
      });
      return null;
    }

    setIsCreatingLobby(true);
    try {
      const maxPlayers = config.battleType === '1v1' ? 2 : 
                        config.battleType === '3player' ? 3 : 4;

      const { data: lobby, error } = await supabase
        .from('battle_lobbies')
        .insert({
          name: config.name,
          host_id: user.id,
          battle_type: config.battleType,
          max_players: maxPlayers,
          use_timer: config.useTimer,
          use_music: config.useMusic
        })
        .select()
        .single();

      if (error) throw error;

      // Add host as first participant
      const { error: participantError } = await supabase
        .from('lobby_participants')
        .insert({
          lobby_id: lobby.id,
          user_id: user.id,
          player_number: 1
        });

      if (participantError) throw participantError;

      setCurrentLobbyId(lobby.id);
      return lobby.id;
    } catch (error) {
      console.error('Error creating lobby:', error);
      toast({
        title: "Error",
        description: "Failed to create battle lobby",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsCreatingLobby(false);
    }
  };

  const joinLobby = async (lobbyId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to join a battle lobby",
        variant: "destructive"
      });
      return false;
    }

    try {
      // Get current participant count
      const { data: participants, error: countError } = await supabase
        .from('lobby_participants')
        .select('player_number')
        .eq('lobby_id', lobbyId)
        .order('player_number', { ascending: false });

      if (countError) throw countError;

      const nextPlayerNumber = participants.length + 1;

      const { error: joinError } = await supabase
        .from('lobby_participants')
        .insert({
          lobby_id: lobbyId,
          user_id: user.id,
          player_number: nextPlayerNumber
        });

      if (joinError) throw joinError;

      setCurrentLobbyId(lobbyId);
      return true;
    } catch (error) {
      console.error('Error joining lobby:', error);
      toast({
        title: "Error",
        description: "Failed to join battle lobby",
        variant: "destructive"
      });
      return false;
    }
  };

  const leaveLobby = async (lobbyId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('lobby_participants')
        .delete()
        .match({ lobby_id: lobbyId, user_id: user.id });

      if (error) throw error;

      setCurrentLobbyId(null);
      return true;
    } catch (error) {
      console.error('Error leaving lobby:', error);
      toast({
        title: "Error",
        description: "Failed to leave battle lobby",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    isCreatingLobby,
    currentLobbyId,
    createLobby,
    joinLobby,
    leaveLobby
  };
};
