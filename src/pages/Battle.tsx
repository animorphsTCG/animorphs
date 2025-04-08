
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserPlus, Users, Trophy, Bot, Plus } from "lucide-react";
import BattleLobbyCreator from "@/components/BattleLobbyCreator";

const Battle = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showLobbyCreator, setShowLobbyCreator] = useState(false);
  
  const battleModes = [
    {
      title: "Visitor Demo Battle",
      description: "Try a sample battle against the AI without an account",
      path: "/visitor-demo-battle",
      requiresAuth: false,
      icon: <Bot className="h-5 w-5" />
    },
    {
      title: "1v1 Battle",
      description: "Challenge another player or AI to a 1-on-1 battle",
      path: "/1v1-battle",
      requiresAuth: true,
      icon: <UserPlus className="h-5 w-5" />
    },
    {
      title: "3-Player Battle (Relaxed Tournament)",
      description: "Compete in a three-player relaxed tournament mode",
      path: "/3-player-battle",
      requiresAuth: true,
      icon: <Users className="h-5 w-5" />
    },
    {
      title: "4-Player Public Lobby (3 Users vs AI)",
      description: "Join forces with two other players against the AI",
      path: "/4-player-public-battle",
      requiresAuth: true,
      icon: <Bot className="h-5 w-5" />
    },
    {
      title: "4-Player User Lobby",
      description: "Create or join a custom lobby with four human players",
      path: "/4-player-user-lobby",
      requiresAuth: true,
      icon: <Users className="h-5 w-5" />
    },
  ];
  
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-4xl font-fantasy text-fantasy-accent text-center mb-8">Battle Modes</h1>
      
      {showLobbyCreator ? (
        <div className="max-w-2xl mx-auto">
          <BattleLobbyCreator />
          
          <div className="text-center mt-4">
            <Button
              variant="outline"
              onClick={() => setShowLobbyCreator(false)}
              className="mt-4"
            >
              Back to Battle Modes
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-8 flex justify-center">
            <Button
              className="fantasy-button"
              onClick={() => setShowLobbyCreator(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> Create Custom Battle Lobby
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {battleModes.map((mode, index) => (
              <Card key={index} className="border-2 border-fantasy-primary bg-black/70 hover:border-fantasy-accent transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    {mode.icon}
                    <CardTitle className="text-2xl font-fantasy text-fantasy-accent">{mode.title}</CardTitle>
                  </div>
                  <CardDescription>{mode.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full fantasy-button"
                    onClick={() => {
                      if (mode.requiresAuth && !user) {
                        navigate('/login');
                      } else {
                        navigate(mode.path);
                      }
                    }}
                  >
                    {mode.requiresAuth && !user ? "Login to Play" : "Play Now"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Card className="max-w-md mx-auto border-2 border-fantasy-accent bg-black/70">
              <CardHeader>
                <CardTitle className="text-2xl font-fantasy text-fantasy-accent flex items-center justify-center gap-2">
                  <Trophy className="text-yellow-400" /> Leaderboards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">View your ranking and compete for top positions!</p>
                <Button className="fantasy-button" onClick={() => navigate("/leaderboard")}>
                  View Leaderboards
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Battle;
