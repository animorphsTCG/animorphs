
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchAnimorphCards } from "@/lib/db";
import { AnimorphCard } from "@/types";
import CardSelectionScreen from "@/components/battle/CardSelectionScreen";
import BattleScreen from "@/components/battle/BattleScreen";
import { useBattle } from "@/hooks/useBattle";
import { useAI } from "@/hooks/useAI";

const OneVOneBattle = () => {
  const { user } = useAuth();
  const location = useLocation();
  const lobbyData = location.state;
  
  // State for loading cards
  const [isLoading, setIsLoading] = useState(true);
  const [allCards, setAllCards] = useState<AnimorphCard[]>([]);

  // Get username safely from user object
  const getUsername = () => {
    return user?.email?.split('@')[0] || 'Player';
  };

  // Load all cards for selection
  useEffect(() => {
    const loadCards = async () => {
      try {
        const cards = await fetchAnimorphCards(200);
        setAllCards(cards);
      } catch (error) {
        console.error("Error loading cards:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCards();
  }, []);
  
  // Use our battle hook for game state and logic
  const battle = useBattle({ allCards });
  
  // Use AI hook to handle AI turns
  useAI({
    isBattleStarted: battle.isBattleStarted,
    player1Turn: battle.player1Turn,
    selectedStat: battle.selectedStat,
    gameOver: battle.gameOver,
    cardsRevealed: battle.cardsRevealed,
    handleStatSelection: battle.handleStatSelection,
    suddenDeath: battle.suddenDeath
  });

  // Render card selection or battle screen based on game state
  if (!battle.isBattleStarted) {
    return (
      <CardSelectionScreen 
        isLoading={isLoading}
        allCards={allCards}
        selectedCardIds={battle.selectedCardIds}
        toggleCardSelection={battle.toggleCardSelection}
        startBattle={battle.startBattle}
      />
    );
  }
  
  return (
    <BattleScreen
      player1Cards={battle.player1Cards}
      player2Cards={battle.player2Cards}
      player1Turn={battle.player1Turn}
      cardsRevealed={battle.cardsRevealed}
      gameOver={battle.gameOver}
      winner={battle.winner}
      handleStatSelection={battle.handleStatSelection}
      selectedStat={battle.selectedStat}
      player1Wins={battle.player1Wins}
      player2Wins={battle.player2Wins}
      currentRound={battle.currentRound}
      suddenDeath={battle.suddenDeath}
      suddenDeathRound={battle.suddenDeathRound}
      suddenDeathWins={battle.suddenDeathWins}
      message={battle.message}
      username={getUsername()}
    />
  );
};

export default OneVOneBattle;
