
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/modules/auth"; // Updated import
import { toast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/supabase';
import { Loader2, Users } from "lucide-react";
import InviteUserModal from "./battle/InviteUserModal";

interface BattleLobbyCreatorProps {
  onLobbyCreate?: (lobbyData: any) => void;
}

const BattleLobbyCreator: React.FC<BattleLobbyCreatorProps> = ({ onLobbyCreate }) => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  
  const [lobbyName, setLobbyName] = useState("");
  const [playerCount, setPlayerCount] = useState<"1v1" | "3player" | "4player">("1v1");
  const [useTimer, setUseTimer] = useState(true);
  const [useMusic, setUseMusic] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [createdLobbyId, setCreatedLobbyId] = useState<string | null>(null);
  
  const userHasPaid = userProfile?.has_paid === true;
  
  const handleCreateLobby = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You need to be logged in to create a battle lobby.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    
    if (!userHasPaid) {
      toast({
        title: "Full Access Required",
        description: "You need to upgrade your account to create custom battle lobbies.",
        variant: "destructive",
      });
      navigate("/profile");
      return;
    }
    
    if (!lobbyName.trim()) {
      toast({
        title: "Lobby Name Required",
        description: "Please enter a name for your battle lobby.",
        variant: "destructive",
      });
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Check if user is already in another battle or lobby
      const { data: userInBattle } = await supabase
        .rpc('user_in_battle', { user_id: user.id });
        
      if (userInBattle) {
        toast({
          title: 'Already in battle',
          description: 'You are already participating in a battle',
          variant: 'destructive'
        });
        setIsCreating(false);
        return;
      }
      
      const { data: userInLobby } = await supabase
        .rpc('user_in_lobby', { user_id: user.id });
        
      if (userInLobby) {
        toast({
          title: 'Already in lobby',
          description: 'You are already participating in a lobby',
          variant: 'destructive'
        });
        setIsCreating(false);
        return;
      }
    
      const maxPlayers = playerCount === '1v1' ? 2 : 
                        playerCount === '3player' ? 3 : 4;
                        
      // Create the lobby
      const { data: lobby, error: lobbyError } = await supabase
        .from('battle_lobbies')
        .insert({
          name: lobbyName,
          host_id: user.id,
          battle_type: playerCount,
          max_players: maxPlayers,
          use_timer: useTimer,
          use_music: useMusic,
          requires_payment: true // All custom lobbies require payment
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
      
      const lobbyData = {
        id: lobby.id,
        name: lobbyName,
        playerCount,
        useTimer,
        useMusic,
        hostId: user.id
      };
      
      // Set the created lobby ID for the invite modal
      setCreatedLobbyId(lobby.id);
      
      if (onLobbyCreate) {
        onLobbyCreate(lobbyData);
      }
      
      // Show invite modal
      setShowInviteModal(true);
      setIsCreating(false);
      
      toast({
        title: "Lobby Created",
        description: "Your battle lobby has been created successfully.",
      });
      
    } catch (error) {
      console.error("Error creating lobby:", error);
      toast({
        title: "Error",
        description: "Failed to create battle lobby. Please try again.",
        variant: "destructive",
      });
      setIsCreating(false);
    }
  };
  
  const handleContinue = () => {
    if (!createdLobbyId) return;
    
    // Navigate to appropriate battle page
    let route = "";
    
    switch (playerCount) {
      case "1v1":
        route = "/battle/multiplayer/" + createdLobbyId;
        break;
      case "3player": 
        route = "/3-player-battle/" + createdLobbyId;
        break;
      case "4player":
        route = "/4-player-user-lobby/" + createdLobbyId;
        break;
    }
    
    navigate(route);
  };
  
  return (
    <>
      <Card className="border-2 border-fantasy-primary bg-black/70">
        <CardHeader>
          <CardTitle className="text-3xl font-fantasy text-fantasy-accent">Create Battle Lobby</CardTitle>
          <CardDescription>
            Set up a custom battle lobby and invite other players
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="lobbyName">Lobby Name</Label>
            <Input 
              id="lobbyName" 
              placeholder="Enter a name for your lobby"
              value={lobbyName}
              onChange={(e) => setLobbyName(e.target.value)}
              className="bg-gray-900/70"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Battle Mode</Label>
            <RadioGroup 
              value={playerCount} 
              onValueChange={(value) => setPlayerCount(value as "1v1" | "3player" | "4player")}
              className="flex flex-col md:flex-row gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1v1" id="mode-1v1" />
                <Label htmlFor="mode-1v1">1v1 Battle</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="3player" id="mode-3player" />
                <Label htmlFor="mode-3player">3-Player Tournament</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="4player" id="mode-4player" />
                <Label htmlFor="mode-4player">4-Player Lobby</Label>
              </div>
            </RadioGroup>
          </div>
          
          {(playerCount === "3player" || playerCount === "4player") && (
            <div className="space-y-2">
              <Label>Game Timer</Label>
              <RadioGroup 
                value={useTimer ? "yes" : "no"} 
                onValueChange={(value) => setUseTimer(value === "yes")}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="timer-yes" />
                  <Label htmlFor="timer-yes">Use 10-min Timer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="timer-no" />
                  <Label htmlFor="timer-no">No Timer</Label>
                </div>
              </RadioGroup>
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Background Music</Label>
            <RadioGroup 
              value={useMusic ? "yes" : "no"} 
              onValueChange={(value) => setUseMusic(value === "yes")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="music-yes" />
                <Label htmlFor="music-yes">Play My Playlist</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="music-no" />
                <Label htmlFor="music-no">No Music</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="pt-4">
            <Button 
              className="w-full fantasy-button" 
              onClick={handleCreateLobby}
              disabled={isCreating || !userHasPaid}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : !userHasPaid ? (
                'Upgrade Account to Create Lobby'
              ) : (
                'Create Battle Lobby'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {createdLobbyId && (
        <InviteUserModal
          open={showInviteModal}
          onOpenChange={(open) => {
            setShowInviteModal(open);
            if (!open) {
              handleContinue();
            }
          }}
          lobbyId={createdLobbyId}
          lobbyName={lobbyName}
          battleType={playerCount}
          maxPlayers={playerCount === '1v1' ? 2 : playerCount === '3player' ? 3 : 4}
        />
      )}
    </>
  );
};

export default BattleLobbyCreator;
