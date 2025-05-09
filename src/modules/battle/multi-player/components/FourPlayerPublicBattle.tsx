
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { useBattleMultiplayer } from '../hooks';
import { Loader2, Users, Shield, Swords } from 'lucide-react';

export const FourPlayerPublicBattle = () => {
  const { battleId } = useParams<{ battleId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [players, setPlayers] = useState<any[]>([]);
  
  const { 
    currentRound,
    isUserTurn,
    participants,
    playerDecks,
    winner,
    handleStatSelection,
    handleCardPlay,
    handleTargetSelection
  } = useBattleMultiplayer(battleId);
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // If no battleId is provided, this is a lobby view
    if (!battleId) {
      setIsLoading(false);
      return;
    }
    
    const loadBattleData = async () => {
      try {
        const { data: battleData, error: battleError } = await supabase
          .from('battle_sessions')
          .select('*')
          .eq('id', battleId)
          .single();
          
        if (battleError) throw battleError;
        
        // Load participants
        const { data: participants, error: participantsError } = await supabase
          .from('battle_participants')
          .select(`
            *,
            profiles:user_id (username, profile_image_url)
          `)
          .eq('battle_id', battleId)
          .order('player_number', { ascending: true });
          
        if (participantsError) throw participantsError;
        
        setPlayers(participants);
      } catch (error) {
        console.error("Error loading battle data:", error);
        toast({
          title: "Error",
          description: "Failed to load battle data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (battleId) {
      loadBattleData();
    }
  }, [battleId, user, navigate]);
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fantasy-accent" />
      </div>
    );
  }
  
  // If no battleId is provided, show a lobby browser
  if (!battleId) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-fantasy text-fantasy-accent mb-6 text-center">
          Public 4-Player Battles
        </h1>
        
        <Card className="bg-black/50 border border-fantasy-primary/40">
          <CardHeader>
            <CardTitle>Available Public Battles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 mb-4">
              No public battles are currently available. Create a new battle to get started.
            </p>
            
            <Button 
              className="bg-fantasy-accent hover:bg-fantasy-accent/80"
              onClick={() => {
                toast({
                  title: "Creating Battle",
                  description: "Setting up new public battle..."
                });
                
                // In a real implementation, we'd create a battle here
                setTimeout(() => {
                  navigate('/battle');
                }, 1500);
              }}
            >
              Create Public Battle
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get the current turn player ID
  const currentTurnPlayerId = participants.find(p => p.user_id && isUserTurn)?.user_id || null;
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-fantasy text-fantasy-accent mb-6 text-center">
        Four Player Public Battle
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Player Columns */}
        {players.map((player) => (
          <Card key={player.id} className={`bg-black/50 border-2 ${currentTurnPlayerId === player.user_id ? 'border-fantasy-accent' : 'border-fantasy-primary/40'}`}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-fantasy-primary flex items-center justify-center mr-2">
                  {player.player_number}
                </div>
                {player.profiles?.username || `Player ${player.player_number}`}
                {currentTurnPlayerId === player.user_id && (
                  <span className="ml-2 text-xs bg-fantasy-accent text-black px-2 py-1 rounded">
                    Current Turn
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* Player Stats */}
                <div className="flex justify-between">
                  <span className="flex items-center">
                    <Shield className="h-4 w-4 mr-1" /> Health
                  </span>
                  <span>100</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="flex items-center">
                    <Swords className="h-4 w-4 mr-1" /> Cards
                  </span>
                  <span>10</span>
                </div>
                
                {/* Action Buttons */}
                {isUserTurn && player.user_id === user?.id && (
                  <div className="mt-4">
                    <Button 
                      variant="default" 
                      className="w-full bg-fantasy-accent hover:bg-fantasy-accent/80"
                      onClick={() => handleCardPlay && handleCardPlay()}
                    >
                      Play Card
                    </Button>
                  </div>
                )}
                
                {isUserTurn && player.user_id !== user?.id && (
                  <div className="mt-4">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleTargetSelection && handleTargetSelection(player.user_id)}
                    >
                      Select Target
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Game Info */}
      <Card className="mt-8 bg-black/70 border border-fantasy-primary/40">
        <CardHeader>
          <CardTitle>Game Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2">
            This is a four-player free-for-all battle. Attack other players and be the last one standing to win!
          </p>
          
          <div className="mt-4">
            <Button 
              variant="destructive" 
              onClick={() => navigate('/battle')}
            >
              Leave Battle
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Also export a named component for direct imports
export default FourPlayerPublicBattle;
