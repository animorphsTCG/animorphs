
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Battle = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const battleModes = [
    {
      title: "Visitor Demo Battle",
      description: "Try a sample battle against the AI without an account",
      path: "/visitor-demo-battle",
      requiresAuth: false,
    },
    {
      title: "1v1 Battle",
      description: "Challenge another player or AI to a 1-on-1 battle",
      path: "/1v1-battle",
      requiresAuth: true,
    },
    {
      title: "3-Player Battle (Relaxed Tournament)",
      description: "Compete in a three-player relaxed tournament mode",
      path: "/3-player-battle",
      requiresAuth: true,
    },
    {
      title: "4-Player Public Lobby (3 Users vs AI)",
      description: "Join forces with two other players against the AI",
      path: "/4-player-public-battle",
      requiresAuth: true,
    },
    {
      title: "4-Player User Lobby",
      description: "Create or join a custom lobby with four human players",
      path: "/4-player-user-lobby",
      requiresAuth: true,
    },
  ];
  
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-4xl font-fantasy text-fantasy-accent text-center mb-8">Battle Modes</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {battleModes.map((mode, index) => (
          <Card key={index} className="border-2 border-fantasy-primary bg-black/70 hover:border-fantasy-accent transition-colors">
            <CardHeader>
              <CardTitle className="text-2xl font-fantasy text-fantasy-accent">{mode.title}</CardTitle>
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
    </div>
  );
};

export default Battle;
