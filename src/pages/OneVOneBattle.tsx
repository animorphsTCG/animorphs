
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import CardDisplay from "@/components/CardDisplay";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { AnimorphCard } from "@/types";
import { getRandomDeck } from "@/lib/db";

const statsOptions = ['power', 'health', 'attack', 'sats', 'size'];

const OneVOneBattle = () => {
  const { user } = useAuth();
  const [deck1, setDeck1] = useState<AnimorphCard[]>([]);
  const [deck2, setDeck2] = useState<AnimorphCard[]>([]);
  const [round, setRound] = useState(1);
  const [turn, setTurn] = useState<'player1' | 'player2' | null>(null);
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const [result, setResult] = useState<'player1' | 'player2' | 'tie' | null>(null);
  const [suddenDeath, setSuddenDeath] = useState(false);
  const [roundWins, setRoundWins] = useState({ player1: 0, player2: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isBattleStarted, setIsBattleStarted] = useState(false);
  const [isAiOpponent, setIsAiOpponent] = useState(true); // Default to AI opponent

  // Fetch cards and set up decks
  useEffect(() => {
    const fetchCards = async () => {
      try {
        setIsLoading(true);
        // Get 10 random cards for each player
        const player1Cards = await getRandomDeck(10);
        // Get 10 different random cards for player 2
        const player2Cards = await getRandomDeck(10, player1Cards.map(c => c.id));
        
        setDeck1(player1Cards);
        setDeck2(player2Cards);
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
    
    fetchCards();
  }, []);

  // Initialize turn randomly on battle start
  const startBattle = () => {
    const startingPlayer = Math.random() < 0.5 ? 'player1' : 'player2';
    setTurn(startingPlayer);
    setIsBattleStarted(true);
  };

  // Handle AI turn if it's AI's turn
  useEffect(() => {
    if (isBattleStarted && turn === 'player2' && isAiOpponent && !selectedStat) {
      // Add delay to simulate AI thinking
      const delay = Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000;
      const aiTimeout = setTimeout(() => {
        // AI chooses a random stat
        const randomStat = statsOptions[Math.floor(Math.random() * statsOptions.length)];
        handleStatSelection(randomStat);
      }, delay);
      
      return () => clearTimeout(aiTimeout);
    }
  }, [turn, isBattleStarted, isAiOpponent, selectedStat]);

  const handleStatSelection = (stat: string) => {
    setSelectedStat(stat);
    
    // Can't compare if either player is out of cards
    if (deck1.length === 0 || deck2.length === 0) return;
    
    // Compare top cards based on the chosen stat
    const card1 = deck1[0];
    const card2 = deck2[0];

    const value1 = card1[stat as keyof typeof card1] as number;
    const value2 = card2[stat as keyof typeof card2] as number;

    if (value1 === value2) {
      setResult('tie');
    } else if (value1 > value2) {
      setResult('player1');
      setRoundWins((prev) => ({ ...prev, player1: prev.player1 + 1 }));
    } else {
      setResult('player2');
      setRoundWins((prev) => ({ ...prev, player2: prev.player2 + 1 }));
    }

    // Rotate decks: Winner gets both cards; in case of tie, cards go to bottom of their decks
    setTimeout(() => {
      if (value1 === value2) {
        setDeck1([...deck1.slice(1), card1]);
        setDeck2([...deck2.slice(1), card2]);
      } else if (value1 > value2) {
        setDeck1([...deck1.slice(1), card1, card2]);
        setDeck2(deck2.slice(1));
      } else {
        setDeck2([...deck2.slice(1), card2, card1]);
        setDeck1(deck1.slice(1));
      }
      setRound(round + 1);
      setTurn(turn === 'player1' ? 'player2' : 'player1');
      setSelectedStat(null);
      setResult(null);
    }, 2000);
  };

  // Check end-of-game conditions
  useEffect(() => {
    if (isBattleStarted && round > 10) {
      if (roundWins.player1 === roundWins.player2) {
        setSuddenDeath(true);
      } else {
        const winner = roundWins.player1 > roundWins.player2 ? 'Player 1' : 'Player 2';
        toast({
          title: "Game Over",
          description: `${winner} wins the battle!`,
        });
        // Optional: reset game or navigate away
      }
    }
  }, [round, roundWins, isBattleStarted]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fantasy-accent" />
        <p className="ml-2 text-lg">Loading cards...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="border-2 border-fantasy-primary bg-black/70">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-fantasy text-fantasy-accent">1v1 Battle</CardTitle>
          <CardDescription>
            {isAiOpponent ? 'Player vs AI' : 'Player vs Player'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {!isBattleStarted ? (
            <div className="text-center space-y-6 py-8">
              <h3 className="text-xl">Ready to battle?</h3>
              <p>Each player has a deck of 10 cards. The winner of each round collects both cards.</p>
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
                  <p className="text-lg">Turn: {turn === 'player1' ? 'Player 1' : 'Player 2'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <h3 className="text-xl font-medium text-center">Player 1's Card</h3>
                  {deck1[0] ? (
                    <CardDisplay card={deck1[0]} />
                  ) : (
                    <div className="h-96 flex items-center justify-center bg-gray-800/50 rounded">
                      <p>No cards left</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-medium text-center">
                    {isAiOpponent ? "AI's Card" : "Player 2's Card"}
                  </h3>
                  {deck2[0] ? (
                    <CardDisplay card={deck2[0]} />
                  ) : (
                    <div className="h-96 flex items-center justify-center bg-gray-800/50 rounded">
                      <p>No cards left</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-800/50 p-4 rounded">
                <h4 className="text-center mb-2">Current Score</h4>
                <div className="flex justify-center gap-8">
                  <p>Player 1: {roundWins.player1}</p>
                  <p>{isAiOpponent ? 'AI' : 'Player 2'}: {roundWins.player2}</p>
                </div>
              </div>
              
              {turn === 'player1' && selectedStat === null && (
                <div className="space-y-3">
                  <p className="text-center">Select a stat to compare:</p>
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
              
              {turn === 'player2' && !isAiOpponent && selectedStat === null && (
                <div className="space-y-3">
                  <p className="text-center">Player 2, select a stat to compare:</p>
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
              
              {turn === 'player2' && isAiOpponent && selectedStat === null && (
                <div className="text-center p-4 bg-gray-800/50 rounded">
                  <p>AI is choosing a stat...</p>
                </div>
              )}
              
              {result && (
                <div className="text-center bg-gray-800/70 p-4 rounded">
                  {result === 'tie' ? (
                    <p className="text-yellow-400 text-lg">It's a tie!</p>
                  ) : (
                    <p className={`text-lg ${result === 'player1' ? 'text-green-500' : 'text-red-500'}`}>
                      {result === 'player1'
                        ? 'Player 1 wins this round!'
                        : `${isAiOpponent ? 'AI' : 'Player 2'} wins this round!`}
                    </p>
                  )}
                  {selectedStat && (
                    <p className="mt-2">
                      Compared <span className="font-bold uppercase">{selectedStat}</span>
                    </p>
                  )}
                </div>
              )}
              
              {suddenDeath && (
                <div className="text-center bg-fantasy-danger/30 p-4 rounded">
                  <p className="text-lg font-bold">Sudden Death!</p>
                  <p>It's a tie after 10 rounds. Next winner takes all!</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OneVOneBattle;
