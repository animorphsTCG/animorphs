import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import CardDisplay from "@/components/CardDisplay";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface AnimorphCard {
  id: number;
  card_number: number;
  image_url: string;
  nft_name: string;
  animorph_type: string;
  power: number;
  health: number;
  attack: number;
  sats: number;
  size: number;
}

const statsOptions = ['power', 'health', 'attack', 'sats', 'size'];

const ThreePlayerBattle = () => {
  const { user } = useAuth();
  const [deck1, setDeck1] = useState<AnimorphCard[]>([]);
  const [deck2, setDeck2] = useState<AnimorphCard[]>([]);
  const [deck3, setDeck3] = useState<AnimorphCard[]>([]);
  const [round, setRound] = useState(1);
  const [turn, setTurn] = useState<'player1' | 'player2' | 'player3' | null>(null);
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const [roundWins, setRoundWins] = useState({ player1: 0, player2: 0, player3: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isBattleStarted, setIsBattleStarted] = useState(false);
  const [isAI, setIsAI] = useState({ player2: true, player3: true }); // By default, player 2 and 3 are AI

  // Fetch cards and set up decks
  useEffect(() => {
    const fetchCards = async () => {
      try {
        // For demo purposes, fetch a selection of cards
        const { data, error } = await supabase
          .from("animorph_cards")
          .select("*")
          .limit(198); // 198 cards (66 for each player) - 2 omitted by lobby creator
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Shuffle cards randomly
          const shuffled = [...data].sort(() => Math.random() - 0.5);
          
          // Split into three decks (66 cards each)
          setDeck1(shuffled.slice(0, 66) as AnimorphCard[]);
          setDeck2(shuffled.slice(66, 132) as AnimorphCard[]);
          setDeck3(shuffled.slice(132) as AnimorphCard[]);
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
    
    fetchCards();
  }, []);

  // Initialize turn to player 1 when battle starts
  const startBattle = () => {
    setTurn('player1'); // In 3-player mode, player1 always starts
    setIsBattleStarted(true);
  };

  // Handle AI turn if it's an AI's turn
  useEffect(() => {
    if (isBattleStarted && selectedStat === null) {
      if ((turn === 'player2' && isAI.player2) || (turn === 'player3' && isAI.player3)) {
        // Add delay to simulate AI thinking
        const delay = Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000;
        const aiTimeout = setTimeout(() => {
          // AI chooses a random stat
          const randomStat = statsOptions[Math.floor(Math.random() * statsOptions.length)];
          handleStatSelection(randomStat);
        }, delay);
        
        return () => clearTimeout(aiTimeout);
      }
    }
  }, [turn, isBattleStarted, isAI, selectedStat]);

  const handleStatSelection = (stat: string) => {
    setSelectedStat(stat);
    
    // Check if any player is out of cards
    if (deck1.length === 0 || deck2.length === 0 || deck3.length === 0) {
      return;
    }
    
    // Get the top card for each player
    const card1 = deck1[0];
    const card2 = deck2[0];
    const card3 = deck3[0];

    const value1 = card1[stat as keyof typeof card1] as number;
    const value2 = card2[stat as keyof typeof card2] as number;
    const value3 = card3[stat as keyof typeof card3] as number;

    // Determine the winner
    let winner: 'player1' | 'player2' | 'player3' | null = null;
    
    // Find the maximum value
    const maxValue = Math.max(value1, value2, value3);
    
    // Check which player(s) have the maximum value
    const playersWithMax = [];
    if (value1 === maxValue) playersWithMax.push('player1');
    if (value2 === maxValue) playersWithMax.push('player2');
    if (value3 === maxValue) playersWithMax.push('player3');
    
    // If only one player has the max value, they win
    if (playersWithMax.length === 1) {
      winner = playersWithMax[0] as 'player1' | 'player2' | 'player3';
      setRoundWins((prev) => ({ ...prev, [winner as string]: prev[winner as 'player1' | 'player2' | 'player3'] + 1 }));
    }
    
    // Wait a moment so players can see the results
    setTimeout(() => {
      // Distribute cards based on the winner
      if (winner === 'player1') {
        setDeck1([...deck1.slice(1), card1, card2, card3]);
        setDeck2(deck2.slice(1));
        setDeck3(deck3.slice(1));
      } else if (winner === 'player2') {
        setDeck2([...deck2.slice(1), card1, card2, card3]);
        setDeck1(deck1.slice(1));
        setDeck3(deck3.slice(1));
      } else if (winner === 'player3') {
        setDeck3([...deck3.slice(1), card1, card2, card3]);
        setDeck1(deck1.slice(1));
        setDeck2(deck2.slice(1));
      } else {
        // In case of a tie, each player keeps their card but moves it to the bottom
        setDeck1([...deck1.slice(1), card1]);
        setDeck2([...deck2.slice(1), card2]);
        setDeck3([...deck3.slice(1), card3]);
      }
      
      // Update round and rotate turn
      setRound(round + 1);
      setTurn(turn === 'player1' ? 'player2' : turn === 'player2' ? 'player3' : 'player1');
      setSelectedStat(null);
      
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fantasy-accent" />
        <p className="ml-2 text-lg">Loading cards...</p>
      </div>
    );
  }

  // Check if any player has run out of cards
  const gameOver = deck1.length === 0 || deck2.length === 0 || deck3.length === 0;
  
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
              <p>Each player has 66 cards. The winner of each round collects all three cards.</p>
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    {isAI.player2 ? "AI Player 2's Card" : "Player 2's Card"}
                  </h3>
                  {deck2[0] ? (
                    <CardDisplay card={deck2[0]} />
                  ) : (
                    <div className="h-96 flex items-center justify-center bg-gray-800/50 rounded">
                      <p>No cards left</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-medium text-center">
                    {isAI.player3 ? "AI Player 3's Card" : "Player 3's Card"}
                  </h3>
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
                <div className="flex justify-center gap-8">
                  <p>Player 1: {roundWins.player1}</p>
                  <p>{isAI.player2 ? 'AI Player 2' : 'Player 2'}: {roundWins.player2}</p>
                  <p>{isAI.player3 ? 'AI Player 3' : 'Player 3'}: {roundWins.player3}</p>
                </div>
              </div>
              
              {!gameOver && !selectedStat && turn === 'player1' && (
                <div className="space-y-3">
                  <p className="text-center">Player 1, select a stat to compare:</p>
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
              
              {!gameOver && !selectedStat && turn === 'player2' && !isAI.player2 && (
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
              
              {!gameOver && !selectedStat && turn === 'player3' && !isAI.player3 && (
                <div className="space-y-3">
                  <p className="text-center">Player 3, select a stat to compare:</p>
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
              
              {!gameOver && !selectedStat && ((turn === 'player2' && isAI.player2) || (turn === 'player3' && isAI.player3)) && (
                <div className="text-center p-4 bg-gray-800/50 rounded">
                  <p>AI is choosing a stat...</p>
                </div>
              )}
              
              {selectedStat && (
                <div className="text-center bg-fantasy-primary/20 p-4 rounded">
                  <p className="text-lg">Comparing <span className="font-bold uppercase">{selectedStat}</span></p>
                </div>
              )}
              
              {gameOver && (
                <div className="text-center bg-fantasy-danger/30 p-4 rounded">
                  <p className="text-2xl font-bold">Game Over!</p>
                  <div className="mt-4">
                    <p className="text-lg">Final Scores:</p>
                    <p>Player 1: {roundWins.player1}</p>
                    <p>{isAI.player2 ? 'AI Player 2' : 'Player 2'}: {roundWins.player2}</p>
                    <p>{isAI.player3 ? 'AI Player 3' : 'Player 3'}: {roundWins.player3}</p>
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
