import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Users, Check, Crown, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useBattleLobby } from '../hooks/useBattleLobby';
import { useNavigate } from 'react-router-dom';
import { Lobby, Participant } from '../hooks/types';

interface LobbyUIProps {
  lobbyId: string;
  onLeave?: () => void;
}

export const LobbyUI: React.FC<LobbyUIProps> = ({ lobbyId, onLeave }) => {
  const navigate = useNavigate();
  const {
    lobby,
    participants,
    isOwner,
    isReady,
    isLeavingLobby,
    battleStarted,
    leaveLobby,
    setReady,
    startBattle
  } = useBattleLobby(lobbyId);
  
  // Function to handle leaving lobby
  const handleLeaveLobby = async () => {
    if (await leaveLobby()) {
      if (onLeave) {
        onLeave();
      } else {
        navigate('/battle');
      }
    }
  };
  
  if (!lobby) {
    return (
      <Card className="border-2 border-fantasy-primary bg-black/70">
        <CardContent className="py-6 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-fantasy-accent" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="border-2 border-fantasy-primary bg-black/70">
      <CardHeader>
        <CardTitle className="text-2xl font-fantasy text-fantasy-accent">
          {lobby.name}
        </CardTitle>
        <CardDescription>
          {lobby.battle_type === '1v1' ? '1v1 Battle' : 
           lobby.battle_type === '3player' ? '3-Player Tournament' : 
           '4-Player Battle'} • {participants.length}/{lobby.max_players} Players
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-5">
        {/* Lobby Status */}
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className={`h-3 w-3 rounded-full ${ battleStarted ? 'bg-yellow-500' : 'bg-green-500' } mr-2`}></div>
            <span>
              {battleStarted ? 'Battle in progress' : 'Waiting for players'}
            </span>
          </div>
          
          {lobby.useTimer && (
            <div className="flex items-center text-sm text-gray-400">
              <Clock className="mr-1 h-4 w-4" />
              <span>10-min timer enabled</span>
            </div>
          )}
        </div>
        
        {/* Players List */}
        <div className="space-y-3">
          <h3 className="font-medium">Players</h3>
          <div className="space-y-2">
            {participants.map((member) => (
              <div key={member.id} 
                className={`flex items-center justify-between p-2 rounded ${
                  member.isReady ? 'bg-green-500/10 border border-green-500/30' : 'bg-gray-800/50'
                }`}>
                <div className="flex items-center">
                  {member.isHost && <Crown className="h-4 w-4 text-yellow-500 mr-2" />}
                  <Avatar className="h-8 w-8 mr-3">
                    {member.profile_image_url ? (
                      <AvatarImage src={member.profile_image_url} />
                    ) : (
                      <AvatarFallback>{member.username?.charAt(0).toUpperCase()}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.username}</p>
                    <p className="text-xs text-gray-400">Player {member.player_number}</p>
                  </div>
                </div>
                
                <div>
                  {member.isReady ? (
                    <div className="flex items-center text-green-500">
                      <Check className="h-4 w-4 mr-1" />
                      <span className="text-xs">Ready</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Not Ready</span>
                  )}
                </div>
              </div>
            ))}
            
            {/* Empty Slots */}
            {Array.from({ length: lobby.max_players - participants.length }).map((_, i) => (
              <div key={`empty-${i}`} className="flex items-center justify-center p-4 rounded border border-dashed border-gray-700 bg-gray-900/30">
                <span className="text-gray-500">Empty Slot</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Ready Toggle - For current user */}
        {!battleStarted && (
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Switch
                id="ready-status"
                checked={isReady}
                onCheckedChange={setReady}
              />
              <Label htmlFor="ready-status">Ready</Label>
            </div>
            
            {isOwner && (
              <Button
                className="fantasy-button"
                disabled={participants.length < 2 || !participants.every(m => m.isReady)}
                onClick={startBattle}
              >
                <Users className="mr-2 h-4 w-4" />
                Start Battle
              </Button>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleLeaveLobby}
          disabled={isLeavingLobby || battleStarted}
        >
          {isLeavingLobby ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ArrowLeft className="mr-2 h-4 w-4" />
          )}
          {battleStarted ? "Battle In Progress" : "Leave Lobby"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LobbyUI;
