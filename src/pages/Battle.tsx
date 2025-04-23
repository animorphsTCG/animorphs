import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { UserPlus, Users, Trophy, Bot, Plus } from "lucide-react";
import BattleLobbyCreator from "@/components/BattleLobbyCreator";
import { toast } from "@/components/ui/use-toast";

const Battle = () => {
  const navigate = useNavigate();
  const { user, userProfile, isLoading, refreshProfile } = useAuth();
  const [showLobbyCreator, setShowLobbyCreator] = useState(false);
  
  const userHasPaid = userProfile?.has_paid === true;

  useEffect(() => {
    if (user && !isLoading) {
      refreshProfile();
      console.log("Battle page - User:", user.id);
      console.log("Battle page - User profile:", userProfile);
      console.log("Battle page - Payment status:", userHasPaid ? "Paid" : "Not paid");
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-80">
        <div className="text-xl text-fantasy-accent">Loading...</div>
      </div>
    );
  }

  const singlePlayerModes = [
    {
      title: "Visitor Demo Battle",
      description: "Try a sample battle against the AI without an account",
      path: "/visitor-demo-battle",
      requiresAuth: false,
      icon: <Bot className="h-5 w-5" />,
      paymentEnforced: false
    },
    {
      title: "1v1 Battle",
      description: "Challenge the AI to a 1-on-1 battle",
      path: "/1v1-battle",
      requiresAuth: true,
      icon: <UserPlus className="h-5 w-5" />,
      paymentEnforced: false    // Free for registered users!
    }
  ];

  const multiPlayerModes = [
    {
      title: "1v1 Multiplayer Battle",
      description: "Challenge another player to a 1v1 battle (Requires Full Access)",
      path: "/battle/multiplayer",
      requiresAuth: true,
      paymentEnforced: true,   // Paid users only
      icon: <Users className="h-5 w-5" />
    },
    {
      title: "3-Player Battle (Relaxed Tournament)",
      description: "Compete in a three-player relaxed tournament mode",
      path: "/3-player-battle",
      requiresAuth: true,
      paymentEnforced: true,   // Paid users only
      icon: <Users className="h-5 w-5" />
    },
    {
      title: "4-Player Public Lobby (3 Users vs AI)",
      description: "Join forces with two other players against the AI",
      path: "/4-player-public-battle",
      requiresAuth: true,
      paymentEnforced: true,   // Paid users only
      icon: <Bot className="h-5 w-5" />
    },
    {
      title: "4-Player User Lobby",
      description: "Create or join a custom lobby with four human players",
      path: "/4-player-user-lobby",
      requiresAuth: true,
      paymentEnforced: true,   // Paid users only
      icon: <Users className="h-5 w-5" />
    }
  ];

  const getButtonLabel = (mode) => {
    if (!mode.requiresAuth && !mode.paymentEnforced) {
      return "Play Now"; // Free mode, no auth required
    }
    
    if (mode.requiresAuth && !user) {
      return "Login to Play"; // Auth required but not logged in
    }
    
    if (mode.paymentEnforced && !userHasPaid) {
      return "Unlock with Payment"; // Payment required but not paid
    }
    
    return "Play Now"; // Auth requirements met and payment requirements met (or not needed)
  };

  const handleModeClick = (mode) => {
    if (mode.requiresAuth && !user) {
      return navigate('/login');
    }
    
    if (mode.paymentEnforced && !userHasPaid) {
      toast({
        title: "Payment Required",
        description: "This game mode requires full access. Please upgrade your account.",
      });
      return navigate('/profile');
    }
    
    navigate(mode.path);
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-4xl font-fantasy text-fantasy-accent text-center mb-8">Battle Modes</h1>
      {user && userProfile && (
        <div className="text-center mb-4">
          <p className="text-sm">
            Account status: <span className={userHasPaid ? "text-green-500 font-bold" : "text-yellow-500"}>
              {userHasPaid ? "Full Access" : "Basic Access"}
            </span>
          </p>
        </div>
      )}
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
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-fantasy text-fantasy-accent mb-4">Single Player Modes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {singlePlayerModes.map((mode, index) => (
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
                        className={`w-full ${getButtonLabel(mode) === "Play Now" ? 'fantasy-button' : 'bg-gray-600 hover:bg-gray-700'}`}
                        onClick={() => handleModeClick(mode)}
                      >
                        {getButtonLabel(mode)}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
            <section>
              <h2 className="text-2xl font-fantasy text-fantasy-accent mb-4">Multiplayer Modes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {multiPlayerModes.map((mode, index) => (
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
                        className={`w-full ${getButtonLabel(mode) === "Play Now" ? 'fantasy-button' : 'bg-gray-600 hover:bg-gray-700'}`}
                        onClick={() => handleModeClick(mode)}
                      >
                        {getButtonLabel(mode)}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
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
