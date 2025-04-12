
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/ClerkAuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2, RefreshCw } from "lucide-react";
import { AnimorphCard } from "@/types";
import { fetchAnimorphCards } from "@/lib/db";
import { 
  preventDuplicateMatches, 
  shuffleArray, 
  compareStats 
} from "@/lib/battleUtils";
import BattleCardDisplay from "@/components/BattleCardDisplay";

const OneVOneBattle = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const lobbyData = location.state;
  
  // State for battle setup
  const [isLoading, setIsLoading] = useState(true);
  const [allCards, setAllCards] = useState<AnimorphCard[]>([]);
  const [player1Cards, setPlayer1Cards] = useState<AnimorphCard[]>([]);
  const [player2Cards, setPlayer2Cards] = useState<AnimorphCard[]>([]);
  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([]);
  
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

  // Get username safely from user object
  const getUsername = () => {
    return user?.username || user?.email?.split('@')[0] || 'Player';
  };

  // Load all cards for selection
  useEffect(() => {
    const loadCards = async () => {
      try {
        const cards = await fetchAnimorphCards(200);
        setAllCards(cards);
      } catch (error) {
        console.error("Error loading cards:", error);
        toast({
          title: "Error",
          description: "Failed to load cards. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadCards();
  }, []);
  
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
  
  // Handle AI deck selection
  const createAIDeck = useCallback(() => {
    // Randomly select 10 cards for AI
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
  }, [isBattleStarted, player1Turn, selectedStat, gameOver, cardsRevealed]);
  
  // Handle message timeouts
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 7000);
      
      return () => clearTimeout(timer);
    }
  }, [message]);
  
  // Render card selection screen
  if (!isBattleStarted) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="border-2 border-fantasy-primary bg-black/70">
          <CardHeader>
            <CardTitle className="text-3xl font-fantasy text-fantasy-accent">1v1 Battle</CardTitle>
            <CardDescription>Select 10 cards for your battle deck</CardDescription>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-fantasy-accent mr-2" />
                <p>Loading cards...</p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex justify-between items-center">
                  <h3 className="text-xl font-medium">
                    Selected: {selectedCardIds.length} / 10 cards
                  </h3>
                  <Button 
                    className="fantasy-button"
                    onClick={startBattle}
                    disabled={selectedCardIds.length !== 10}
                  >
                    Start Battle
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                  {allCards.map(card => (
                    <div 
                      key={card.id}
                      className={`cursor-pointer transition-all ${
                        selectedCardIds.includes(card.id) 
                          ? "scale-105 ring-2 ring-fantasy-accent" 
                          : "opacity-90 hover:opacity-100"
                      }`}
                      onClick={() => toggleCardSelection(card.id)}
                    >
                      <img 
                        src={card.image_url} 
                        alt={card.nft_name} 
                        className="w-full h-32 object-cover rounded-md"
                      />
                      <div className="mt-1 text-xs text-center">
                        {card.nft_name}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="border-2 border-fantasy-primary bg-black/70">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-3xl font-fantasy text-fantasy-accent">
              {suddenDeath ? "Sudden Death" : "1v1 Battle"}
            </CardTitle>
            
            <div className="flex items-center gap-4">
              {suddenDeath && (
                <div className="bg-red-500/20 px-3 py-1 rounded-full">
                  SD Round: {suddenDeathRound}
                </div>
              )}
              
              <div className="bg-fantasy-primary/20 p-3 rounded">
                <p className="text-lg">Round: {currentRound} / 10</p>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {message && (
            <div className="bg-fantasy-accent/20 p-4 rounded-md text-center mb-8">
              <p className="text-lg font-bold">{message}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center">
            <BattleCardDisplay
              card={player1Cards[0]}
              isFlipped={true}
              isActive={player1Turn && !cardsRevealed && !gameOver}
              roundWins={suddenDeath ? suddenDeathWins.player1 : player1Wins}
              playerName={getUsername()}
              onStatSelect={player1Turn && !cardsRevealed && !gameOver ? handleStatSelection : undefined}
              selectedStat={selectedStat}
            />
            
            <BattleCardDisplay
              card={player2Cards[0]}
              isFlipped={cardsRevealed}
              isActive={!player1Turn && !cardsRevealed && !gameOver}
              roundWins={suddenDeath ? suddenDeathWins.player2 : player2Wins}
              playerName="AI Opponent"
            />
          </div>
          
          {gameOver && (
            <div className="mt-8 text-center">
              <div className="bg-fantasy-accent/30 p-6 rounded mb-6">
                <h3 className="text-2xl font-bold mb-2">Game Over!</h3>
                <p className="text-xl">
                  {winner === "player1" && "You won the battle!"}
                  {winner === "player2" && "AI won the battle!"}
                  {winner === "draw" && "The battle ended in a draw!"}
                </p>
              </div>
              
              <div className="flex justify-center gap-4">
                <Button 
                  className="fantasy-button"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Play Again
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => navigate("/battle")}
                >
                  Back to Battle Menu
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OneVOneBattle;
