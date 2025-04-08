
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Loader2, RefreshCw } from "lucide-react";
import { AnimorphCard } from "@/types";
import { fetchAnimorphCards, getRandomDeck } from "@/lib/db";
import { compareStats } from "@/lib/battleUtils";
import BattleCardDisplay from "@/components/BattleCardDisplay";
import { useNavigate } from "react-router-dom";

const statsOptions = ['power', 'health', 'attack', 'sats', 'size'];

const VisitorDemoBattle = () => {
  const navigate = useNavigate();
  
  // Player decks
  const [playerDeck, setPlayerDeck] = useState<AnimorphCard[]>([]);
  const [aiDeck, setAiDeck] = useState<AnimorphCard[]>([]);
  
  // Game state
  const [round, setRound] = useState(1);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [playerWins, setPlayerWins] = useState(0);
  const [aiWins, setAiWins] = useState(0);
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const [cardsRevealed, setCardsRevealed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  // Initialize game with random deck
  useEffect(() => {
    const initGame = async () => {
      try {
        // Get all cards to separate into two decks
        const allCards = await fetchAnimorphCards(20);
        
        if (allCards.length >= 20) {
          // Split cards into two decks
          const shuffled = [...allCards].sort(() => Math.random() - 0.5);
          setPlayerDeck(shuffled.slice(0, 10));
          setAiDeck(shuffled.slice(10, 20));
        } else {
          toast({
            title: "Error",
            description: "Not enough cards available. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error initializing battle:", error);
        toast({
          title: "Error",
          description: "Failed to start battle. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    initGame();
  }, []);

  const handleStatSelection = (stat: string) => {
    setSelectedStat(stat);
    setCardsRevealed(true);
    
    // Compare stats after a short delay
    setTimeout(() => {
      const playerCard = playerDeck[0];
      const aiCard = aiDeck[0];
      
      if (!playerCard || !aiCard) return;
      
      const playerValue = playerCard[stat as keyof typeof playerCard] as number;
      const aiValue = aiCard[stat as keyof typeof aiCard] as number;
      
      if (playerValue > aiValue) {
        // Player wins round
        setPlayerWins(prev => prev + 1);
        toast({
          title: "Round Won!",
          description: `You won with ${stat}: ${playerValue} vs ${aiValue}`
        });
      } else if (aiValue > playerValue) {
        // AI wins round
        setAiWins(prev => prev + 1);
        toast({
          title: "Round Lost",
          description: `AI won with ${stat}: ${aiValue} vs ${playerValue}`
        });
      } else {
        // It's a tie
        toast({
          title: "It's a tie!",
          description: `Both players have ${stat}: ${playerValue}`
        });
      }
      
      // Move to next round after a delay
      setTimeout(() => {
        const newRound = round + 1;
        setRound(newRound);
        
        // Move cards to end of deck
        setPlayerDeck(prev => [...prev.slice(1), prev[0]]);
        setAiDeck(prev => [...prev.slice(1), prev[0]]);
        
        // Alternate turns
        setIsPlayerTurn(!isPlayerTurn);
        setCardsRevealed(false);
        setSelectedStat(null);
        
        // Check if game is over (10 rounds)
        if (newRound > 10) {
          setGameOver(true);
          if (playerWins > aiWins) {
            setWinner("player");
          } else if (aiWins > playerWins) {
            setWinner("ai");
          } else {
            setWinner("draw");
          }
        }
      }, 1500);
    }, 1500);
  };
  
  // Handle AI turn
  useEffect(() => {
    if (!isLoading && !isPlayerTurn && !selectedStat && !gameOver) {
      // Simulate AI thinking
      const aiThinkingTime = 2000;
      
      const aiTimeout = setTimeout(() => {
        // AI selects a random stat
        const randomStat = statsOptions[Math.floor(Math.random() * statsOptions.length)];
        handleStatSelection(randomStat);
      }, aiThinkingTime);
      
      return () => clearTimeout(aiTimeout);
    }
  }, [isLoading, isPlayerTurn, selectedStat, gameOver]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fantasy-accent mr-2" />
        <p className="ml-2 text-lg">Setting up demo battle...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="border-2 border-fantasy-primary bg-black/70">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-fantasy text-fantasy-accent">Visitor Demo Battle</CardTitle>
          <CardDescription>
            Try out a sample battle against the AI
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="bg-fantasy-primary/20 p-3 rounded">
              <p className="text-lg">Round: {round} / 10</p>
            </div>
            <div className="bg-fantasy-accent/20 p-3 rounded">
              <p className="text-lg">
                Turn: {isPlayerTurn ? "Your Turn" : "AI's Turn"}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center">
            <BattleCardDisplay 
              card={playerDeck[0]}
              isFlipped={true}
              isActive={isPlayerTurn && !cardsRevealed && !gameOver}
              roundWins={playerWins}
              playerName="You"
              cardCount={playerDeck.length}
              onStatSelect={isPlayerTurn && !cardsRevealed && !gameOver ? handleStatSelection : undefined}
              selectedStat={selectedStat}
            />
            
            <BattleCardDisplay 
              card={aiDeck[0]}
              isFlipped={cardsRevealed}
              isActive={!isPlayerTurn && !cardsRevealed && !gameOver}
              roundWins={aiWins}
              playerName="AI Opponent"
              cardCount={aiDeck.length}
            />
          </div>
          
          {gameOver && (
            <div className="mt-8 text-center bg-fantasy-accent/30 p-6 rounded">
              <p className="text-2xl font-bold">Game Over!</p>
              {winner === "player" && (
                <p className="text-xl mt-2">You win with {playerWins} rounds!</p>
              )}
              {winner === "ai" && (
                <p className="text-xl mt-2">AI wins with {aiWins} rounds!</p>
              )}
              {winner === "draw" && (
                <p className="text-xl mt-2">It's a tie!</p>
              )}
              <div className="mt-4 flex justify-center gap-4">
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
              
              <div className="mt-6">
                <p className="text-lg">Want to play with your own cards and earn rewards?</p>
                <div className="mt-2">
                  <Button 
                    className="fantasy-button"
                    onClick={() => navigate("/register")}
                  >
                    Create an Account
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VisitorDemoBattle;
