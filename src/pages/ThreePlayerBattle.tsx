
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Users } from 'lucide-react';
import { useAuth } from '@/modules/auth';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

const ThreePlayerBattle = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [availableLobbies, setAvailableLobbies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingLobby, setIsCreatingLobby] = useState(false);

  useEffect(() => {
    if (!user) return;

    fetchAvailableLobbies();
    
    const channel = supabase
      .channel('battle_lobbies')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'battle_lobbies'
        },
        () => {
          fetchAvailableLobbies();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchAvailableLobbies = async () => {
    try {
      setIsLoading(true);
      
      // Get lobbies that are waiting for players
      const { data, error } = await supabase
        .from('battle_lobbies')
        .select(`
          id, 
          name, 
          host_id, 
          max_players, 
          created_at,
          profiles:profiles!battle_lobbies_host_id_fkey (username),
          lobby_participants (id)
        `)
        .eq('status', 'waiting')
        .eq('battle_type', '3player')
        .eq('max_players', 3)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter lobbies that have less than max participants
      const availableLobbies = data
        .filter(lobby => lobby.lobby_participants.length < lobby.max_players)
        .map(lobby => ({
          ...lobby,
          hostUsername: lobby.profiles?.username,
          participantCount: lobby.lobby_participants.length
        }));

      setAvailableLobbies(availableLobbies);
    } catch (error) {
      console.error('Error fetching lobbies:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available lobbies',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createLobby = async () => {
    if (isCreatingLobby) return;
    
    try {
      setIsCreatingLobby(true);
      
      // Check if user is already in another battle or lobby
      const { data: userInBattle } = await supabase
        .rpc('user_in_battle', { user_id: user?.id });
        
      if (userInBattle) {
        toast({
          title: 'Already in battle',
          description: 'You are already participating in a battle',
          variant: 'destructive'
        });
        return;
      }
      
      const { data: userInLobby } = await supabase
        .rpc('user_in_lobby', { user_id: user?.id });
        
      if (userInLobby) {
        toast({
          title: 'Already in lobby',
          description: 'You are already participating in a lobby',
          variant: 'destructive'
        });
        return;
      }
      
      // Create new lobby for 3 players
      const lobbyName = `${user?.email?.split('@')[0]}'s Tournament`;
      const { data: lobby, error: lobbyError } = await supabase
        .from('battle_lobbies')
        .insert({
          name: lobbyName,
          host_id: user?.id,
          battle_type: '3player',
          max_players: 3,
          use_timer: true
        })
        .select()
        .single();

      if (lobbyError) throw lobbyError;

      // Add host as first participant
      const { error: participantError } = await supabase
        .from('lobby_participants')
        .insert({
          lobby_id: lobby.id,
          user_id: user?.id,
          player_number: 1
        });

      if (participantError) throw participantError;

      // Navigate to the battle page
      navigate(`/3-player-battle/${lobby.id}`);
    } catch (error) {
      console.error('Error creating lobby:', error);
      toast({
        title: 'Error',
        description: 'Failed to create battle lobby',
        variant: 'destructive'
      });
    } finally {
      setIsCreatingLobby(false);
    }
  };

  const joinLobby = async (lobbyId: string) => {
    try {
      // Check if user is already in another battle or lobby
      const { data: userInBattle } = await supabase
        .rpc('user_in_battle', { user_id: user?.id });
        
      if (userInBattle) {
        toast({
          title: 'Already in battle',
          description: 'You are already participating in a battle',
          variant: 'destructive'
        });
        return;
      }
      
      const { data: userInLobby } = await supabase
        .rpc('user_in_lobby', { user_id: user?.id });
        
      if (userInLobby) {
        toast({
          title: 'Already in lobby',
          description: 'You are already participating in a lobby',
          variant: 'destructive'
        });
        return;
      }
      
      // Get current participant count
      const { data: participants, error: countError } = await supabase
        .from('lobby_participants')
        .select('player_number')
        .eq('lobby_id', lobbyId)
        .order('player_number', { ascending: false });

      if (countError) throw countError;

      const nextPlayerNumber = participants.length + 1;

      // Join the lobby
      const { error: joinError } = await supabase
        .from('lobby_participants')
        .insert({
          lobby_id: lobbyId,
          user_id: user?.id,
          player_number: nextPlayerNumber
        });

      if (joinError) throw joinError;

      // Navigate to the battle page
      navigate(`/3-player-battle/${lobbyId}`);
    } catch (error) {
      console.error('Error joining lobby:', error);
      toast({
        title: 'Error',
        description: 'Failed to join battle lobby',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="border-2 border-fantasy-primary bg-black/70">
        <CardHeader>
          <CardTitle className="text-3xl font-fantasy text-fantasy-accent">
            3-Player Tournament
          </CardTitle>
          <CardDescription>
            Compete in a three-player relaxed tournament mode
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-8">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold mb-2">Tournament Rules</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Three players compete with equal decks</li>
                <li>Each round, players take turns selecting stats</li>
                <li>Winner of each round earns points</li>
                <li>Player with most points after 10 rounds wins</li>
              </ul>
            </div>
            <Button 
              onClick={createLobby} 
              disabled={isCreatingLobby}
              className="fantasy-button"
            >
              {isCreatingLobby ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
              ) : (
                <>Create New Tournament</>
              )}
            </Button>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Available Tournaments</h2>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-fantasy-accent" />
              </div>
            ) : availableLobbies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableLobbies.map((lobby) => (
                  <Card key={lobby.id} className="bg-black/30">
                    <CardHeader className="pb-2">
                      <CardTitle>{lobby.name}</CardTitle>
                      <CardDescription>
                        Created by {lobby.hostUsername || 'Unknown'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          <span>{lobby.participantCount}/{lobby.max_players} Players</span>
                        </div>
                        <Button 
                          onClick={() => joinLobby(lobby.id)}
                          size="sm"
                        >
                          Join
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-800/20 rounded-lg">
                <p>No tournaments available. Create one to get started!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThreePlayerBattle;
