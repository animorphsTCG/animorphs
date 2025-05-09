
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/modules/auth';
import { Loader2, Users, ArrowLeft } from 'lucide-react';
import { LobbyUI } from './LobbyUI';
import { useBattleLobby } from '../hooks/useBattleLobby';

interface WaitingRoomProps {
  lobbyId: string;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({ lobbyId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [lobbyExists, setLobbyExists] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  
  // Check if lobby exists and if user is participant
  useEffect(() => {
    const checkLobby = async () => {
      if (!lobbyId || !user) return;
      
      try {
        setIsLoading(true);
        
        // Check if lobby exists
        const { data: lobby, error: lobbyError } = await supabase
          .from('battle_lobbies')
          .select('*')
          .eq('id', lobbyId)
          .single();
          
        if (lobbyError) {
          if (lobbyError.code === 'PGRST116') { // not found
            toast({
              title: "Lobby Not Found",
              description: "This battle lobby doesn't exist or has expired",
              variant: "destructive"
            });
            navigate('/battle');
          } else {
            throw lobbyError;
          }
          return;
        }
        
        // Check if lobby is still open
        if (lobby.status !== 'waiting' && lobby.status !== 'in_progress') {
          toast({
            title: "Lobby Closed",
            description: "This battle lobby is no longer available",
            variant: "destructive"
          });
          navigate('/battle');
          return;
        }
        
        // Check if user is already a participant
        const { data: participant, error: participantError } = await supabase
          .from('lobby_participants')
          .select('*')
          .eq('lobby_id', lobbyId)
          .eq('user_id', user.id)
          .is('left_at', null)
          .maybeSingle();
          
        if (participantError) throw participantError;
        
        if (lobby && (participant || lobby.status === 'waiting')) {
          setLobbyExists(true);
        } else {
          // Lobby exists but user isn't participant and it's not waiting
          toast({
            title: "Cannot Join",
            description: "You cannot join this battle at this time",
            variant: "destructive"
          });
          navigate('/battle');
        }
      } catch (error) {
        console.error("Error checking lobby:", error);
        toast({
          title: "Error",
          description: "Failed to load battle information",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    checkLobby();
  }, [lobbyId, user, navigate]);
  
  const { isJoiningLobby, joinLobby } = useBattleLobby();
  
  // Handle join lobby action
  const handleJoinLobby = async () => {
    setIsJoining(true);
    
    if (await joinLobby(lobbyId)) {
      toast({
        title: "Lobby Joined",
        description: "You've successfully joined the battle lobby",
      });
    }
    
    setIsJoining(false);
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fantasy-accent" />
      </div>
    );
  }
  
  if (!lobbyExists) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto border-2 border-fantasy-primary bg-black/70">
          <CardContent className="p-6">
            <p>This battle lobby doesn't exist or has expired.</p>
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
  
  // User is in the lobby
  return <LobbyUI lobbyId={lobbyId} />;
};

export default WaitingRoom;
