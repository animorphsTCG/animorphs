
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/modules/auth';
import { toast } from '@/components/ui/use-toast';
import { AnimorphCard } from '@/types';
import { measure } from '@/lib/monitoring';

export type BattleType = 'tournament' | '4player' | 'user' | 'public' | '3player';

export const useBattleMultiplayer = (
  battleId: string, 
  battleType: BattleType = 'tournament'
) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [currentRound, setCurrentRound] = useState(1);
  const [isUserTurn, setIsUserTurn] = useState(false);
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const [cardsRevealed, setCardsRevealed] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [playerDecks, setPlayerDecks] = useState<Record<string, AnimorphCard[]>>({});
  const [roundWins, setRoundWins] = useState<Record<string, number>>({});
  const [participants, setParticipants] = useState<any[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);

  const fetchBattleState = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      
      const { data: battleData, error: battleError } = await supabase
        .from('battle_sessions')
        .select('*')
        .eq('id', battleId)
        .single();

      if (battleError) {
        throw battleError;
      }

      const { data: stateData, error: stateError } = await supabase
        .from('battle_state')
        .select('*')
        .eq('battle_session_id', battleId)
        .single();

      if (stateError && stateError.code !== 'PGRST116') {
        throw stateError;
      }

      const { data: participantsData, error: participantsError } = await supabase
        .rpc('get_battle_participants', { battle_id: battleId });

      if (participantsError) {
        throw participantsError;
      }

      setParticipants(participantsData);
      
      const { data: decksData, error: decksError } = await supabase
        .from('battle_player_decks')
        .select('*')
        .eq('battle_session_id', battleId);

      if (decksError) {
        throw decksError;
      }

      if (stateData) {
        setCurrentRound(stateData.current_round || 1);
        setCardsRevealed(stateData.cards_revealed || false);
        setSelectedStat(stateData.selected_stat);
        setIsUserTurn(stateData.current_turn_user_id === user?.id);
        
        if (decksData && decksData.length > 0) {
          const processedDecks: Record<string, AnimorphCard[]> = {};
          
          decksData.forEach(deck => {
            const participant = participantsData.find(p => p.participant_id === deck.participant_id);
            if (participant) {
              processedDecks[participant.user_id] = deck.deck_data;
            }
          });
          
          setPlayerDecks(processedDecks);
        }
      }

      if (participantsData) {
        const wins: Record<string, number> = {};
        participantsData.forEach(p => {
          wins[p.user_id] = p.rounds_won || 0;
        });
        setRoundWins(wins);
      }

      if (battleData.status === 'completed') {
        setGameOver(true);
        setWinner(battleData.winner_id);
      }
      
      setLastError(null);
      setConnectionStatus('connected');
    } catch (error: any) {
      console.error('Error fetching battle state:', error);
      setLastError(error.message);
      
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`Retrying fetch in ${delay}ms (attempt ${retryCount + 1}/3)`);
        setTimeout(() => fetchBattleState(retryCount + 1), delay);
      } else {
        toast({
          title: 'Connection Error',
          description: 'Failed to load battle data. Please refresh the page.',
          variant: 'destructive'
        });
        setConnectionStatus('disconnected');
      }
    } finally {
      setLoading(false);
    }
  }, [battleId, user?.id]);

  useEffect(() => {
    if (!battleId || !user) return;
    
    fetchBattleState();
  }, [battleId, user, fetchBattleState]);

  useEffect(() => {
    if (!battleId) return;
    
    let retryCount = 0;
    let retryTimeout: NodeJS.Timeout | null = null;

    const setupChannel = () => {
      const channel = supabase
        .channel(`battle_state:${battleId}`)
        .on(
          'postgres_changes',
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'battle_state',
            filter: `battle_session_id=eq.${battleId}`
          },
          (payload) => {
            const newState = payload.new as any;
            
            setCurrentRound(newState.current_round);
            setCardsRevealed(newState.cards_revealed);
            setSelectedStat(newState.selected_stat);
            setIsUserTurn(newState.current_turn_user_id === user?.id);
            
            retryCount = 0;
          }
        )
        .on('presence', { event: 'sync' }, () => {
          setConnectionStatus('connected');
          retryCount = 0;
        })
        .on('system', { event: 'disconnect' }, () => {
          console.log('Realtime disconnected');
          setConnectionStatus('disconnected');
          handleReconnect();
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Connected to realtime for battle state');
            setConnectionStatus('connected');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error(`Realtime subscription error: ${status}`);
            setConnectionStatus('disconnected');
            handleReconnect();
          }
        });

      return channel;
    };

    const handleReconnect = () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }

      const delay = Math.min(Math.pow(2, retryCount) * 1000, 10000);
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${retryCount + 1})`);
      
      retryTimeout = setTimeout(() => {
        fetchBattleState(retryCount);
        retryCount++;
      }, delay);
    };

    const channel = setupChannel();

    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      supabase.removeChannel(channel);
    };
  }, [battleId, user?.id, fetchBattleState]);

  useEffect(() => {
    if (!battleId) return;
    
    const channel = supabase
      .channel(`battle_actions:${battleId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'battle_actions',
          filter: `battle_session_id=eq.${battleId}`
        },
        (payload) => {
          const action = payload.new as any;
          
          if (action.action_type === 'round_win') {
            const { winner_id, rounds_won } = action.action_data;
            
            setRoundWins(prev => ({
              ...prev,
              [winner_id]: rounds_won
            }));
          } 
          else if (action.action_type === 'game_over') {
            setGameOver(true);
            setWinner(action.action_data.winner_id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [battleId]);

  useEffect(() => {
    if (!battleId) return;
    
    const channel = supabase
      .channel(`battle_decks:${battleId}`)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'battle_player_decks',
          filter: `battle_session_id=eq.${battleId}`
        },
        (payload) => {
          const deck = payload.new as any;
          
          const participant = participants.find(p => p.participant_id === deck.participant_id);
          
          if (participant) {
            setPlayerDecks(prev => ({
              ...prev,
              [participant.user_id]: deck.deck_data
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [battleId, participants]);

  const handleStatSelection = useCallback(async (stat: string) => {
    if (!user || !isUserTurn || !battleId) return;

    try {
      await performStatSelection(stat, battleId, user.id, participants);

      setSelectedStat(stat);
      setCardsRevealed(true);
    } catch (error: any) {
      console.error('Error selecting stat:', error);
      toast({
        title: 'Action Failed',
        description: 'Failed to select stat. Please try again.',
        variant: 'destructive'
      });
    }
  }, [user, isUserTurn, battleId, participants]);

  const performStatSelection = measure('battle_select_stat')(
    async (stat: string, battleId: string, userId: string, participants: any[]) => {
      const participantId = participants.find(p => p.user_id === userId)?.participant_id;
      
      if (!participantId) {
        throw new Error('Participant not found');
      }

      const { error: actionError } = await supabase
        .from('battle_actions')
        .insert({
          battle_session_id: battleId,
          participant_id: participantId,
          action_type: 'select_stat',
          action_data: { selected_stat: stat }
        });

      if (actionError) throw actionError;

      const { error: stateError } = await supabase
        .from('battle_state')
        .update({
          selected_stat: stat,
          cards_revealed: true
        })
        .eq('battle_session_id', battleId);

      if (stateError) throw stateError;
    }
  );

  // Add these missing methods
  const handleCardPlay = useCallback(async () => {
    if (!user || !isUserTurn || !battleId) return;
    
    try {
      const participantId = participants.find(p => p.user_id === user.id)?.participant_id;
      
      if (!participantId) {
        throw new Error('Participant not found');
      }
      
      const { error } = await supabase
        .from('battle_actions')
        .insert({
          battle_session_id: battleId,
          participant_id: participantId,
          action_type: 'play_card',
          action_data: {}
        });
        
      if (error) throw error;
      
      toast({
        title: 'Card Played',
        description: 'You played a card successfully',
      });
      
    } catch (error: any) {
      console.error('Error playing card:', error);
      toast({
        title: 'Action Failed',
        description: 'Failed to play card. Please try again.',
        variant: 'destructive'
      });
    }
  }, [user, isUserTurn, battleId, participants]);
  
  const handleTargetSelection = useCallback(async (targetUserId: string) => {
    if (!user || !isUserTurn || !battleId) return;
    
    try {
      const participantId = participants.find(p => p.user_id === user.id)?.participant_id;
      const targetParticipantId = participants.find(p => p.user_id === targetUserId)?.participant_id;
      
      if (!participantId || !targetParticipantId) {
        throw new Error('Participant not found');
      }
      
      const { error } = await supabase
        .from('battle_actions')
        .insert({
          battle_session_id: battleId,
          participant_id: participantId,
          action_type: 'select_target',
          action_data: { target_participant_id: targetParticipantId }
        });
        
      if (error) throw error;
      
      toast({
        title: 'Target Selected',
        description: 'You selected a target successfully',
      });
      
    } catch (error: any) {
      console.error('Error selecting target:', error);
      toast({
        title: 'Action Failed',
        description: 'Failed to select target. Please try again.',
        variant: 'destructive'
      });
    }
  }, [user, isUserTurn, battleId, participants]);

  return {
    loading,
    connectionStatus,
    currentRound,
    isUserTurn,
    selectedStat,
    cardsRevealed,
    gameOver,
    winner,
    playerDecks,
    roundWins,
    participants,
    lastError,
    handleStatSelection,
    handleCardPlay,
    handleTargetSelection,
    refreshBattleState: fetchBattleState
  };
};
