
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CardContent, Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Swords, Heart, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Import your battle utility functions here
// import { calculateDamage, isGameOver } from '@/lib/battleUtils';

// Mock data for the demo battle
const mockPlayerCards = [
  {
    id: 1,
    name: 'Wolf Morph',
    type: 'Beast',
    power: 5,
    health: 10,
    attack: 3,
    sats: 1,
    size: 'medium',
    image_url: '/assets/cards/wolf-morph.jpg',
    description: 'A fearsome wolf-human hybrid with enhanced senses.'
  },
  {
    id: 2,
    name: 'Eagle Morph',
    type: 'Avian',
    power: 4,
    health: 7,
    attack: 5,
    sats: 2,
    size: 'small',
    image_url: '/assets/cards/eagle-morph.jpg',
    description: 'Human with eagle abilities, including flight and enhanced vision.'
  },
  {
    id: 3,
    name: 'Bear Morph',
    type: 'Beast',
    power: 7,
    health: 15,
    attack: 4,
    sats: 3,
    size: 'large',
    image_url: '/assets/cards/bear-morph.jpg',
    description: 'Massive human-bear hybrid with incredible strength.'
  }
];

const mockAICards = [
  {
    id: 4,
    name: 'Snake Morph',
    type: 'Reptile',
    power: 3,
    health: 8,
    attack: 4,
    sats: 1,
    size: 'medium',
    image_url: '/assets/cards/snake-morph.jpg',
    description: 'A slithering human-snake hybrid with venomous attacks.'
  },
  {
    id: 5,
    name: 'Hawk Morph',
    type: 'Avian',
    power: 4,
    health: 6,
    attack: 6,
    sats: 2,
    size: 'small',
    image_url: '/assets/cards/hawk-morph.jpg',
    description: 'Swift human-hawk hybrid with aerial combat expertise.'
  }
];

const DemoBattle: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentRound, setCurrentRound] = useState(1);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [aiHealth, setAIHealth] = useState(100);
  const [selectedCard, setSelectedCard] = useState<typeof mockPlayerCards[0] | null>(null);
  const [aiCard, setAICard] = useState<typeof mockAICards[0] | null>(null);
  const [roundResult, setRoundResult] = useState<string | React.ReactElement | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [showVictoryAnimation, setShowVictoryAnimation] = useState(false);
  
  // Select a random AI card for the round
  useEffect(() => {
    if (!gameOver && !aiCard) {
      const randomIndex = Math.floor(Math.random() * mockAICards.length);
      setAICard(mockAICards[randomIndex]);
    }
  }, [currentRound, gameOver, aiCard]);
  
  // Handle card selection
  const handleSelectCard = (card: typeof mockPlayerCards[0]) => {
    if (gameOver) return;
    setSelectedCard(card);
  };
  
  // Process battle round
  const processBattle = () => {
    if (!selectedCard || !aiCard) return;
    
    // Simple battle logic for demo
    const playerDamage = Math.floor(selectedCard.attack * (1 + Math.random() * 0.5));
    const aiDamage = Math.floor(aiCard.attack * (1 + Math.random() * 0.5));
    
    // Update health
    const newAIHealth = Math.max(0, aiHealth - playerDamage);
    const newPlayerHealth = Math.max(0, playerHealth - aiDamage);
    
    setAIHealth(newAIHealth);
    setPlayerHealth(newPlayerHealth);
    
    // Set round result message with jsx
    setRoundResult(
      <div className="space-y-2">
        <p>Your <span className="font-bold text-blue-500">{selectedCard.name}</span> deals <span className="font-bold text-red-500">{playerDamage}</span> damage!</p>
        <p>Enemy <span className="font-bold text-purple-500">{aiCard.name}</span> deals <span className="font-bold text-red-500">{aiDamage}</span> damage!</p>
      </div>
    );
    
    // Check for game over condition
    if (newAIHealth <= 0 || newPlayerHealth <= 0) {
      handleGameOver(newPlayerHealth > newAIHealth);
    } else {
      // Prepare for next round
      setTimeout(() => {
        setCurrentRound(prev => prev + 1);
        setSelectedCard(null);
        setAICard(null);
        setRoundResult(null);
      }, 3000);
    }
  };
  
  // Handle game over
  const handleGameOver = (playerWon: boolean) => {
    setGameOver(true);
    
    if (playerWon) {
      setShowVictoryAnimation(true);
      setRoundResult(
        <div className="text-center">
          <h3 className="text-2xl font-bold text-green-500">Victory!</h3>
          <p>Congratulations! You've defeated the AI opponent.</p>
          <p className="mt-4">Use code "ZypherDan" to play the full game for free!</p>
        </div>
      );
      
      toast({
        title: "Victory!",
        description: "You've unlocked a special code: ZypherDan",
      });
    } else {
      setRoundResult(
        <div className="text-center">
          <h3 className="text-2xl font-bold text-red-500">Defeat!</h3>
          <p>The AI opponent has defeated you. Better luck next time!</p>
        </div>
      );
    }
  };
  
  // Restart the battle
  const restartBattle = () => {
    setCurrentRound(1);
    setPlayerHealth(100);
    setAIHealth(100);
    setSelectedCard(null);
    setAICard(null);
    setRoundResult(null);
    setGameOver(false);
    setShowVictoryAnimation(false);
  };
  
  // Return to home
  const returnToHome = () => {
    navigate('/');
  };
  
  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <h1 className="text-3xl font-bold text-center mb-8">Animorphs Demo Battle</h1>
      
      {/* Battle Status */}
      <div className="flex justify-between mb-6 items-center">
        <div>
          <h2 className="text-xl font-semibold">Round {currentRound}</h2>
        </div>
        <div className="flex space-x-4">
          <div className="flex items-center">
            <p className="mr-2">You:</p>
            <div className="w-32 bg-gray-300 rounded-full h-4 overflow-hidden">
              <div 
                className="bg-green-500 h-full transition-all duration-500"
                style={{ width: `${playerHealth}%` }}
              />
            </div>
            <span className="ml-2">{playerHealth}%</span>
          </div>
          <div className="flex items-center">
            <p className="mr-2">AI:</p>
            <div className="w-32 bg-gray-300 rounded-full h-4 overflow-hidden">
              <div 
                className="bg-red-500 h-full transition-all duration-500"
                style={{ width: `${aiHealth}%` }}
              />
            </div>
            <span className="ml-2">{aiHealth}%</span>
          </div>
        </div>
      </div>
      
      {/* Battle Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Player Area */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Your Cards</h3>
          <div className="grid grid-cols-1 gap-4">
            {mockPlayerCards.map(card => (
              <Card 
                key={card.id}
                className={`cursor-pointer transition-all hover:scale-105 ${
                  selectedCard?.id === card.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handleSelectCard(card)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold">{card.name}</h4>
                    <Badge variant={card.type === 'Beast' ? 'default' : 'secondary'}>{card.type}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div>
                      <Swords className="h-4 w-4 mx-auto" />
                      <p className="text-sm mt-1">{card.attack}</p>
                    </div>
                    <div>
                      <Heart className="h-4 w-4 mx-auto" />
                      <p className="text-sm mt-1">{card.health}</p>
                    </div>
                    <div>
                      <ShieldCheck className="h-4 w-4 mx-auto" />
                      <p className="text-sm mt-1">{card.power}</p>
                    </div>
                  </div>
                  <p className="text-sm mt-2 text-gray-500">{card.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* AI Area */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">AI Opponent</h3>
          <div className="flex justify-center items-center h-full">
            {aiCard && roundResult ? (
              <Card className="w-full">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold">{aiCard.name}</h4>
                    <Badge variant="destructive">{aiCard.type}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div>
                      <Swords className="h-4 w-4 mx-auto" />
                      <p className="text-sm mt-1">{aiCard.attack}</p>
                    </div>
                    <div>
                      <Heart className="h-4 w-4 mx-auto" />
                      <p className="text-sm mt-1">{aiCard.health}</p>
                    </div>
                    <div>
                      <ShieldCheck className="h-4 w-4 mx-auto" />
                      <p className="text-sm mt-1">{aiCard.power}</p>
                    </div>
                  </div>
                  <p className="text-sm mt-2 text-gray-500">{aiCard.description}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center p-8 border border-dashed border-gray-300 rounded-lg w-full">
                <p className="text-gray-500">AI is selecting a card...</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Battle Results */}
      {roundResult && (
        <div className={`mb-8 p-4 rounded-lg ${gameOver ? (showVictoryAnimation ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300') : 'bg-blue-50 border border-blue-200'}`}>
          <div className="text-center">
            {roundResult}
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        {!gameOver ? (
          <>
            <Button 
              onClick={processBattle} 
              disabled={!selectedCard || !!roundResult}
              className="px-8"
            >
              Attack <Swords className="ml-2 h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <Button onClick={restartBattle} variant="outline">
              Try Again
            </Button>
            <Button onClick={returnToHome}>
              Return to Home <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default DemoBattle;
