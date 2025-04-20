
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { useBattleLobby, BattleLobbyConfig } from '../hooks/useBattleLobby';
import { useNavigate } from 'react-router-dom';

export const LobbyCreator = () => {
  const navigate = useNavigate();
  const { createLobby, isCreatingLobby } = useBattleLobby();
  
  const [lobbyName, setLobbyName] = useState('');
  const [battleType, setBattleType] = useState<'1v1' | '3player' | '4player'>('1v1');
  const [useTimer, setUseTimer] = useState(false);
  const [useMusic, setUseMusic] = useState(false);

  const handleCreateLobby = async () => {
    const config: BattleLobbyConfig = {
      name: lobbyName,
      battleType,
      useTimer,
      useMusic
    };

    const lobbyId = await createLobby(config);
    if (lobbyId) {
      navigate(`/battle/lobby/${lobbyId}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Battle Lobby</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="lobbyName">Lobby Name</Label>
          <Input
            id="lobbyName"
            value={lobbyName}
            onChange={(e) => setLobbyName(e.target.value)}
            placeholder="Enter a name for your lobby"
          />
        </div>

        <div className="space-y-2">
          <Label>Battle Type</Label>
          <RadioGroup
            value={battleType}
            onValueChange={(value) => setBattleType(value as '1v1' | '3player' | '4player')}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="1v1" id="battle-1v1" />
              <Label htmlFor="battle-1v1">1v1 Battle</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="3player" id="battle-3player" />
              <Label htmlFor="battle-3player">3 Player Battle</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="4player" id="battle-4player" />
              <Label htmlFor="battle-4player">4 Player Battle</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="useTimer">Use Timer</Label>
            <Switch
              id="useTimer"
              checked={useTimer}
              onCheckedChange={setUseTimer}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="useMusic">Background Music</Label>
            <Switch
              id="useMusic"
              checked={useMusic}
              onCheckedChange={setUseMusic}
            />
          </div>
        </div>

        <Button
          className="w-full"
          onClick={handleCreateLobby}
          disabled={!lobbyName.trim() || isCreatingLobby}
        >
          {isCreatingLobby ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Lobby...
            </>
          ) : (
            'Create Lobby'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
