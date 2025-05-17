
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/modules/auth';

export interface LobbyParticipant {
  id: string;
  user_id: string;
  player_number: number;
  isReady: boolean;  // Renamed from is_ready to match LobbyUI component
  username?: string;
  profile_image_url?: string;
  isHost?: boolean;   // Renamed from is_host to match LobbyUI component
}

export interface LobbyState {
  id: string;
  name: string;
  host_id: string;
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  battle_type: '1v1' | '3player' | '4player';
  max_players: number;
  useTimer: boolean;  // Renamed from use_timer to match LobbyUI component
  useMusic: boolean;  // Renamed from use_music to match LobbyUI component
  participants: LobbyParticipant[];
}

export const useLobbyState = (lobbyId: string | null) => {
  const { user } = useAuth();
  const [lobbyState, setLobbyState] = useState<LobbyState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!lobbyId) {
      setLobbyState(null);
      setIsLoading(false);
      return;
    }

    const fetchLobbyState = async () => {
      try {
        const { data: lobby, error: lobbyError } = await supabase
          .from('battle_lobbies')
          .select('*')
          .eq('id', lobbyId)
          .single();

        if (lobbyError) throw lobbyError;

        const { data: participants, error: participantsError } = await supabase
          .from('lobby_participants')
          .select(`
            *,
            profiles:user_id (
              username,
              profile_image_url
            )
          `)
          .eq('lobby_id', lobbyId);

        if (participantsError) throw participantsError;

        // Map from snake_case to camelCase for component consumption
        setLobbyState({
          ...lobby,
          useTimer: lobby.use_timer,
          useMusic: lobby.use_music,
          participants: participants.map(p => ({
            id: p.id,
            user_id: p.user_id,
            player_number: p.player_number,
            isReady: p.is_ready,
            isHost: p.user_id === lobby.host_id,
            username: p.profiles?.username,
            profile_image_url: p.profiles?.profile_image_url
          }))
        });
      } catch (error) {
        console.error('Error fetching lobby state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchLobbyState();

    // Subscribe to realtime updates with fixed method
    const lobbyChannel = supabase.channel('lobby_changes');
    
    lobbyChannel.on('*', { 
      event: '*',
      schema: 'public',
      table: 'battle_lobbies' 
    }).subscribe(payload => {
      if (payload.record && payload.record.id === lobbyId) {
        fetchLobbyState();
      }
    });

    lobbyChannel.on('*', { 
      event: '*',
      schema: 'public',
      table: 'lobby_participants' 
    }).subscribe(payload => {
      if (payload.record && payload.record.lobby_id === lobbyId) {
        fetchLobbyState();
      }
    });

    return () => {
      supabase.removeChannel(lobbyChannel);
    };
  }, [lobbyId]);

  return {
    lobbyState,
    isLoading,
    isHost: lobbyState?.host_id === user?.id
  };
};
