
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/modules/auth';

export interface LobbyParticipant {
  id: string;
  user_id: string;
  player_number: number;
  is_ready: boolean;
  username?: string;
  profile_image_url?: string;
}

export interface LobbyState {
  id: string;
  name: string;
  host_id: string;
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  battle_type: '1v1' | '3player' | '4player';
  max_players: number;
  use_timer: boolean;
  use_music: boolean;
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

        setLobbyState({
          ...lobby,
          participants: participants.map(p => ({
            id: p.id,
            user_id: p.user_id,
            player_number: p.player_number,
            is_ready: p.is_ready,
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

    // Subscribe to realtime updates
    const lobbyChannel = supabase
      .channel('lobby_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'battle_lobbies', filter: `id=eq.${lobbyId}` },
        fetchLobbyState
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'lobby_participants', filter: `lobby_id=eq.${lobbyId}` },
        fetchLobbyState
      )
      .subscribe();

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
