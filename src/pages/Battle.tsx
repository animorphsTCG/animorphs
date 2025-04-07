
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import CardDisplay from "@/components/CardDisplay";
import { Card as CardType } from "@/types";

const Battle = () => {
  // Sample player cards
  const playerCards: CardType[] = [
    {
      id: 1,
      card_number: 101,
      image_url: "https://images.unsplash.com/photo-1560707854-8c642b4f2106?q=80&w=1922&auto=format&fit=crop",
      nft_name: "Dragon Mage",
      animorph_type: "Mythical",
      power: 95,
      health: 120,
      attack: 85,
      sats: 120,
      size: 8
    },
    {
      id: 2,
      card_number: 102,
      image_url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1770&auto=format&fit=crop",
      nft_name: "Tech Warrior",
      animorph_type: "Cyber",
      power: 80,
      health: 90,
      attack: 110,
      sats: 100,
      size: 7
    },
    {
      id: 4,
      card_number: 104,
      image_url: "https://images.unsplash.com/photo-1604623452055-586dd82bf6d6?q=80&w=1770&auto=format&fit=crop",
      nft_name: "Shadow Assassin",
      animorph_type: "Dark",
      power: 110,
      health: 70,
      attack: 130,
      sats: 140,
      size: 5
    }
  ];

  // Sample opponent cards
  const opponentCards: CardType[] = [
    {
      id: 3,
      card_number: 103,
      image_url: "https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?q=80&w=1770&auto=format&fit=crop",
      nft_name: "Forest Guardian",
      animorph_type: "Nature",
      power: 75,
      health: 150,
      attack: 65,
      sats: 90,
      size: 6
    },
    {
      id: 5,
      card_number: 105,
      image_url: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=1770&auto=format&fit=crop",
      nft_name: "Phoenix Mage",
      animorph_type: "Fire",
      power: 100,
      health: 85,
      attack: 120,
      sats: 130,
      size: 7
    },
    {
      id: 6,
      card_number: 106,
      image_url: "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?q=80&w=1974&auto=format&fit=crop",
      nft_name: "Ice Guardian",
      animorph_type: "Water",
      power: 85,
      health: 110,
      attack: 75,
      sats: 95,
      size: 8
    }
  ];

  // State for the selected cards and game status
  const [selectedPlayerCard, setSelectedPlayerCard] = useState<CardType | null>(null);
  const [selectedOpponentCard, setSelectedOpponentCard] = useState<CardType | null>(null);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'ready' | 'inProgress' | 'finished'>('waiting');
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [opponentHealth, setOpponentHealth] = useState(100);
  const [round, setRound] = useState(1);

  const handleSelectPlayerCard = (card: CardType) => {
    setSelectedPlayerCard(card);
    // Simulate opponent selecting card automatically
    const randomIndex = Math.floor(Math.random() * opponentCards.length);
    setSelectedOpponentCard(opponentCards[randomIndex]);
    setGameStatus('ready');
  };

  const startBattle = () => {
    if (!selectedPlayerCard || !selectedOpponentCard) return;
    
    setGameStatus('inProgress');
    setBattleLog([`Round ${round} begins!`, `You selected ${selectedPlayerCard.nft_name}`, `Opponent selected ${selectedOpponentCard.nft_name}`]);
    
    // Simulate battle progress
    const battleSimulation = setInterval(() => {
      setBattleLog(prev => [
        ...prev, 
        `${selectedPlayerCard.nft_name} attacks for ${selectedPlayerCard.attack} damage!`
      ]);
      
      setOpponentHealth(prev => {
        const newHealth = Math.max(0, prev - (selectedPlayerCard?.attack || 0) / 10);
        if (newHealth <= 0) {
          clearInterval(battleSimulation);
          setBattleLog(prev => [...prev, 'You won the battle!']);
          setGameStatus('finished');
        }
        return newHealth;
      });
      
      // Opponent's turn
      setTimeout(() => {
        setBattleLog(prev => [
          ...prev, 
          `${selectedOpponentCard.nft_name} counter-attacks for ${selectedOpponentCard.attack} damage!`
        ]);
        
        setPlayerHealth(prev => {
          const newHealth = Math.max(0, prev - (selectedOpponentCard?.attack || 0) / 10);
          if (newHealth <= 0) {
            clearInterval(battleSimulation);
            setBattleLog(prev => [...prev, 'Opponent won the battle!']);
            setGameStatus('finished');
          }
          return newHealth;
        });
      }, 1500);
      
    }, 3000);
    
    // Stop simulation after some rounds if no winner yet
    setTimeout(() => {
      clearInterval(battleSimulation);
      if (gameStatus !== 'finished') {
        setBattleLog(prev => [...prev, 'Battle ended in a draw!']);
        setGameStatus('finished');
      }
    }, 15000);
  };

  const resetGame = () => {
    setSelectedPlayerCard(null);
    setSelectedOpponentCard(null);
    setGameStatus('waiting');
    setBattleLog([]);
    setPlayerHealth(100);
    setOpponentHealth(100);
    setRound(prev => prev + 1);
  };

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4 font-fantasy">
          <span className="text-fantasy-accent">Animorph</span> Battle Arena
        </h1>
        <p className="text-gray-300 text-center mb-12 max-w-2xl mx-auto">
          Choose your card and battle against opponents to earn rewards and climb the ranks.
        </p>
        
        <Tabs defaultValue="pvp" className="max-w-5xl mx-auto">
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="pvp" className="text-lg">Player vs Player</TabsTrigger>
            <TabsTrigger value="ai" className="text-lg">Battle AI</TabsTrigger>
            <TabsTrigger value="tournament" className="text-lg">Tournaments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pvp" className="border-2 border-fantasy-primary rounded-lg bg-black/50 p-6">
            <h2 className="text-2xl font-fantasy mb-6">Player vs Player Battle</h2>
            
            {/* Battle Arena */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Player Side */}
              <div className="space-y-6">
                <div className="bg-black/50 border border-fantasy-primary rounded-lg p-4">
                  <h3 className="text-xl font-fantasy mb-2 text-fantasy-accent">Your Champion</h3>
                  
                  {selectedPlayerCard ? (
                    <div className="mb-4">
                      <CardDisplay card={selectedPlayerCard} />
                    </div>
                  ) : (
                    <div className="h-80 border-2 border-dashed border-fantasy-primary/50 rounded-lg flex items-center justify-center">
                      <p className="text-gray-400">Select a card to battle</p>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <div className="flex justify-between mb-2">
                      <span>Health</span>
                      <span>{playerHealth}%</span>
                    </div>
                    <Progress value={playerHealth} className="h-2" />
                  </div>
                </div>
                
                <div className="bg-black/50 border border-fantasy-primary rounded-lg p-4">
                  <h3 className="text-xl font-fantasy mb-2">Your Deck</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {playerCards.map((card) => (
                      <Card 
                        key={card.id} 
                        className={`border cursor-pointer ${selectedPlayerCard?.id === card.id ? 'border-fantasy-accent' : 'border-fantasy-primary/30'}`}
                        onClick={() => handleSelectPlayerCard(card)}
                      >
                        <CardContent className="p-3 flex items-center space-x-4">
                          <div className="h-16 w-16 rounded overflow-hidden">
                            <img src={card.image_url} alt={card.nft_name} className="h-full w-full object-cover" />
                          </div>
                          <div>
                            <p className="font-bold">{card.nft_name}</p>
                            <p className="text-xs text-gray-400">
                              POW: {card.power} | ATK: {card.attack} | HP: {card.health}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Battle Middle */}
              <div className="space-y-6">
                <div className="bg-black/70 border border-fantasy-accent rounded-lg p-4 h-80 flex flex-col items-center justify-center">
                  {gameStatus === 'waiting' && (
                    <div className="text-center">
                      <h3 className="text-3xl font-fantasy text-fantasy-accent mb-4">Ready to Battle?</h3>
                      <p className="text-gray-300 mb-6">Select your card to begin</p>
                    </div>
                  )}
                  
                  {gameStatus === 'ready' && (
                    <div className="text-center">
                      <h3 className="text-3xl font-fantasy text-fantasy-accent mb-4">Battle Ready!</h3>
                      <p className="text-gray-300 mb-6">Your champion awaits your command</p>
                      <Button className="fantasy-button text-lg" onClick={startBattle}>
                        Start Battle
                      </Button>
                    </div>
                  )}
                  
                  {gameStatus === 'inProgress' && (
                    <div className="text-center">
                      <h3 className="text-3xl font-fantasy text-fantasy-accent animate-pulse mb-4">
                        Battle in Progress
                      </h3>
                      <div className="flex justify-center space-x-4">
                        <div className="w-3 h-3 bg-fantasy-accent rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-3 h-3 bg-fantasy-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-3 h-3 bg-fantasy-accent rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  )}
                  
                  {gameStatus === 'finished' && (
                    <div className="text-center">
                      <h3 className="text-3xl font-fantasy text-fantasy-accent mb-4">
                        Battle Complete!
                      </h3>
                      <p className="text-gray-300 mb-6">
                        {playerHealth > opponentHealth ? 'Victory is yours!' : 'Better luck next time!'}
                      </p>
                      <Button className="fantasy-button text-lg" onClick={resetGame}>
                        New Battle
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="bg-black/50 border border-fantasy-primary rounded-lg p-4 h-64 overflow-y-auto">
                  <h3 className="text-xl font-fantasy mb-2">Battle Log</h3>
                  <Separator className="my-2" />
                  <div className="space-y-2">
                    {battleLog.length > 0 ? (
                      battleLog.map((log, index) => (
                        <p key={index} className="text-sm">
                          {log}
                        </p>
                      ))
                    ) : (
                      <p className="text-gray-400 text-sm">Battle log will appear here...</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Opponent Side */}
              <div className="space-y-6">
                <div className="bg-black/50 border border-fantasy-primary rounded-lg p-4">
                  <h3 className="text-xl font-fantasy mb-2 text-fantasy-secondary">Opponent's Champion</h3>
                  
                  {selectedOpponentCard ? (
                    <div className="mb-4">
                      <CardDisplay card={selectedOpponentCard} />
                    </div>
                  ) : (
                    <div className="h-80 border-2 border-dashed border-fantasy-primary/50 rounded-lg flex items-center justify-center">
                      <p className="text-gray-400">Waiting for opponent...</p>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <div className="flex justify-between mb-2">
                      <span>Health</span>
                      <span>{opponentHealth}%</span>
                    </div>
                    <Progress value={opponentHealth} className="h-2" />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="ai" className="border-2 border-fantasy-primary rounded-lg bg-black/50 p-6">
            <div className="h-96 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-2xl font-fantasy mb-4">AI Battle Mode</h3>
                <p className="text-gray-300 mb-6">Challenge our advanced AI opponents to earn rewards</p>
                <Button className="fantasy-button">Coming Soon</Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="tournament" className="border-2 border-fantasy-primary rounded-lg bg-black/50 p-6">
            <div className="h-96 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-2xl font-fantasy mb-4">Tournament Mode</h3>
                <p className="text-gray-300 mb-6">Join scheduled tournaments to compete for major prizes</p>
                <Button className="fantasy-button">Coming Soon</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Battle;
