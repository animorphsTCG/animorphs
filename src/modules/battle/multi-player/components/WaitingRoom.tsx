
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/modules/auth';
import { toast } from '@/components/ui/use-toast';

interface WaitingRoomProps {
  lobbyId: string;
  onBattleStart?: () => void;
}

export const WaitingRoom = ({ lobbyId, onBattleStart }: WaitingRoomProps) => {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<any[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!lobbyId) return;

    const fetchLobbyDetails = async () => {
      try {
        const { data: lobby, error: lobbyError } = await supabase
          .from('battle_lobbies')
          .select('*')
          .eq('id', lobbyId)
          .single();

        if (lobbyError) throw lobbyError;

        setIsHost(lobby.host_id === user?.id);

        const { data: participants, error: participantsError } = await supabase
          .from('lobby_participants')
          .select(`
            *,
            profiles:user_id(username, profile_image_url)
          `)
          .eq('lobby_id', lobbyId);

        if (participantsError) throw participantsError;

        setParticipants(participants);
      } catch (error) {
        console.error('Error fetching lobby details:', error);
        toast({
          title: "Error",
          description: "Failed to load lobby details",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLobbyDetails();

    // Subscribe to participant changes
    const channel = supabase
      .channel(`lobby:${lobbyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lobby_participants',
          filter: `lobby_id=eq.${lobbyId}`
        },
        () => {
          fetchLobbyDetails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lobbyId, user?.id]);

  const startBattle = async () => {
    if (!isHost) return;

    try {
      const { error } = await supabase
        .from('battle_lobbies')
        .update({ status: 'in_progress' })
        .eq('id', lobbyId);

      if (error) throw error;

      onBattleStart?.();
    } catch (error) {
      console.error('Error starting battle:', error);
      toast({
        title: "Error",
        description: "Failed to start battle",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Waiting Room</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Players ({participants.length})
            </h3>
            {isHost && (
              <Button 
                onClick={startBattle}
                disabled={participants.length < 2}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Start Battle
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {participants.map((participant) => (
              <Card key={participant.id} className="p-4">
                <div className="flex items-center gap-4">
                  {participant.profiles?.profile_image_url && (
                    <img
                      src={participant.profiles.profile_image_url}
                      alt={participant.profiles.username}
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-semibold">{participant.profiles?.username}</p>
                    <p className="text-sm text-muted-foreground">
                      {participant.is_ready ? 'Ready' : 'Not Ready'}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
