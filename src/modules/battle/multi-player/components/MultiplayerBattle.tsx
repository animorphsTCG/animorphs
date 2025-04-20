
import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useBattleMultiplayer } from '../hooks/useBattleMultiplayer';
import BattleCardDisplay from '@/components/BattleCardDisplay';
import { useAuth } from '@/modules/auth';

export const MultiplayerBattle = () => {
  const { battleId } = useParams<{ battleId: string }>();
  const { user } = useAuth();
  const {
    currentRound,
    isUserTurn,
    selectedStat,
    cardsRevealed,
    gameOver,
    handleStatSelection
  } = useBattleMultiplayer(battleId || '');

  if (!battleId) {
    return <div>Invalid battle ID</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="border-2 border-fantasy-primary bg-black/70">
        <CardHeader>
          <CardTitle className="text-3xl font-fantasy text-fantasy-accent">
            Multiplayer Battle
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6 flex justify-between items-center">
            <div className="bg-fantasy-primary/20 p-3 rounded">
              <p className="text-lg">Round: {currentRound}</p>
            </div>
            {isUserTurn && (
              <div className="bg-green-500/20 px-4 py-2 rounded-full">
                Your Turn
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center">
            {/* Battle card displays will be populated based on participants */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
