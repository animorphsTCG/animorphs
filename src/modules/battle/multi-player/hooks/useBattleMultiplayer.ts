
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/modules/auth';
import { toast } from '@/components/ui/use-toast';
import { AnimorphCard } from '@/types';

export const useBattleMultiplayer = (battleId: string, battleType: 'tournament' | '4player' = 'tournament') => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentRound, setCurrentRound] = useState(1);
  const [isUserTurn, setIsUserTurn] = useState(false);
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const [cardsRevealed, setCardsRevealed] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [playerDecks, setPlayerDecks] = useState<Record<string, AnimorphCard[]>>({});
  const [roundWins, setRoundWins] = useState<Record<string, number>>({});
  const [participants, setParticipants] = useState<any[]>([]);

  // Initial fetch of the battle state
  useEffect(() => {
    if (!battleId || !user) return;

    const fetchBattleState = async () => {
      try {
        setLoading(true);
        
        // Get battle session info
        const { data: battleData, error: battleError } = await supabase
          .from('battle_sessions')
          .select('*')
          .eq('id', battleId)
          .single();

        if (battleError) throw battleError;

        // Get battle state
        const { data: stateData, error: stateError } = await supabase
          .from('battle_state')
          .select('*')
          .eq('battle_session_id', battleId)
          .single();

        if (stateError && stateError.code !== 'PGRST116') throw stateError;

        // Get participants
        const { data: participantsData, error: participantsError } = await supabase
          .rpc('get_battle_participants', { battle_id: battleId });

        if (participantsError) throw participantsError;

        setParticipants(participantsData);
        
        // Get player decks
        const { data: decksData, error: decksError } = await supabase
          .from('battle_player_decks')
          .select('*')
          .eq('battle_session_id', battleId);

        if (decksError) throw decksError;

        // Set state from fetched data
        if (stateData) {
          setCurrentRound(stateData.current_round || 1);
          setCardsRevealed(stateData.cards_revealed || false);
          setSelectedStat(stateData.selected_stat);
          setIsUserTurn(stateData.current_turn_user_id === user.id);
          
          // Process decks
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

        // Process participant wins
        if (participantsData) {
          const wins: Record<string, number> = {};
          participantsData.forEach(p => {
            wins[p.user_id] = p.rounds_won || 0;
          });
          setRoundWins(wins);
        }

        // Check if game is over
        if (battleData.status === 'completed') {
          setGameOver(true);
          setWinner(battleData.winner_id);
        }
      } catch (error) {
        console.error('Error fetching battle state:', error);
        toast({
          title: 'Error',
          description: 'Failed to load battle data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBattleState();
  }, [battleId, user]);

  // Subscribe to battle state changes
  useEffect(() => {
    if (!battleId) return;

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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [battleId, user?.id]);

  // Subscribe to battle actions
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
          
          // Process different action types
          if (action.action_type === 'round_win') {
            const { winner_id, rounds_won } = action.action_data;
            
            // Update round wins
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

  // Subscribe to deck updates
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
          
          // Find participant for this deck
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

  // Function to handle stat selection
  const handleStatSelection = async (stat: string) => {
    if (!user || !isUserTurn || !battleId) return;

    try {
      // Record the action
      const { error: actionError } = await supabase
        .from('battle_actions')
        .insert({
          battle_session_id: battleId,
          participant_id: participants.find(p => p.user_id === user.id)?.participant_id,
          action_type: 'select_stat',
          action_data: { selected_stat: stat }
        });

      if (actionError) throw actionError;

      // Update battle state
      const { error: stateError } = await supabase
        .from('battle_state')
        .update({
          selected_stat: stat,
          cards_revealed: true
        })
        .eq('battle_session_id', battleId);

      if (stateError) throw stateError;

      setSelectedStat(stat);
      setCardsRevealed(true);
    } catch (error) {
      console.error('Error selecting stat:', error);
      toast({
        title: 'Error',
        description: 'Failed to select stat',
        variant: 'destructive'
      });
    }
  };

  return {
    loading,
    currentRound,
    isUserTurn,
    selectedStat,
    cardsRevealed,
    gameOver,
    winner,
    playerDecks,
    roundWins,
    participants,
    handleStatSelection
  };
};
