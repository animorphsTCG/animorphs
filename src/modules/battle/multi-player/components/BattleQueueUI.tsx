
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, Users, Signal, Zap } from 'lucide-react';
import { useBattleQueue } from '../hooks/useBattleQueue';
import { AnimorphCard } from '@/types';

interface BattleQueueUIProps {
  selectedCards: AnimorphCard[];
  battleType: '1v1' | '3player' | '4player';
  onCancel?: () => void;
  metadata?: Record<string, any>;
}

export const BattleQueueUI: React.FC<BattleQueueUIProps> = ({
  selectedCards,
  battleType,
  onCancel,
  metadata = {},
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
  useEffect(() => {
    if (selectedCards.length === 10) {
      joinQueue({
        battleType,
        deckCards: selectedCards,
        metadata
      });
    }
  }, []);
  
  // Return to card selection if canceled
  const handleCancel = async () => {
    await leaveQueue();
    if (onCancel) onCancel();
  };
  
  // Get connection status info
  const getConnectionStatusInfo = () => {
    switch (presenceStatus) {
      case 'connected':
        return { icon: <Signal className="h-4 w-4 text-green-500" />, text: 'Connected' };
      case 'connecting':
        return { icon: <Signal className="h-4 w-4 text-yellow-500" />, text: 'Connecting...' };
      case 'disconnected':
        return { icon: <Signal className="h-4 w-4 text-red-500" />, text: 'Disconnected' };
      default:
        return { icon: <Signal className="h-4 w-4 text-gray-500" />, text: 'Unknown' };
    }
  };
  
  const connectionStatus = getConnectionStatusInfo();
  
  return (
    <Card className="bg-black/70 border-2 border-fantasy-primary">
      <CardContent className="p-6 flex flex-col items-center">
        {matchFound ? (
          <div className="text-center py-8">
            <Zap className="h-16 w-16 text-fantasy-accent mx-auto mb-4" />
            <h2 className="text-2xl font-fantasy text-fantasy-accent mb-2">
              Match Found!
            </h2>
            <p className="text-white mb-4">
              Preparing your battle...
            </p>
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : (
          <>
            <div className="w-24 h-24 rounded-full bg-fantasy-primary/20 flex items-center justify-center mb-6">
              <Loader2 className="h-12 w-12 animate-spin text-fantasy-accent" />
            </div>
            
            <h2 className="text-2xl font-fantasy text-fantasy-accent mb-1">
              Finding Opponents
            </h2>
            
            <p className="text-gray-300 text-center mb-6">
              Searching for {battleType === '1v1' ? '1v1' : 
                            battleType === '3player' ? '3-player' : 
                            '4-player'} battle opponents...
            </p>
            
            <div className="flex items-center justify-center space-x-2 mb-6">
              <Clock className="h-5 w-5 text-fantasy-accent" />
              <span className="text-xl font-semibold">{formattedQueueTime()}</span>
            </div>
            
            <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden mb-6">
              <div 
                className="bg-fantasy-accent h-full rounded-full animate-pulse"
                style={{ width: `${Math.min(100, parseInt(formattedQueueTime()) * 3)}%` }}  
              ></div>
            </div>
            
            <div className="flex justify-between items-center w-full text-sm text-gray-400 mb-2">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span>{battleType} Battle</span>
              </div>
              
              <div className="flex items-center">
                {connectionStatus.icon}
                <span className="ml-1">{connectionStatus.text}</span>
              </div>
            </div>
            
            {error && (
              <p className="text-red-500 text-sm mb-4">Error: {error}</p>
            )}
          </>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={handleCancel}
          disabled={matchFound}
        >
          {matchFound ? "Preparing Battle..." : "Cancel"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BattleQueueUI;
