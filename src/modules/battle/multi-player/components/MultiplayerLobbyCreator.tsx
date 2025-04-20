
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export const MultiplayerLobbyCreator = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lobbyName, setLobbyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateLobby = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a battle lobby",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);

    try {
      // Check if user has paid
      const { data: hasPaid } = await supabase.rpc('has_paid_unlock_fee', {
        user_id: user.id
      });

      if (!hasPaid) {
        toast({
          title: "Access Restricted",
          description: "You need to unlock full access to create multiplayer battles",
          variant: "destructive"
        });
        return;
      }

      // Create the lobby
      const { data: lobby, error: lobbyError } = await supabase
        .from('battle_lobbies')
        .insert({
          name: lobbyName || 'Multiplayer Battle',
          host_id: user.id,
          battle_type: 'multiplayer',
          max_players: 2,
          requires_payment: true
        })
        .select()
        .single();

      if (lobbyError) throw lobbyError;

      // Add host as first participant
      const { error: participantError } = await supabase
        .from('lobby_participants')
        .insert({
          lobby_id: lobby.id,
          user_id: user.id,
          player_number: 1
        });

      if (participantError) throw participantError;

      navigate(`/battle/multiplayer/${lobby.id}`);
    } catch (error) {
      console.error('Error creating lobby:', error);
      toast({
        title: "Error",
        description: "Failed to create battle lobby",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create 1v1 Multiplayer Battle</CardTitle>
        <CardDescription>Challenge another player to a battle</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="lobbyName">Lobby Name</Label>
            <Input
              id="lobbyName"
              value={lobbyName}
              onChange={(e) => setLobbyName(e.target.value)}
              placeholder="Enter a name for your lobby"
            />
          </div>
          <Button 
            className="w-full" 
            onClick={handleCreateLobby}
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Lobby'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
