
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/modules/auth';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Users, UserCheck, Timer, Clock } from 'lucide-react';
import { useCleanupLobbies } from '../hooks/useCleanupLobbies';
import InviteUserModal from '@/components/battle/InviteUserModal';

interface WaitingRoomProps {
  lobbyId: string;
}

interface LobbyParticipant {
  id: string;
  user_id: string;
  player_number: number;
  is_ready: boolean;
  join_time: string;
  username?: string;
  profile_image_url?: string | null;
}

interface LobbyDetails {
  id: string;
  name: string;
  host_id: string;
  battle_type: string;
  max_players: number;
  use_timer: boolean;
  use_music: boolean;
  status: 'waiting' | 'in_progress' | 'completed' | 'expired';
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({ lobbyId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cleanupStaleLobbies } = useCleanupLobbies();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<LobbyParticipant[]>([]);
  const [lobbyDetails, setLobbyDetails] = useState<LobbyDetails | null>(null);
  const [waitTime, setWaitTime] = useState(0);
  const [isHost, setIsHost] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isStartingBattle, setIsStartingBattle] = useState(false);
  
  // Format wait time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  useEffect(() => {
    // Clean up stale lobbies in the background
    cleanupStaleLobbies();
  }, []);
  
  useEffect(() => {
    const fetchLobbyDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get lobby details
        const { data: lobby, error: lobbyError } = await supabase
          .from('battle_lobbies')
          .select('*')
          .eq('id', lobbyId)
          .single();
          
        if (lobbyError) throw lobbyError;
        
        setLobbyDetails(lobby);
        setIsHost(lobby.host_id === user?.id);
        
        if (lobby.status === 'in_progress') {
          // Redirect to battle
          let battleRoute = '';
          
          switch (lobby.battle_type) {
            case '1v1':
              battleRoute = `/battle/multiplayer/${lobbyId}`;
              break;
            case '3player':
              battleRoute = `/3-player-battle/${lobbyId}`;
              break;
            case '4player':
              battleRoute = `/4-player-user-lobby/${lobbyId}`;
              break;
          }
          
          navigate(battleRoute);
          return;
        } else if (lobby.status !== 'waiting') {
          throw new Error('This lobby is no longer available');
        }
        
        // Fetch participants with profiles
        const { data: participantsData, error: participantsError } = await supabase
          .from('lobby_participants')
          .select(`
            *,
            profiles:user_id (username, profile_image_url)
          `)
          .eq('lobby_id', lobbyId)
          .order('player_number', { ascending: true });
          
        if (participantsError) throw participantsError;
        
        // Format participants data
        const formattedParticipants = participantsData.map(participant => ({
          ...participant,
          username: participant.profiles?.username || 'Unknown Player',
          profile_image_url: participant.profiles?.profile_image_url
        }));
        
        setParticipants(formattedParticipants);
      } catch (err: any) {
        console.error("Error fetching lobby details:", err);
        setError(err.message || "Failed to load lobby details");
        
        toast({
          title: "Error",
          description: err.message || "Failed to load lobby details",
          variant: "destructive"
        });
        
        // Navigate back to battle page after error
        setTimeout(() => navigate('/battle'), 2000);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLobbyDetails();
    
    // Set up subscription for participants changes
    const participantsChannel = supabase
      .channel(`lobby_participants:${lobbyId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'lobby_participants',
        filter: `lobby_id=eq.${lobbyId}`
      }, () => {
        fetchLobbyDetails();
      })
      .subscribe();
      
    // Set up subscription for lobby status changes
    const lobbyChannel = supabase
      .channel(`lobby_status:${lobbyId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'battle_lobbies',
        filter: `id=eq.${lobbyId}`
      }, (payload: any) => {
        // Check if status changed
        if (payload.new && payload.new.status !== 'waiting') {
          fetchLobbyDetails();
        }
      })
      .subscribe();
      
    // Start wait timer
    const waitInterval = setInterval(() => {
      setWaitTime(prev => prev + 1);
    }, 1000);
    
    return () => {
      clearInterval(waitInterval);
      supabase.removeChannel(participantsChannel);
      supabase.removeChannel(lobbyChannel);
    };
  }, [lobbyId, user, navigate]);
  
  const startBattle = async () => {
    if (!user || !lobbyDetails || !isHost) return;
    
    try {
      setIsStartingBattle(true);
      
      // Check if we have enough players
      if (participants.length < 2) {
        toast({
          title: "Not enough players",
          description: "You need at least 2 players to start a battle",
          variant: "destructive"
        });
        setIsStartingBattle(false);
        return;
      }
      
      // Update lobby status
      const { error } = await supabase
        .from('battle_lobbies')
        .update({ 
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', lobbyId);
        
      if (error) throw error;
      
      // Create battle session
      const { data: sessionData, error: sessionError } = await supabase
        .from('battle_sessions')
        .insert({
          battle_type: lobbyDetails.battle_type,
          status: 'active'
        })
        .select();
        
      if (sessionError) throw sessionError;
      
      const battleSessionId = sessionData[0].id;
      
      // Navigate to battle
      let battleRoute = '';
      switch (lobbyDetails.battle_type) {
        case '1v1':
          battleRoute = `/battle/multiplayer/${lobbyId}`;
          break;
        case '3player':
          battleRoute = `/3-player-battle/${lobbyId}`;
          break;
        case '4player':
          battleRoute = `/4-player-user-lobby/${lobbyId}`;
          break;
      }
      
      navigate(battleRoute);
    } catch (err: any) {
      console.error("Error starting battle:", err);
      toast({
        title: "Error",
        description: "Failed to start battle. Please try again.",
        variant: "destructive"
      });
      setIsStartingBattle(false);
    }
  };
  
  const leaveLobby = async () => {
    if (!user || !lobbyId) return;
    
    try {
      // Remove from lobby
      await supabase
        .from('lobby_participants')
        .delete()
        .eq('lobby_id', lobbyId)
        .eq('user_id', user.id);
        
      // If host, update lobby status to expired
      if (isHost) {
        await supabase
          .from('battle_lobbies')
          .update({ status: 'expired' })
          .eq('id', lobbyId);
      }
      
      toast({
        title: "Left Lobby",
        description: "You have left the battle lobby",
      });
      
      navigate('/battle');
    } catch (err: any) {
      console.error("Error leaving lobby:", err);
      toast({
        title: "Error",
        description: "Failed to leave lobby. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-fantasy-accent mb-2" />
          <p className="text-lg text-fantasy-accent">Loading lobby...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card className="border-2 border-red-500 bg-black/70">
          <CardHeader>
            <CardTitle className="text-2xl font-fantasy text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate('/battle')}>
              Return to Battle Menu
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-12 px-4">
      <Card className="border-2 border-fantasy-primary bg-black/70">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl font-fantasy text-fantasy-accent">
              {lobbyDetails?.name || 'Battle Lobby'}
            </CardTitle>
            <div className="flex items-center bg-fantasy-primary/20 p-2 rounded-md">
              <Clock className="mr-2 h-4 w-4" />
              <span>Waiting {formatTime(waitTime)}</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6">
            <h3 className="text-xl font-medium mb-3 flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Players ({participants.length}/{lobbyDetails?.max_players || 2})
            </h3>
            
            <div className="grid gap-4 mb-6">
              {participants.map((participant) => (
                <div 
                  key={participant.id} 
                  className="flex items-center justify-between bg-gray-800/40 p-3 rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-fantasy-primary rounded-full flex items-center justify-center text-sm">
                      {participant.player_number}
                    </div>
                    <div>
                      <p className="font-medium">{participant.username}</p>
                      {participant.user_id === lobbyDetails?.host_id && (
                        <span className="text-xs text-yellow-400">Host</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    {participant.is_ready ? (
                      <span className="text-green-400 flex items-center">
                        <UserCheck className="mr-1 h-4 w-4" /> Ready
                      </span>
                    ) : (
                      <span className="text-gray-400">Not Ready</span>
                    )}
                  </div>
                </div>
              ))}
              
              {lobbyDetails && Array.from({ 
                length: Math.max(0, lobbyDetails.max_players - participants.length) 
              }).map((_, index) => (
                <div 
                  key={`empty-${index}`} 
                  className="flex items-center justify-between bg-gray-800/20 p-3 rounded-md border border-dashed border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-sm opacity-50">
                      {participants.length + index + 1}
                    </div>
                    <p className="text-gray-500">Waiting for player...</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col md:flex-row gap-3 justify-between">
              <div>
                <h4 className="font-medium mb-1">Battle Type</h4>
                <div className="bg-fantasy-primary/20 px-3 py-1 rounded-md">
                  {lobbyDetails?.battle_type === '1v1' ? '1v1 Battle' :
                   lobbyDetails?.battle_type === '3player' ? '3-Player Tournament' :
                   '4-Player Battle'}
                </div>
              </div>
              
              {lobbyDetails?.use_timer && (
                <div>
                  <h4 className="font-medium mb-1">Timer</h4>
                  <div className="bg-fantasy-primary/20 px-3 py-1 rounded-md flex items-center">
                    <Timer className="mr-2 h-4 w-4" /> 10 Minute Rounds
                  </div>
                </div>
              )}
              
              {lobbyDetails?.use_music && (
                <div>
                  <h4 className="font-medium mb-1">Music</h4>
                  <div className="bg-fantasy-primary/20 px-3 py-1 rounded-md">
                    Music Enabled
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-wrap gap-3 justify-between">
          <Button 
            variant="outline" 
            onClick={leaveLobby}
            disabled={isStartingBattle}
          >
            Leave Lobby
          </Button>
          
          <div className="flex gap-3">
            {isHost && (
              <Button 
                onClick={() => setShowInviteModal(true)}
                variant="secondary"
                disabled={isStartingBattle}
              >
                Invite Players
              </Button>
            )}
            
            {isHost && (
              <Button
                className="fantasy-button"
                onClick={startBattle}
                disabled={participants.length < 2 || isStartingBattle}
              >
                {isStartingBattle ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting...
                  </>
                ) : (
                  'Start Battle'
                )}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
      
      {lobbyDetails && (
        <InviteUserModal
          open={showInviteModal}
          onOpenChange={setShowInviteModal}
          lobbyId={lobbyId}
          lobbyName={lobbyDetails.name}
          battleType={lobbyDetails.battle_type}
          maxPlayers={lobbyDetails.max_players}
        />
      )}
    </div>
  );
};
