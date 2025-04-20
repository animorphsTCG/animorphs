
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trophy, Bot } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/modules/auth';
import BattleCardDisplay from '@/components/BattleCardDisplay';
import { useBattleMultiplayer } from '../hooks/useBattleMultiplayer';
import { WaitingRoom } from './WaitingRoom';

export const FourPlayerPublicBattle = () => {
  const { battleId } = useParams<{ battleId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [participants, setParticipants] = useState<any[]>([]);
  const [battleStarted, setBattleStarted] = useState(false);
  
  const {
    currentRound,
    isUserTurn,
    selectedStat,
    cardsRevealed,
    gameOver,
    winner,
    playerDecks,
    roundWins,
    handleStatSelection
  } = useBattleMultiplayer(battleId || '', 'public');

  useEffect(() => {
    if (!battleId || !user) return;

    const fetchBattleInfo = async () => {
      try {
        // Check if battle exists and user is participant
        const { data: battleData, error: battleError } = await supabase
          .from('battle_sessions')
          .select('*')
          .eq('id', battleId)
          .single();

        if (battleError || !battleData) {
          toast({
            title: "Battle not found",
            description: "This battle session doesn't exist or has ended",
            variant: "destructive"
          });
          navigate('/battle');
          return;
        }

        // Get participants
        const { data: participantsData, error: participantsError } = await supabase
          .rpc('get_battle_participants', { battle_id: battleId });

        if (participantsError) {
          throw participantsError;
        }

        setParticipants(participantsData);
        setBattleStarted(battleData.status === 'active');
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching battle info:', error);
        toast({
          title: "Error",
          description: "Failed to load battle information",
          variant: "destructive"
        });
      }
    };

    fetchBattleInfo();

    // Subscribe to battle session status changes
    const channel = supabase
      .channel(`battle_session:${battleId}`)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'battle_sessions',
          filter: `id=eq.${battleId}`
        },
        (payload) => {
          const newStatus = (payload.new as any).status;
          setBattleStarted(newStatus === 'active');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [battleId, user, navigate]);

  // Get AI participant
  const aiParticipant = participants.find(p => p.is_ai);
  
  // Function to determine if a participant is AI
  const isAI = (participantId: string) => {
    const participant = participants.find(p => p.user_id === participantId);
    return participant?.is_ai;
  };

  if (!battleId) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6">
            <p>Invalid battle ID. Please return to the battle hub.</p>
            <Button 
              onClick={() => navigate('/battle')}
              className="mt-4"
            >
              Return to Battle Hub
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fantasy-accent" />
      </div>
    );
  }

  if (!battleStarted) {
    return <WaitingRoom lobbyId={battleId} />;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="border-2 border-fantasy-primary bg-black/70">
        <CardHeader>
          <CardTitle className="text-3xl font-fantasy text-fantasy-accent">
            4-Player Public Battle
          </CardTitle>
          <CardDescription>3 Players vs AI</CardDescription>
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
            {isAI(winner) && (
              <div className="bg-blue-500/20 px-4 py-2 rounded-full flex items-center">
                <Bot className="mr-2 h-4 w-4" /> AI's Turn
              </div>
            )}
          </div>

          {gameOver ? (
            <div className="text-center p-6 bg-fantasy-accent/20 rounded-lg">
              <Trophy className="h-12 w-12 mx-auto text-yellow-400 mb-4" />
              <h3 className="text-2xl font-fantasy mb-2">Game Over!</h3>
              <p className="text-lg">
                {winner === user?.id 
                  ? "You won the battle!" 
                  : isAI(winner)
                    ? "AI won the battle!"
                    : `${participants.find(p => p.user_id === winner)?.username || 'Player'} won!`}
              </p>
              <Button 
                onClick={() => navigate('/battle')}
                className="mt-6 fantasy-button"
              >
                Return to Battle Hub
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 justify-items-center mb-8">
                {participants.map((participant) => (
                  <div key={participant.user_id} className="w-full max-w-xs">
                    <div className="text-center mb-3">
                      <div className="flex items-center justify-center gap-2">
                        {participant.is_ai && <Bot className="h-4 w-4" />}
                        <p className="font-medium text-lg">
                          {participant.is_ai 
                            ? "AI" 
                            : participant.username || `Player ${participant.player_number}`}
                        </p>
                      </div>
                      <p>Wins: {roundWins[participant.user_id] || 0}</p>
                    </div>
                    {playerDecks[participant.user_id] && playerDecks[participant.user_id].length > 0 ? (
                      <BattleCardDisplay 
                        card={playerDecks[participant.user_id][0]} 
                        isRevealed={cardsRevealed || participant.user_id === user?.id}
                        isActive={participant.user_id === user?.id && isUserTurn}
                      />
                    ) : (
                      <div className="h-96 flex items-center justify-center bg-gray-800/50 rounded">
                        <p>No cards available</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {isUserTurn && !selectedStat && (
                <div className="space-y-3">
                  <p className="text-center">Your turn! Select a stat to compare:</p>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
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

              {selectedStat && (
                <div className="text-center bg-fantasy-primary/20 p-4 rounded">
                  <p className="text-lg">
                    Comparing <span className="font-bold uppercase">{selectedStat}</span>
                  </p>
                </div>
              )}

              {!isUserTurn && !selectedStat && (
                <div className="text-center bg-fantasy-primary/20 p-4 rounded">
                  <p className="text-lg">
                    {isAI(winner) 
                      ? "AI is thinking..." 
                      : `Waiting for ${participants.find(p => p.user_id !== user?.id && !p.is_ai)?.username || 'other player'} to select a stat...`}
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
