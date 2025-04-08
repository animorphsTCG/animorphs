
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

const ThreePlayerBattle = () => {
  const { user } = useAuth();
  
  const [deck1, setDeck1] = useState<AnimorphCard[]>([]);
  const [deck2, setDeck2] = useState<AnimorphCard[]>([]);
  const [deck3, setDeck3] = useState<AnimorphCard[]>([]);
  
  const [round, setRound] = useState(1);
  const [turn, setTurn] = useState<'player1' | 'player2' | 'player3'>('player1');
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const [roundWins, setRoundWins] = useState({ player1: 0, player2: 0, player3: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isBattleStarted, setIsBattleStarted] = useState(false);

  // Fetch cards and set up decks
  useEffect(() => {
    const fetchCardData = async () => {
      try {
        // Get up to 200 cards
        const allCards = await fetchAnimorphCards(198);
        
        if (allCards && allCards.length > 0) {
          // Shuffle the cards
          const shuffled = [...allCards].sort(() => Math.random() - 0.5);
          
          // Set aside 2 cards (as per the requirement where the host can omit 2 cards)
          const remainingCards = shuffled.slice(2);
          
          // Divide the remaining cards equally among 3 players (66 per player)
          setDeck1(remainingCards.slice(0, 66));
          setDeck2(remainingCards.slice(66, 132));
          setDeck3(remainingCards.slice(132));
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

  // Initialize game
  const startBattle = () => {
    // Randomly select which player starts
    const players: ('player1' | 'player2' | 'player3')[] = ['player1', 'player2', 'player3'];
    const startingPlayer = players[Math.floor(Math.random() * players.length)];
    setTurn(startingPlayer);
    setIsBattleStarted(true);
  };

  const handleStatSelection = (stat: string) => {
    setSelectedStat(stat);
    
    // Make sure all players have cards
    if (deck1.length === 0 || deck2.length === 0 || deck3.length === 0) return;
    
    // Get the top card for each player
    const card1 = deck1[0];
    const card2 = deck2[0];
    const card3 = deck3[0];

    const value1 = card1[stat as keyof typeof card1] as number;
    const value2 = card2[stat as keyof typeof card2] as number;
    const value3 = card3[stat as keyof typeof card3] as number;

    // Determine the winner
    let winner: 'player1' | 'player2' | 'player3' | null = null;
    
    if (value1 >= value2 && value1 >= value3) {
      winner = 'player1';
    } else if (value2 > value1 && value2 >= value3) {
      winner = 'player2';
    } else if (value3 > value1 && value3 > value2) {
      winner = 'player3';
    }

    if (winner) {
      setRoundWins((prev) => ({ ...prev, [winner!]: prev[winner!] + 1 }));

      // Winner collects all three cards; others lose their top card
      setTimeout(() => {
        if (winner === 'player1') {
          setDeck1([...deck1.slice(1), card1, card2, card3]);
          setDeck2(deck2.slice(1));
          setDeck3(deck3.slice(1));
        } else if (winner === 'player2') {
          setDeck2([...deck2.slice(1), card2, card1, card3]);
          setDeck1(deck1.slice(1));
          setDeck3(deck3.slice(1));
        } else if (winner === 'player3') {
          setDeck3([...deck3.slice(1), card3, card1, card2]);
          setDeck1(deck1.slice(1));
          setDeck2(deck2.slice(1));
        }
        
        setRound(round + 1);
        // Rotate turn among players
        setTurn(turn === 'player1' ? 'player2' : turn === 'player2' ? 'player3' : 'player1');
        setSelectedStat(null);
      }, 2000);
    }
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
  const gameOver = deck1.length === 0 || deck2.length === 0 || deck3.length === 0;
  
  // Find the player with the most wins if the game is over
  let winner = null;
  if (gameOver) {
    const maxWins = Math.max(roundWins.player1, roundWins.player2, roundWins.player3);
    const winners = Object.entries(roundWins)
      .filter(([_, wins]) => wins === maxWins)
      .map(([player]) => player);
    
    if (winners.length === 1) {
      winner = winners[0];
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="border-2 border-fantasy-primary bg-black/70">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-fantasy text-fantasy-accent">3-Player Battle</CardTitle>
          <CardDescription>
            Relaxed Tournament Mode
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {!isBattleStarted ? (
            <div className="text-center space-y-6 py-8">
              <h3 className="text-xl">Ready to battle?</h3>
              <p>Each player has a deck of 66 cards. The winner of each round collects all three cards.</p>
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
                  <p className="text-lg">Turn: {turn === 'player1' ? 'Player 1' : turn === 'player2' ? 'Player 2' : 'Player 3'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h3 className="text-xl font-medium text-center">Player 1</h3>
                  <div className="text-center mb-2">Cards: {deck1.length}</div>
                  {deck1[0] ? (
                    <CardDisplay card={deck1[0]} />
                  ) : (
                    <div className="h-96 flex items-center justify-center bg-gray-800/50 rounded">
                      <p>No cards left</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-medium text-center">Player 2</h3>
                  <div className="text-center mb-2">Cards: {deck2.length}</div>
                  {deck2[0] ? (
                    <CardDisplay card={deck2[0]} />
                  ) : (
                    <div className="h-96 flex items-center justify-center bg-gray-800/50 rounded">
                      <p>No cards left</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-medium text-center">Player 3</h3>
                  <div className="text-center mb-2">Cards: {deck3.length}</div>
                  {deck3[0] ? (
                    <CardDisplay card={deck3[0]} />
                  ) : (
                    <div className="h-96 flex items-center justify-center bg-gray-800/50 rounded">
                      <p>No cards left</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-800/50 p-4 rounded">
                <h4 className="text-center mb-2">Current Score</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <p>Player 1: {roundWins.player1}</p>
                  <p>Player 2: {roundWins.player2}</p>
                  <p>Player 3: {roundWins.player3}</p>
                </div>
              </div>
              
              {!gameOver && (
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
              
              {gameOver && (
                <div className="text-center bg-fantasy-accent/30 p-6 rounded">
                  <p className="text-2xl font-bold">Game Over!</p>
                  {winner ? (
                    <p className="text-xl mt-2">
                      {winner.replace('player', 'Player ')} wins with {roundWins[winner as keyof typeof roundWins]} points!
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

export default ThreePlayerBattle;
