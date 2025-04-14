
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import CardDisplay from "@/components/CardDisplay";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { AnimorphCard } from "@/types";
import { fetchAnimorphCards } from "@/lib/db";

const statsOptions = ['power', 'health', 'attack', 'sats', 'size'];

const FourPlayerPublicBattle = () => {
  const { user } = useAuth();
  
  // Define player decks
  const [decks, setDecks] = useState<{[key: string]: AnimorphCard[]}>({
    player1: [],
    player2: [],
    player3: [],
    ai: []
  });
  
  const [round, setRound] = useState(1);
  const [turn, setTurn] = useState<'player1' | 'player2' | 'player3' | 'ai' | null>(null);
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const [roundWins, setRoundWins] = useState({ player1: 0, player2: 0, player3: 0, ai: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isBattleStarted, setIsBattleStarted] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);

  // Fetch cards and set up decks
  useEffect(() => {
    const fetchCardData = async () => {
      try {
        // Fetch up to 200 cards
        const cardData = await fetchAnimorphCards(200);
        
        if (cardData && cardData.length > 0) {
          // Shuffle cards randomly
          const shuffled = [...cardData].sort(() => Math.random() - 0.5);
          
          // Split into four decks (50 cards each)
          setDecks({
            player1: shuffled.slice(0, 50),
            player2: shuffled.slice(50, 100),
            player3: shuffled.slice(100, 150),
            ai: shuffled.slice(150, 200)
          });
        }
      } catch (error) {
        console.error("Error fetching cards:", error);
        toast({
          title: "Error",
          description: "Failed to fetch cards. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCardData();
  }, []);

  // Initialize turn to player 1 when battle starts
  const startBattle = () => {
    // Randomize which player starts
    const players: ('player1' | 'player2' | 'player3' | 'ai')[] = ['player1', 'player2', 'player3', 'ai'];
    const startingPlayer = players[Math.floor(Math.random() * players.length)];
    setTurn(startingPlayer);
    setIsBattleStarted(true);
  };

  // Handle AI turn if it's the AI's turn
  useEffect(() => {
    if (isBattleStarted && turn === 'ai' && !selectedStat) {
      setAiThinking(true);
      // Add 5 second delay to simulate AI thinking
      const aiTimeout = setTimeout(() => {
        setAiThinking(false);
        // AI chooses a random stat
        const randomStat = statsOptions[Math.floor(Math.random() * statsOptions.length)];
        handleStatSelection(randomStat);
      }, 5000);
      
      return () => clearTimeout(aiTimeout);
    }
  }, [turn, isBattleStarted, selectedStat]);

  const handleStatSelection = (stat: string) => {
    setSelectedStat(stat);
    
    // Make sure all players have cards
    if (Object.values(decks).some(deck => deck.length === 0)) return;
    
    // Get the top card for each player
    const cardP1 = decks.player1[0];
    const cardP2 = decks.player2[0];
    const cardP3 = decks.player3[0];
    const cardAI = decks.ai[0];

    // Get values for the selected stat
    const values = {
      player1: cardP1[stat as keyof typeof cardP1] as number,
      player2: cardP2[stat as keyof typeof cardP2] as number,
      player3: cardP3[stat as keyof typeof cardP3] as number,
      ai: cardAI[stat as keyof typeof cardAI] as number
    };
    
    // Find maximum value
    const maxValue = Math.max(...Object.values(values));
    
    // Find winner(s)
    const winners = Object.entries(values).filter(([_, value]) => value === maxValue).map(([key]) => key);
    
    // Single winner case
    if (winners.length === 1) {
      const winner = winners[0] as 'player1' | 'player2' | 'player3' | 'ai';
      setRoundWins(prev => ({ ...prev, [winner]: prev[winner] + 1 }));
      
      // Update decks - winner gets all cards, others lose their top card
      setTimeout(() => {
        const newDecks = { ...decks };
        
        // Remove top card from all decks
        const topCards = {
          player1: newDecks.player1.shift()!,
          player2: newDecks.player2.shift()!,
          player3: newDecks.player3.shift()!,
          ai: newDecks.ai.shift()!
        };
        
        // Add all cards to winner's deck
        newDecks[winner] = [...newDecks[winner], topCards.player1, topCards.player2, topCards.player3, topCards.ai];
        
        setDecks(newDecks);
        moveToNextTurn();
      }, 2000);
    } 
    // Multiple winners (tie)
    else {
      // In a tie, everyone keeps their own card (move to bottom of deck)
      setTimeout(() => {
        const newDecks = { ...decks };
        Object.keys(newDecks).forEach(player => {
          const key = player as keyof typeof decks;
          if (newDecks[key].length > 0) {
            const topCard = newDecks[key].shift()!;
            newDecks[key] = [...newDecks[key], topCard];
          }
        });
        
        setDecks(newDecks);
        moveToNextTurn();
      }, 2000);
    }
  };

  // Move to the next player's turn
  const moveToNextTurn = () => {
    setRound(round + 1);
    
    // Determine next turn
    if (turn === 'player1') setTurn('player2');
    else if (turn === 'player2') setTurn('player3');
    else if (turn === 'player3') setTurn('ai');
    else setTurn('player1');
    
    setSelectedStat(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fantasy-accent" />
        <p className="ml-2 text-lg">Loading cards...</p>
      </div>
    );
  }

  // Check if the game is over (any player with no cards)
  const gameOver = Object.values(decks).some(deck => deck.length === 0);
  
  // Find the player with the most wins if the game is over
  let winner = null;
  if (gameOver) {
    const maxWins = Math.max(...Object.values(roundWins));
    const winningPlayers = Object.entries(roundWins)
      .filter(([_, wins]) => wins === maxWins)
      .map(([player]) => player);
    
    if (winningPlayers.length === 1) {
      winner = winningPlayers[0];
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="border-2 border-fantasy-primary bg-black/70">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-fantasy text-fantasy-accent">4-Player Battle</CardTitle>
          <CardDescription>
            Public Lobby: 3 Users vs AI
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {!isBattleStarted ? (
            <div className="text-center space-y-6 py-8">
              <h3 className="text-xl">Ready to battle?</h3>
              <p>Each player has 50 cards. The winner of each round collects all four cards.</p>
              <div className="flex justify-center">
                <Button 
                  className="fantasy-button text-lg py-6 px-12" 
                  onClick={startBattle}
                >
                  Start Battle
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div className="bg-fantasy-primary/20 p-3 rounded">
                  <p className="text-lg">Round: {round}</p>
                </div>
                <div className="bg-fantasy-accent/20 p-3 rounded">
                  <p className="text-lg">
                    Turn: {turn === 'ai' ? 'AI' : turn === 'player1' ? 'Player 1' : turn === 'player2' ? 'Player 2' : 'Player 3'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <h3 className="text-xl font-medium text-center">Player 1</h3>
                  <div className="text-center mb-2">Cards: {decks.player1.length}</div>
                  {decks.player1[0] ? (
                    <CardDisplay card={decks.player1[0]} />
                  ) : (
                    <div className="h-96 flex items-center justify-center bg-gray-800/50 rounded">
                      <p>No cards left</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-medium text-center">Player 2</h3>
                  <div className="text-center mb-2">Cards: {decks.player2.length}</div>
                  {decks.player2[0] ? (
                    <CardDisplay card={decks.player2[0]} />
                  ) : (
                    <div className="h-96 flex items-center justify-center bg-gray-800/50 rounded">
                      <p>No cards left</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-medium text-center">Player 3</h3>
                  <div className="text-center mb-2">Cards: {decks.player3.length}</div>
                  {decks.player3[0] ? (
                    <CardDisplay card={decks.player3[0]} />
                  ) : (
                    <div className="h-96 flex items-center justify-center bg-gray-800/50 rounded">
                      <p>No cards left</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-medium text-center">AI</h3>
                  <div className="text-center mb-2">Cards: {decks.ai.length}</div>
                  {decks.ai[0] ? (
                    <>
                      <CardDisplay card={decks.ai[0]} />
                      {turn === 'ai' && aiThinking && (
                        <div className="text-center mt-2 p-2 bg-gray-800/50 rounded">
                          <p>AI is thinking...</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="h-96 flex items-center justify-center bg-gray-800/50 rounded">
                      <p>No cards left</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-800/50 p-4 rounded">
                <h4 className="text-center mb-2">Current Score</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <p>Player 1: {roundWins.player1}</p>
                  <p>Player 2: {roundWins.player2}</p>
                  <p>Player 3: {roundWins.player3}</p>
                  <p>AI: {roundWins.ai}</p>
                </div>
              </div>
              
              {!gameOver && (
                <>
                  {turn !== 'ai' && !selectedStat && (
                    <div className="space-y-3">
                      <p className="text-center">
                        {turn === 'player1' ? 'Player 1' : turn === 'player2' ? 'Player 2' : 'Player 3'}, select a stat to compare:
                      </p>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                        {statsOptions.map((stat) => (
                          <Button
                            key={stat}
                            onClick={() => handleStatSelection(stat)}
                            variant="outline"
                            className="capitalize"
                          >
                            {stat}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedStat && (
                    <div className="text-center bg-fantasy-primary/20 p-4 rounded">
                      <p className="text-lg">Comparing <span className="font-bold uppercase">{selectedStat}</span></p>
                    </div>
                  )}
                </>
              )}
              
              {gameOver && (
                <div className="text-center bg-fantasy-accent/30 p-6 rounded">
                  <p className="text-2xl font-bold">Game Over!</p>
                  {winner ? (
                    <p className="text-xl mt-2">
                      {winner === 'ai' ? 'AI' : winner.replace('player', 'Player ')} wins with {roundWins[winner as keyof typeof roundWins]} points!
                    </p>
                  ) : (
                    <p className="text-xl mt-2">It's a tie!</p>
                  )}
                  <div className="mt-4">
                    <Button 
                      className="fantasy-button" 
                      onClick={() => window.location.reload()}
                    >
                      Play Again
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FourPlayerPublicBattle;
