
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/modules/auth';
import { d1Database } from '@/lib/d1Database';
import { createChannelWithCallback } from '@/lib/channel';
import { toast } from '@/components/ui/use-toast';

// Export the component correctly
const useBattleMultiplayer = (battleId: string, battleType: string = '1v1') => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<any[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [playerDecks, setPlayerDecks] = useState<Record<string, any[]>>({});
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const [cardsRevealed, setCardsRevealed] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [roundWins, setRoundWins] = useState<Record<string, number>>({});
  const [isUserTurn, setIsUserTurn] = useState(false);
  
  // Load battle data
  const loadBattleData = useCallback(async () => {
    if (!battleId) return;
    
    try {
      setLoading(true);
      
      // Get battle info
      const battleResult = await d1Database.from('battle_sessions')
        .eq('id', battleId)
        .single();
      
      if (battleResult.error || !battleResult.data.length) {
        toast({
          title: "Error",
          description: "Battle not found",
          variant: "destructive"
        });
        return;
      }
      
      const battle = battleResult.data[0];
      
      // Get participants
      const participantsResult = await d1Database.query(`
        SELECT bp.*, p.username 
        FROM battle_participants bp
        JOIN profiles p ON bp.user_id = p.id
        WHERE bp.battle_id = ?
        ORDER BY bp.player_number ASC
      `, { params: [battleId] });
      
      setParticipants(participantsResult || []);
      
      // Set up game state
      const currentPlayerIndex = battle.current_player_index || 0;
      const currentPlayerId = participantsResult?.[currentPlayerIndex]?.user_id;
      
      setIsUserTurn(currentPlayerId === user?.id);
      setCurrentRound(battle.current_round || 1);
      setSelectedStat(battle.selected_stat || null);
      setCardsRevealed(battle.cards_revealed || false);
      setGameOver(battle.is_complete || false);
      setWinner(battle.winner_id);
      
      // Get round wins
      if (participantsResult) {
        const wins: Record<string, number> = {};
        participantsResult.forEach(p => {
          wins[p.user_id] = p.rounds_won || 0;
        });
        setRoundWins(wins);
      }
      
      // Get player decks
      if (participantsResult) {
        const decks: Record<string, any[]> = {};
        
        for (const participant of participantsResult) {
          // Get participant's cards
          const cardsResult = await d1Database.query(`
            SELECT bc.*, ac.*
            FROM battle_cards bc
            JOIN animorph_cards ac ON bc.card_id = ac.id
            WHERE bc.battle_id = ? AND bc.participant_id = ?
            ORDER BY bc.card_order ASC
          `, { params: [battleId, participant.id] });
          
          decks[participant.user_id] = cardsResult || [];
        }
        
        setPlayerDecks(decks);
      }
      
    } catch (err) {
      console.error("Error loading battle data:", err);
      toast({
        title: "Error",
        description: "Failed to load battle data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [battleId, user?.id]);
  
  // Initial load
  useEffect(() => {
    loadBattleData();
  }, [loadBattleData]);
  
  // Set up real-time updates
  useEffect(() => {
    if (!battleId || !user?.id) return;
    
    // Subscribe to battle updates
    const { subscription } = createChannelWithCallback(
      `battle:${battleId}`,
      'update',
      () => {
        loadBattleData();
      }
    );
    
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [battleId, user?.id, loadBattleData]);
  
  // Handle stat selection
  const handleStatSelection = useCallback(async (stat: string) => {
    if (!isUserTurn || !user?.id || !battleId) return;
    
    try {
      setSelectedStat(stat);
      
      // Update battle state in database
      await d1Database.query(`
        UPDATE battle_sessions 
        SET selected_stat = ?, 
            cards_revealed = 1,
            last_updated = CURRENT_TIMESTAMP
        WHERE id = ?
      `, { params: [stat, battleId] });
      
      // In a real implementation, we would calculate the round result here
      // For now, we just update the UI and wait for the next update from the server
      setCardsRevealed(true);
      
    } catch (err) {
      console.error("Error selecting stat:", err);
      toast({
        title: "Error",
        description: "Failed to select stat",
        variant: "destructive"
      });
    }
  }, [isUserTurn, user?.id, battleId]);
  
  // Mock functions for other actions
  const handleCardPlay = useCallback(() => {
    toast({
      title: "Card Played",
      description: "Your card has been played"
    });
  }, []);
  
  const handleTargetSelection = useCallback((targetId: string) => {
    toast({
      title: "Target Selected",
      description: `Selected player as target`
    });
  }, []);
  
  return {
    loading,
    participants,
    currentRound,
    playerDecks,
    selectedStat,
    cardsRevealed,
    gameOver,
    winner,
    roundWins,
    isUserTurn,
    handleStatSelection,
    handleCardPlay,
    handleTargetSelection,
    refreshBattle: loadBattleData
  };
};

export { useBattleMultiplayer };
export default useBattleMultiplayer;
