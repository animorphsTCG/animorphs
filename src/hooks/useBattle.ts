
import { useState, useEffect, useCallback } from 'react';
import { AnimorphCard } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { preventDuplicateMatches, shuffleArray } from "@/lib/battleUtils";

interface UseBattleProps {
  allCards: AnimorphCard[];
}

export const useBattle = ({ allCards }: UseBattleProps) => {
  // State for battle setup
  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([]);
  const [player1Cards, setPlayer1Cards] = useState<AnimorphCard[]>([]);
  const [player2Cards, setPlayer2Cards] = useState<AnimorphCard[]>([]);
  
  // State for battle
  const [isBattleStarted, setIsBattleStarted] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [player1Turn, setPlayer1Turn] = useState(true);
  const [player1Wins, setPlayer1Wins] = useState(0);
  const [player2Wins, setPlayer2Wins] = useState(0);
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const [cardsRevealed, setCardsRevealed] = useState(false);
  const [suddenDeath, setSuddenDeath] = useState(false);
  const [suddenDeathRound, setSuddenDeathRound] = useState(0);
  const [suddenDeathWins, setSuddenDeathWins] = useState({ player1: 0, player2: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<"player1" | "player2" | "draw" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Toggle card selection for deck building
  const toggleCardSelection = (cardId: number) => {
    if (selectedCardIds.includes(cardId)) {
      setSelectedCardIds(selectedCardIds.filter(id => id !== cardId));
    } else {
      if (selectedCardIds.length < 10) {
        setSelectedCardIds([...selectedCardIds, cardId]);
      } else {
        toast({
          title: "Deck Full",
          description: "You can only select 10 cards for your deck.",
        });
      }
    }
  };
  
  // Create AI deck
  const createAIDeck = useCallback(() => {
    return shuffleArray(allCards).slice(0, 10);
  }, [allCards]);
  
  // Start the battle with selected decks
  const startBattle = () => {
    if (selectedCardIds.length < 10) {
      toast({
        title: "Incomplete Deck",
        description: "Please select 10 cards for your deck.",
        variant: "destructive",
      });
      return;
    }
    
    // Create player decks
    let deck1 = selectedCardIds.map(id => allCards.find(card => card.id === id)!);
    
    // For PvP, Player 2 would select their own cards
    // For now, we create an AI opponent
    let deck2 = createAIDeck();
    
    // If there are 3+ identical cards, rearrange to avoid direct comparison
    [deck1, deck2] = preventDuplicateMatches(deck1, deck2);
    
    // Randomly decide who goes first
    const player1StartsFirst = Math.random() > 0.5;
    
    setPlayer1Cards(deck1);
    setPlayer2Cards(deck2);
    setPlayer1Turn(player1StartsFirst);
    setIsBattleStarted(true);
  };
  
  // Handle stat selection for comparison
  const handleStatSelection = (stat: string) => {
    setSelectedStat(stat);
    setCardsRevealed(true);
    
    // Determine winner after a short delay
    setTimeout(() => {
      const currentP1Card = player1Cards[0];
      const currentP2Card = player2Cards[0];
      
      if (!currentP1Card || !currentP2Card) return;
      
      // Compare selected stat
      const p1Value = currentP1Card[stat as keyof AnimorphCard] as number;
      const p2Value = currentP2Card[stat as keyof AnimorphCard] as number;
      
      if (p1Value > p2Value) {
        // Player 1 wins round
        if (suddenDeath) {
          setSuddenDeathWins(prev => ({
            ...prev,
            player1: prev.player1 + 1
          }));
          
          // Check for AI defeat in sudden death
          if (player1Turn) {
            setWinner("player1");
            setGameOver(true);
            setMessage("You won in Sudden Death!");
          } else {
            // Continue sudden death
            setPlayer1Turn(true);
            setSuddenDeathRound(prev => prev + 1);
          }
        } else {
          setPlayer1Wins(prev => prev + 1);
        }
      } else if (p2Value > p1Value) {
        // Player 2 wins round
        if (suddenDeath) {
          setSuddenDeathWins(prev => ({
            ...prev,
            player2: prev.player2 + 1
          }));
          
          // Check for player defeat in sudden death
          if (!player1Turn) {
            setWinner("player2");
            setGameOver(true);
            setMessage("AI won in Sudden Death!");
          } else {
            // Continue sudden death
            setPlayer1Turn(false);
            setSuddenDeathRound(prev => prev + 1);
          }
        } else {
          setPlayer2Wins(prev => prev + 1);
        }
      } else {
        // It's a tie for this round
        // In standard play, neither player gets the win
        toast({
          title: "It's a tie!",
          description: "Neither player wins this round.",
        });
      }
      
      // Reset for next round
      setTimeout(() => {
        // Move used cards to end of deck in normal play
        if (!suddenDeath) {
          setPlayer1Cards(prev => [...prev.slice(1), prev[0]]);
          setPlayer2Cards(prev => [...prev.slice(1), prev[0]]);
          setCurrentRound(prev => prev + 1);
          setPlayer1Turn(!player1Turn);
        }
        
        setCardsRevealed(false);
        setSelectedStat(null);
        
        // Check if normal game is over after 10 rounds
        if (!suddenDeath && currentRound >= 10) {
          if (player1Wins > player2Wins) {
            setWinner("player1");
            setGameOver(true);
            setMessage("You won the match!");
          } else if (player2Wins > player1Wins) {
            setWinner("player2");
            setGameOver(true);
            setMessage("AI won the match!");
          } else {
            // It's a tie after 10 rounds, enter sudden death
            enterSuddenDeath();
          }
        }
        
        // Check for sudden death special ending (6 rounds each)
        if (suddenDeath && suddenDeathWins.player1 >= 6 && suddenDeathWins.player2 >= 6) {
          setWinner("draw");
          setGameOver(true);
          setMessage("!!!WELL PLAYED!!! The match is clearly a draw!");
        }
      }, 1500);
    }, 1500);
  };
  
  // Enter sudden death mode
  const enterSuddenDeath = () => {
    setMessage("!Well Played! Entering Sudden Death, Don't choose and lose a round!");
    
    setTimeout(() => {
      // Shuffle decks
      let newDeck1 = [...player1Cards];
      let newDeck2 = [...player2Cards];
      [newDeck1, newDeck2] = preventDuplicateMatches(shuffleArray(newDeck1), shuffleArray(newDeck2));
      
      setPlayer1Cards(newDeck1);
      setPlayer2Cards(newDeck2);
      setSuddenDeath(true);
      setSuddenDeathRound(1);
      setMessage(null);
    }, 7000);
  };
  
  // Handle message timeouts
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 7000);
      
      return () => clearTimeout(timer);
    }
  }, [message]);
  
  return {
    // State
    selectedCardIds,
    player1Cards,
    player2Cards,
    isBattleStarted,
    currentRound,
    player1Turn,
    player1Wins,
    player2Wins,
    selectedStat,
    cardsRevealed,
    suddenDeath,
    suddenDeathRound,
    suddenDeathWins,
    gameOver,
    winner,
    message,
    // Actions
    toggleCardSelection,
    startBattle,
    handleStatSelection,
  };
};
