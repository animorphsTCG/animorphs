
import { useEffect } from "react";

interface UseAIProps {
  isBattleStarted: boolean;
  player1Turn: boolean;
  selectedStat: string | null;
  gameOver: boolean;
  cardsRevealed: boolean;
  handleStatSelection: (stat: string) => void;
  suddenDeath?: boolean;
}

export const useAI = ({
  isBattleStarted,
  player1Turn,
  selectedStat,
  gameOver,
  cardsRevealed,
  handleStatSelection,
  suddenDeath = false,
}: UseAIProps) => {
  // Handle AI turn
  useEffect(() => {
    if (isBattleStarted && !player1Turn && !selectedStat && !gameOver && !cardsRevealed) {
      // Simulate AI thinking
      const aiThinkingTime = suddenDeath ? 3000 : 2000;
      
      const aiTimeout = setTimeout(() => {
        // AI selects a random stat
        const stats = ['power', 'health', 'attack', 'sats', 'size'];
        const selectedStat = stats[Math.floor(Math.random() * stats.length)];
        handleStatSelection(selectedStat);
      }, aiThinkingTime);
      
      return () => clearTimeout(aiTimeout);
    }
  }, [
    isBattleStarted,
    player1Turn,
    selectedStat,
    gameOver,
    cardsRevealed,
    handleStatSelection,
    suddenDeath
  ]);
};
