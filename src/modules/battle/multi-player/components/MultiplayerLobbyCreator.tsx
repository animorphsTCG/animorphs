
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
import { measure } from '@/lib/monitoring';

export const MultiplayerLobbyCreator = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lobbyName, setLobbyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Using the performance measurement decorator
  const createLobby = measure('create_multiplayer_lobby')(async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a battle lobby",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Check if user has paid with retry logic
      let hasPaid = false;
      let retryCount = 0;
      
      while (retryCount < 3) {
        try {
          const { data, error } = await supabase.rpc('has_paid_unlock_fee', {
            user_id: user.id
          });
          
          if (error) throw error;
          
          hasPaid = !!data;
          break;
        } catch (err) {
          console.error(`Payment check failed (attempt ${retryCount + 1}/3):`, err);
          retryCount++;
          
          if (retryCount >= 3) throw err;
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 500));
        }
      }

      if (!hasPaid) {
        toast({
          title: "Access Restricted",
          description: "You need to unlock full access to create multiplayer battles",
          variant: "destructive"
        });
        return;
      }

      // Create the lobby with transaction
      const { data: lobby, error: lobbyError } = await supabase
        .from('battle_lobbies')
        .insert({
          name: lobbyName || 'Multiplayer Battle',
          host_id: user.id,
          battle_type: 'tournament',
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

      // Track creation success in monitoring
      console.log(`Lobby created successfully: ${lobby.id}`);
      
      navigate(`/battle/multiplayer/${lobby.id}`);
    } catch (error: any) {
      console.error('Error creating lobby:', error);
      setError(error.message || "Failed to create battle lobby");
      toast({
        title: "Error",
        description: "Failed to create battle lobby",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  });

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
              disabled={isCreating}
            />
          </div>
          
          {error && (
            <div className="text-sm text-red-500">
              {error}
            </div>
          )}
          
          <Button 
            className="w-full" 
            onClick={createLobby}
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
