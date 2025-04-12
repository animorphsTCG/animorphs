
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/ClerkAuthContext";
import { toast } from "@/components/ui/use-toast";

interface BattleLobbyCreatorProps {
  onLobbyCreate?: (lobbyData: any) => void;
}

const BattleLobbyCreator: React.FC<BattleLobbyCreatorProps> = ({ onLobbyCreate }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [lobbyName, setLobbyName] = useState("");
  const [playerCount, setPlayerCount] = useState<"1v1" | "3player" | "4player">("1v1");
  const [useTimer, setUseTimer] = useState(true);
  const [useMusic, setUseMusic] = useState(false);
  
  const handleCreateLobby = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You need to be logged in to create a battle lobby.",
        variant: "destructive",
      });
      navigate("/login");
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
    
    const lobbyData = {
      name: lobbyName,
      playerCount,
      useTimer,
      useMusic,
      hostId: user.id
    };
    
    if (onLobbyCreate) {
      onLobbyCreate(lobbyData);
    } else {
      // Default behavior - navigate to appropriate lobby page
      let route = "";
      
      switch (playerCount) {
        case "1v1":
          route = "/1v1-battle";
          break;
        case "3player": 
          route = "/3-player-battle";
          break;
        case "4player":
          route = "/4-player-user-lobby";
          break;
      }
      
      navigate(route, { state: lobbyData });
    }
  };
  
  return (
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
          >
            Create Battle Lobby
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BattleLobbyCreator;
