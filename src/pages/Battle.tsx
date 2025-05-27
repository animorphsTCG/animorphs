
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { CardDisplay } from "@/components/CardDisplay";
import { apiClient, Card as CardData, Match } from "@/lib/api";
import { ArrowLeft, Swords, Bot, Users, Play, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";

interface BattleProps {
  user: any;
}

type BattlePhase = 'setup' | 'card-select' | 'battle' | 'result';

interface BattleState {
  playerCards: CardData[];
  opponentCards: CardData[];
  playerHealth: number;
  opponentHealth: number;
  currentTurn: 'player' | 'opponent';
  selectedCard?: CardData;
  opponentCard?: CardData;
  round: number;
  maxRounds: number;
  battleLog: string[];
}

const Battle = ({ user }: BattleProps) => {
  const [phase, setPhase] = useState<BattlePhase>('setup');
  const [availableCards, setAvailableCards] = useState<CardData[]>([]);
  const [battleState, setBattleState] = useState<BattleState>({
    playerCards: [],
    opponentCards: [],
    playerHealth: 100,
    opponentHealth: 100,
    currentTurn: 'player',
    round: 1,
    maxRounds: 10,
    battleLog: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);

  useEffect(() => {
    loadAvailableCards();
  }, [user.id]);

  const loadAvailableCards = async () => {
    try {
      setIsLoading(true);
      
      if (user.id === 0) {
        // Demo mode - use sample cards
        const allCards = await apiClient.getAllCards();
        const demoCards = allCards.slice(0, 20);
        setAvailableCards(demoCards);
      } else {
        // Load user's cards
        const userCardData = await apiClient.getUserCards(user.id);
        const userCards = userCardData.map(uc => uc.card!);
        setAvailableCards(userCards);
      }
    } catch (error) {
      toast({
        title: "Failed to load cards",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startBattle = (mode: 'ai' | 'pvp') => {
    if (availableCards.length < 10) {
      toast({
        title: "Not enough cards",
        description: "You need at least 10 cards to battle",
        variant: "destructive",
      });
      return;
    }

    // Select random cards for battle
    const shuffled = [...availableCards].sort(() => Math.random() - 0.5);
    const playerCards = shuffled.slice(0, 10);
    const opponentCards = shuffled.slice(10, 20);

    setBattleState({
      playerCards,
      opponentCards,
      playerHealth: 100,
      opponentHealth: 100,
      currentTurn: 'player',
      round: 1,
      maxRounds: 10,
      battleLog: [`Battle started! ${mode === 'ai' ? 'Fighting AI opponent' : 'Fighting another player'}`],
      selectedCard: undefined,
      opponentCard: undefined,
    });

    setPhase('card-select');
  };

  const selectCard = (card: CardData) => {
    if (battleState.currentTurn !== 'player') return;

    setBattleState(prev => ({
      ...prev,
      selectedCard: card,
    }));

    // Auto-select opponent card (AI)
    const availableOpponentCards = prev.opponentCards.filter(c => 
      !prev.battleLog.some(log => log.includes(`Opponent played ${c.name}`))
    );
    
    if (availableOpponentCards.length > 0) {
      const opponentCard = availableOpponentCards[Math.floor(Math.random() * availableOpponentCards.length)];
      
      setBattleState(prev => ({
        ...prev,
        opponentCard,
      }));

      // Process battle round
      setTimeout(() => {
        processBattleRound(card, opponentCard);
      }, 1000);
    }
  };

  const processBattleRound = (playerCard: CardData, opponentCard: CardData) => {
    const playerPower = calculateCardPower(playerCard);
    const opponentPower = calculateCardPower(opponentCard);
    
    let playerDamage = 0;
    let opponentDamage = 0;
    let roundResult = '';

    if (playerPower > opponentPower) {
      opponentDamage = Math.round((playerPower - opponentPower) * 2);
      roundResult = `Your ${playerCard.name} defeated opponent's ${opponentCard.name}!`;
    } else if (opponentPower > playerPower) {
      playerDamage = Math.round((opponentPower - playerPower) * 2);
      roundResult = `Opponent's ${opponentCard.name} defeated your ${playerCard.name}!`;
    } else {
      roundResult = `Draw! Both ${playerCard.name} and ${opponentCard.name} tied.`;
    }

    setBattleState(prev => {
      const newPlayerHealth = Math.max(0, prev.playerHealth - playerDamage);
      const newOpponentHealth = Math.max(0, prev.opponentHealth - opponentDamage);
      const newRound = prev.round + 1;
      
      const newLog = [
        ...prev.battleLog,
        `Round ${prev.round}: You played ${playerCard.name} (${playerPower} power)`,
        `Round ${prev.round}: Opponent played ${opponentCard.name} (${opponentPower} power)`,
        roundResult,
        playerDamage > 0 ? `You took ${playerDamage} damage` : '',
        opponentDamage > 0 ? `Opponent took ${opponentDamage} damage` : '',
      ].filter(Boolean);

      // Check for battle end
      if (newPlayerHealth === 0 || newOpponentHealth === 0 || newRound > prev.maxRounds) {
        setTimeout(() => {
          setPhase('result');
        }, 2000);
      }

      return {
        ...prev,
        playerHealth: newPlayerHealth,
        opponentHealth: newOpponentHealth,
        round: newRound,
        battleLog: newLog,
        selectedCard: undefined,
        opponentCard: undefined,
        currentTurn: 'player' as const,
      };
    });
  };

  const calculateCardPower = (card: CardData): number => {
    return card.power + card.attack + (card.health * 0.5) + (card.sats * 2);
  };

  const getBattleResult = (): 'win' | 'lose' | 'draw' => {
    if (battleState.playerHealth > battleState.opponentHealth) return 'win';
    if (battleState.opponentHealth > battleState.playerHealth) return 'lose';
    return 'draw';
  };

  const resetBattle = () => {
    setPhase('setup');
    setBattleState({
      playerCards: [],
      opponentCards: [],
      playerHealth: 100,
      opponentHealth: 100,
      currentTurn: 'player',
      round: 1,
      maxRounds: 10,
      battleLog: [],
    });
    setCurrentMatch(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading battle system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-white">Battle Arena</h1>
            </div>
            
            {phase !== 'setup' && (
              <Button
                onClick={resetBattle}
                variant="outline"
                className="text-white border-white hover:bg-white hover:text-black"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                New Battle
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Setup Phase */}
        {phase === 'setup' && (
          <div className="max-w-4xl mx-auto">
            <Card className="bg-black/20 border-white/10 text-white mb-8">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl mb-2">Choose Your Battle</CardTitle>
                <CardDescription className="text-gray-300">
                  Select a battle mode to begin your adventure
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-black/20 border-white/10 text-white hover:bg-black/30 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bot className="h-6 w-6 text-blue-400" />
                    <span>AI Battle</span>
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Fight against intelligent AI opponents with varying difficulty levels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Mode: 10v10</div>
                      <div>Rewards: Practice XP</div>
                      <div>Difficulty: Adaptive</div>
                      <div>Duration: ~5 minutes</div>
                    </div>
                    <Button 
                      onClick={() => startBattle('ai')}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      disabled={availableCards.length < 10}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start AI Battle
                    </Button>
                    {availableCards.length < 10 && (
                      <p className="text-xs text-red-400 text-center">
                        Need at least 10 cards to battle
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/10 text-white hover:bg-black/30 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-6 w-6 text-green-400" />
                    <span>Player vs Player</span>
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Challenge other players in ranked matches via Epic Online Services
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Mode: Ranked</div>
                      <div>Rewards: LBP Points</div>
                      <div>Matchmaking: EOS</div>
                      <div>Voice Chat: Available</div>
                    </div>
                    <Button 
                      onClick={() => startBattle('pvp')}
                      className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                      disabled={user.id === 0 || availableCards.length < 10}
                    >
                      <Swords className="h-4 w-4 mr-2" />
                      Find Match
                    </Button>
                    {user.id === 0 && (
                      <p className="text-xs text-yellow-400 text-center">
                        Login required for PvP battles
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cards Preview */}
            <Card className="bg-black/20 border-white/10 text-white mt-8">
              <CardHeader>
                <CardTitle>Your Available Cards ({availableCards.length})</CardTitle>
                <CardDescription className="text-gray-300">
                  {availableCards.length >= 10 
                    ? "Ready for battle! Cards will be randomly selected for each match."
                    : "Collect more cards to unlock battle mode."
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                  {availableCards.slice(0, 10).map((card, index) => (
                    <div key={card.token_id} className="aspect-[3/4] bg-gray-700 rounded-lg p-1 text-center text-xs">
                      <div className={`w-full h-3/4 rounded mb-1 ${
                        card.element === 'Fire' ? 'bg-red-400' :
                        card.element === 'Water' ? 'bg-blue-400' :
                        card.element === 'Ice' ? 'bg-cyan-400' :
                        card.element === 'Ground' ? 'bg-amber-400' :
                        'bg-yellow-400'
                      }`} />
                      <div className="text-white truncate">{card.element[0]}</div>
                    </div>
                  ))}
                  {availableCards.length > 10 && (
                    <div className="aspect-[3/4] bg-gray-600 rounded-lg flex items-center justify-center text-xs text-gray-300">
                      +{availableCards.length - 10}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Card Selection Phase */}
        {phase === 'card-select' && (
          <div className="max-w-6xl mx-auto">
            {/* Battle Status */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="bg-black/20 border-white/10 text-white">
                <CardHeader>
                  <CardTitle className="text-green-400">Your Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={battleState.playerHealth} className="h-4 mb-2" />
                  <div className="text-2xl font-bold">{battleState.playerHealth}/100</div>
                </CardContent>
              </Card>
              
              <Card className="bg-black/20 border-white/10 text-white">
                <CardHeader>
                  <CardTitle className="text-red-400">Opponent Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={battleState.opponentHealth} className="h-4 mb-2" />
                  <div className="text-2xl font-bold">{battleState.opponentHealth}/100</div>
                </CardContent>
              </Card>
            </div>

            {/* Round Info */}
            <Card className="bg-black/20 border-white/10 text-white mb-6">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold">Round {battleState.round} of {battleState.maxRounds}</h3>
                    <p className="text-gray-300">
                      {battleState.currentTurn === 'player' ? 'Your turn - select a card' : 'Opponent is thinking...'}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-purple-400 border-purple-400">
                    Turn-Based Combat
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Current Cards in Play */}
            {(battleState.selectedCard || battleState.opponentCard) && (
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-white mb-4">Your Card</h4>
                  {battleState.selectedCard && (
                    <div className="max-w-48 mx-auto">
                      <CardDisplay card={battleState.selectedCard} />
                    </div>
                  )}
                </div>
                
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-white mb-4">Opponent's Card</h4>
                  {battleState.opponentCard && (
                    <div className="max-w-48 mx-auto">
                      <CardDisplay card={battleState.opponentCard} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Player Cards */}
            <Card className="bg-black/20 border-white/10 text-white">
              <CardHeader>
                <CardTitle>Select Your Card</CardTitle>
                <CardDescription className="text-gray-300">
                  Choose a card to play this round
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {battleState.playerCards.map((card) => (
                    <CardDisplay
                      key={card.token_id}
                      card={card}
                      onClick={() => selectCard(card)}
                      isSelected={battleState.selectedCard?.token_id === card.token_id}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Battle Log */}
            <Card className="bg-black/20 border-white/10 text-white mt-6">
              <CardHeader>
                <CardTitle>Battle Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {battleState.battleLog.map((log, index) => (
                    <div key={index} className="text-sm text-gray-300">
                      {log}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Result Phase */}
        {phase === 'result' && (
          <div className="max-w-2xl mx-auto text-center">
            <Card className="bg-black/20 border-white/10 text-white">
              <CardHeader>
                <CardTitle className="text-3xl mb-4">
                  {getBattleResult() === 'win' && <span className="text-green-400">Victory!</span>}
                  {getBattleResult() === 'lose' && <span className="text-red-400">Defeat!</span>}
                  {getBattleResult() === 'draw' && <span className="text-yellow-400">Draw!</span>}
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Battle completed after {battleState.round - 1} rounds
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-green-400">{battleState.playerHealth}</div>
                    <div className="text-sm text-gray-300">Your Health</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-400">{battleState.opponentHealth}</div>
                    <div className="text-sm text-gray-300">Opponent Health</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={resetBattle}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    Battle Again
                  </Button>
                  <Link to="/leaderboard">
                    <Button variant="outline" className="w-full text-white border-white hover:bg-white hover:text-black">
                      View Leaderboard
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Battle;
