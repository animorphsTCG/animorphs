
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/context/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user || !userProfile) {
    return <div className="container mx-auto py-12 px-4">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Player Stats</CardTitle>
            <CardDescription>Your current game statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Match Points:</span>
                <span className="font-medium">{userProfile.mp}</span>
              </div>
              <div className="flex justify-between">
                <span>Leaderboard Points:</span>
                <span className="font-medium">{userProfile.lbp}</span>
              </div>
              <div className="flex justify-between">
                <span>AI Points:</span>
                <span className="font-medium">{userProfile.ai_points}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Battles</CardTitle>
            <CardDescription>Your most recent game results</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No recent battles found.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get into the game quickly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <button 
              className="w-full py-2 bg-fantasy-primary hover:bg-fantasy-primary/80 rounded-md transition-colors"
              onClick={() => navigate('/battle')}
            >
              Start Battle
            </button>
            <button 
              className="w-full py-2 bg-fantasy-secondary hover:bg-fantasy-secondary/80 rounded-md transition-colors"
              onClick={() => navigate('/deck-builder')}
            >
              Edit Deck
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
