
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/modules/auth';
import { d1Worker } from '@/lib/cloudflare/d1Worker';

interface LobbyData {
  id: string;
  name: string;
  host_id: string;
  battle_type: string;
  max_players: number;
  status: string;
  use_music: number;
  use_timer: number;
  created_at: string;
  updated_at: string;
}

const BattleLobbyCreator = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [name, setName] = useState('');
  const [battleType, setBattleType] = useState('1v1');
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [useMusic, setUseMusic] = useState(true);
  const [useTimer, setUseTimer] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleCreateLobby = async () => {
    if (!user || !token?.access_token) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a lobby',
        variant: 'destructive',
      });
      return;
    }

    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a lobby name',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      const lobbyData: LobbyData = {
        id: crypto.randomUUID(),
        name: name.trim(),
        host_id: user.id,
        battle_type: battleType,
        max_players: maxPlayers,
        status: 'waiting',
        use_music: useMusic ? 1 : 0,
        use_timer: useTimer ? 1 : 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await d1Worker.insert('battle_lobbies', lobbyData, token.access_token);
      
      toast({
        title: 'Success',
        description: 'Lobby created successfully',
      });
      
      navigate(`/battle/lobby/${lobbyData.id}`);
      
    } catch (error) {
      console.error('Error creating lobby:', error);
      toast({
        title: 'Error',
        description: 'Failed to create lobby',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Battle Lobby</CardTitle>
        <CardDescription>
          Set up a new battle lobby for players to join
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Lobby Name</Label>
          <Input
            id="name"
            placeholder="Enter lobby name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="battle-type">Battle Type</Label>
          <Select value={battleType} onValueChange={setBattleType}>
            <SelectTrigger id="battle-type">
              <SelectValue placeholder="Select battle type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1v1">1v1</SelectItem>
              <SelectItem value="2v2">2v2</SelectItem>
              <SelectItem value="free-for-all">Free-for-all</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="max-players">Max Players</Label>
          <Select 
            value={maxPlayers.toString()} 
            onValueChange={(value) => setMaxPlayers(parseInt(value))}
          >
            <SelectTrigger id="max-players">
              <SelectValue placeholder="Select max players" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 Players</SelectItem>
              <SelectItem value="4">4 Players</SelectItem>
              <SelectItem value="6">6 Players</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="use-music" className="flex-1">
            Enable Music
          </Label>
          <Switch
            id="use-music"
            checked={useMusic}
            onCheckedChange={setUseMusic}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="use-timer" className="flex-1">
            Enable Timer
          </Label>
          <Switch
            id="use-timer"
            checked={useTimer}
            onCheckedChange={setUseTimer}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={handleCreateLobby}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
            </>
          ) : (
            'Create Lobby'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BattleLobbyCreator;
