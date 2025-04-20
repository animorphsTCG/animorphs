
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/modules/auth';
import { toast } from '@/components/ui/use-toast';
import { AnimorphCard } from '@/types';

type BattleMode = 'standard' | 'tournament' | 'public' | 'user';

export const useBattleMultiplayer = (battleId: string, mode: BattleMode = 'standard') => {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<any[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [isUserTurn, setIsUserTurn] = useState(false);
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const [cardsRevealed, setCardsRevealed] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [playerDecks, setPlayerDecks] = useState<Record<string, AnimorphCard[]>>({});
  const [roundWins, setRoundWins] = useState<Record<string, number>>({});

  // Fetch initial battle state
  useEffect(() => {
    if (!battleId || !user) return;

    const fetchBattleState = async () => {
      try {
        // Get battle state
        const { data: stateData, error: stateError } = await supabase
          .from('battle_state')
          .select('*')
          .eq('battle_session_id', battleId)
          .single();

        if (stateError) throw stateError;

        setCurrentRound(stateData.current_round);
        setSelectedStat(stateData.selected_stat);
        setCardsRevealed(stateData.cards_revealed);
        setIsUserTurn(stateData.current_turn_user_id === user.id);

        // Get battle participants
        const { data: participants, error: participantsError } = await supabase
          .rpc('get_battle_participants', { battle_id: battleId });

        if (participantsError) throw participantsError;
        setParticipants(participants);

        // Get player decks
        const { data: decksData, error: decksError } = await supabase
          .from('battle_player_decks')
          .select('*')
          .eq('battle_session_id', battleId);

        if (decksError) throw decksError;

        // Transform deck data
        const decks: Record<string, AnimorphCard[]> = {};
        decksData.forEach((deckInfo) => {
          const participant = participants.find(p => p.participant_id === deckInfo.participant_id);
          if (participant) {
            decks[participant.user_id] = deckInfo.deck_data;
          }
        });
        setPlayerDecks(decks);

        // Calculate round wins
        const wins: Record<string, number> = {};
        participants.forEach((p) => {
          wins[p.user_id] = p.rounds_won || 0;
        });
        setRoundWins(wins);

        // Check if game is over
        const { data: sessionData } = await supabase
          .from('battle_sessions')
          .select('status, winner_id')
          .eq('id', battleId)
          .single();

        if (sessionData && sessionData.status === 'completed') {
          setGameOver(true);
          setWinner(sessionData.winner_id);
        }

      } catch (error) {
        console.error('Error fetching battle state:', error);
        toast({
          title: "Error",
          description: "Failed to load battle state",
          variant: "destructive"
        });
      }
    };

    fetchBattleState();
  }, [battleId, user]);

  // Subscribe to battle state changes
  useEffect(() => {
    if (!battleId) return;

    const channel = supabase
      .channel(`battle:${battleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'battle_player_decks',
          filter: `battle_session_id=eq.${battleId}`
        },
        async () => {
          // Re-fetch decks when they change
          try {
            const { data: decksData } = await supabase
              .from('battle_player_decks')
              .select('*')
              .eq('battle_session_id', battleId);

            if (decksData) {
              const decks: Record<string, AnimorphCard[]> = {};
              decksData.forEach((deckInfo) => {
                const participant = participants.find(p => p.participant_id === deckInfo.participant_id);
                if (participant) {
                  decks[participant.user_id] = deckInfo.deck_data;
                }
              });
              setPlayerDecks(decks);
            }
          } catch (error) {
            console.error('Error updating decks:', error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'battle_participants',
          filter: `battle_id=eq.${battleId}`
        },
        async () => {
          // Re-fetch participants when they change
          try {
            const { data } = await supabase
              .rpc('get_battle_participants', { battle_id: battleId });

            if (data) {
              setParticipants(data);
              
              // Update round wins
              const wins: Record<string, number> = {};
              data.forEach((p) => {
                wins[p.user_id] = p.rounds_won || 0;
              });
              setRoundWins(wins);
            }
          } catch (error) {
            console.error('Error updating participants:', error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'battle_sessions',
          filter: `id=eq.${battleId}`
        },
        (payload) => {
          const newSession = payload.new as any;
          if (newSession.status === 'completed') {
            setGameOver(true);
            setWinner(newSession.winner_id);

            if (newSession.winner_id === user?.id) {
              toast({
                title: "Victory!",
                description: "You won the battle!",
                variant: "default",
              });
            } else {
              const winnerName = participants.find(p => p.user_id === newSession.winner_id)?.username;
              toast({
                title: "Battle Ended",
                description: `${winnerName || 'Another player'} won the battle.`,
                variant: "default",
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [battleId, participants, user?.id]);

  // AI behavior for public lobby mode
  useEffect(() => {
    // Only handle AI moves in public mode
    if (mode !== 'public') return;
    
    // If it's an AI's turn
    const aiParticipant = participants.find(p => p.is_ai);
    
    if (aiParticipant && !selectedStat && participants.some(p => 
      p.user_id !== user?.id && 
      isUserTurn === false && 
      p.is_ai === true
    )) {
      // Add delay to simulate AI thinking
      const aiThinkingTimer = setTimeout(() => {
        // AI selects a random stat
        const stats = ['power', 'health', 'attack', 'sats', 'size'];
        const randomStat = stats[Math.floor(Math.random() * stats.length)];
        
        // Make the AI selection
        handleStatSelection(randomStat, aiParticipant.user_id);
      }, 3000);
      
      return () => clearTimeout(aiThinkingTimer);
    }
  }, [isUserTurn, participants, selectedStat, mode, user?.id]);

  // Handle stat selection
  const handleStatSelection = useCallback(async (stat: string, playerId?: string) => {
    if ((!isUserTurn && !playerId) || !battleId) return;

    try {
      // Find the participant ID for the current user or AI
      const currentPlayerId = playerId || user?.id;
      const participant = participants.find(p => p.user_id === currentPlayerId);
      
      if (!participant) {
        throw new Error("Participant not found");
      }

      const { error } = await supabase.from('battle_actions').insert({
        battle_session_id: battleId,
        participant_id: participant.participant_id,
        action_type: 'select_stat',
        action_data: { stat }
      });

      if (error) throw error;

      setSelectedStat(stat);
    } catch (error) {
      console.error('Error selecting stat:', error);
      toast({
        title: "Error",
        description: "Failed to select stat",
        variant: "destructive"
      });
    }
  }, [isUserTurn, battleId, participants, user?.id]);

  return {
    currentRound,
    isUserTurn,
    selectedStat,
    cardsRevealed,
    gameOver,
    winner,
    playerDecks,
    roundWins,
    handleStatSelection
  };
};
