
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Loader2, X, Users, AlertTriangle } from 'lucide-react';
import { useBattleQueue } from '../hooks/useBattleQueue';
import { AnimorphCard } from '@/types';

interface BattleQueueUIProps {
  selectedCards: AnimorphCard[];
  battleType: '1v1' | '3player' | '4player';
  onCancel: () => void;
}

export const BattleQueueUI: React.FC<BattleQueueUIProps> = ({ 
  selectedCards, 
  battleType, 
  onCancel 
}) => {
  const {
    inQueue,
    formattedQueueTime,
    matchFound,
    error,
    presenceStatus,
    joinQueue,
    leaveQueue
  } = useBattleQueue();
  
  // Join queue on component mount
  React.useEffect(() => {
    if (!inQueue && selectedCards.length === 10) {
      joinQueue({
        battleType,
        deckCards: selectedCards
      });
    }
  }, []);
  
  // Handle cancel button click
  const handleCancel = async () => {
    if (inQueue) {
      await leaveQueue();
    }
    onCancel();
  };
  
  return (
    <Card className="border-2 border-fantasy-accent bg-black/70">
      <CardHeader>
        <CardTitle className="text-2xl font-fantasy text-fantasy-accent flex items-center">
          <Clock className="mr-2 h-6 w-6" /> 
          Battle Queue: {formattedQueueTime()}
        </CardTitle>
        <CardDescription>
          {matchFound 
            ? "Match found! Preparing battle..." 
            : `Searching for ${battleType === '1v1' ? 'an opponent' : 'opponents'}...`}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Connection Status */}
        <div className="flex items-center gap-2 mb-4">
          <div className={`h-3 w-3 rounded-full ${
            presenceStatus === 'connected' ? 'bg-green-500' :
            presenceStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
            'bg-red-500'
          }`}></div>
          <span className="text-sm">
            {presenceStatus === 'connected' ? 'Connected to matchmaking server' :
             presenceStatus === 'connecting' ? 'Connecting to matchmaking server...' :
             'Disconnected from matchmaking server'}
          </span>
        </div>
        
        {/* Queue Status */}
        <div className="bg-gray-900/50 p-4 rounded-md">
          <div className="flex items-center mb-2">
            <Users className="mr-2 h-5 w-5 text-fantasy-accent" />
            <span className="font-medium">Battle Type: </span>
            <span className="ml-2">
              {battleType === '1v1' ? '1v1 Battle' : 
               battleType === '3player' ? '3-Player Tournament' : 
               '4-Player Battle'}
            </span>
          </div>
          
          <div className="mb-2">
            <p className="text-sm text-gray-400">
              {battleType === '1v1' 
                ? "You'll be matched against another player with similar stats." 
                : battleType === '3player'
                ? "You'll be matched with 2 other players for a 3-way tournament."
                : "You'll be matched with 3 other players for a 4-player battle."}
            </p>
          </div>
          
          {/* Estimated Wait Time */}
          <div className="text-sm text-gray-400">
            <p>Estimated wait time: 1-3 minutes</p>
            <div className="w-full bg-gray-700 h-1.5 mt-1.5 rounded-full overflow-hidden">
              <div className="bg-fantasy-accent h-full animate-pulse" style={{width: '60%'}}></div>
            </div>
          </div>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-900/30 border border-red-500/30 rounded-md flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          className="bg-red-600 hover:bg-red-700 w-full"
          onClick={handleCancel}
          disabled={matchFound}
        >
          {matchFound ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <X className="mr-2 h-4 w-4" />
          )}
          {matchFound ? "Preparing Battle..." : "Cancel Queue"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BattleQueueUI;
