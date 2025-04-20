
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/modules/auth';
import { toast } from '@/components/ui/use-toast';
import { AnimorphCard } from '@/types';

export const useBattleMultiplayer = (battleId: string) => {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<any[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [isUserTurn, setIsUserTurn] = useState(false);
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const [cardsRevealed, setCardsRevealed] = useState(false);
  const [gameOver, setGameOver] = useState(false);

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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [battleId, user?.id]);

  // Handle stat selection
  const handleStatSelection = async (stat: string) => {
    if (!isUserTurn || !battleId) return;

    try {
      const { error } = await supabase.from('battle_actions').insert({
        battle_session_id: battleId,
        participant_id: participants.find(p => p.user_id === user?.id)?.id,
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
  };

  return {
    currentRound,
    isUserTurn,
    selectedStat,
    cardsRevealed,
    gameOver,
    handleStatSelection
  };
};
