
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useBattleMultiplayer } from '../hooks/useBattleMultiplayer';
import { WaitingRoom } from './WaitingRoom';
import { useAuth } from '@/modules/auth';
import BattleCardDisplay from '@/components/BattleCardDisplay';

export const OneVOneMultiplayer = () => {
  const { battleId } = useParams<{ battleId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    loading,
    currentRound,
    isUserTurn,
    selectedStat,
    cardsRevealed,
    gameOver,
    winner,
    playerDecks,
    roundWins,
    participants,
    handleStatSelection
  } = useBattleMultiplayer(battleId || '', 'multiplayer');

  if (!battleId) {
    return <div>Invalid battle ID</div>;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (participants.length < 2) {
    return <WaitingRoom lobbyId={battleId} />;
  }

  const opponent = participants.find(p => p.user_id !== user?.id);
  const playerWins = roundWins[user?.id || ''] || 0;
  const opponentWins = roundWins[opponent?.user_id || ''] || 0;

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="border-2 border-fantasy-primary bg-black/70">
        <CardHeader>
          <CardTitle className="text-3xl font-fantasy text-fantasy-accent">
            1v1 Multiplayer Battle
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6 flex justify-between items-center">
            <div className="bg-fantasy-primary/20 p-3 rounded">
              <p className="text-lg">Round: {currentRound}/10</p>
            </div>
            {isUserTurn && (
              <div className="bg-green-500/20 px-4 py-2 rounded-full">
                Your Turn
              </div>
            )}
          </div>

          {gameOver ? (
            <div className="text-center">
              <h3 className="text-2xl mb-4">Game Over!</h3>
              <p className="text-xl mb-6">
                {winner === user?.id 
                  ? "You won the battle!" 
                  : winner === null 
                    ? "It's a draw!" 
                    : "Your opponent won!"}
              </p>
              <Button onClick={() => navigate('/battle')}>
                Return to Battle Hub
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center">
                {/* Player's card */}
                <div>
                  <div className="text-center mb-4">
                    <p className="font-medium text-lg">{user?.email?.split('@')[0]}</p>
                    <p className="text-sm">Wins: {playerWins}</p>
                  </div>
                  <BattleCardDisplay
                    card={playerDecks[user?.id || '']?.[0]}
                    isFlipped={true}
                    isActive={isUserTurn && !cardsRevealed}
                    onStatSelect={isUserTurn && !cardsRevealed ? handleStatSelection : undefined}
                    selectedStat={selectedStat}
                  />
                </div>

                {/* Opponent's card */}
                <div>
                  <div className="text-center mb-4">
                    <p className="font-medium text-lg">{opponent?.username || 'Opponent'}</p>
                    <p className="text-sm">Wins: {opponentWins}</p>
                  </div>
                  <BattleCardDisplay
                    card={playerDecks[opponent?.user_id || '']?.[0]}
                    isFlipped={cardsRevealed}
                    selectedStat={selectedStat}
                  />
                </div>
              </div>

              {isUserTurn && !selectedStat && (
                <div className="mt-8 space-y-4">
                  <p className="text-center">Select a stat to compare:</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {['power', 'health', 'attack', 'sats', 'size'].map((stat) => (
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

              {!isUserTurn && !selectedStat && (
                <div className="mt-8 text-center p-4 bg-fantasy-primary/20 rounded">
                  <p>Waiting for opponent to select a stat...</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OneVOneMultiplayer;
