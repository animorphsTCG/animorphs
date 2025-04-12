
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface UserStatsProps {
  userId: string;
}

interface UserStatsData {
  total_battles: number;
  wins: number;
  losses: number;
  favorite_card_id?: number;
  favorite_card_name?: string;
}

const UserStats: React.FC<UserStatsProps> = ({ userId }) => {
  const [stats, setStats] = useState<UserStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        setIsLoading(true);
        
        // For now, we'll just show placeholder stats
        // This can be expanded later to fetch real battle statistics from the database
        setTimeout(() => {
          setStats({
            total_battles: 0,
            wins: 0,
            losses: 0
          });
          setIsLoading(false);
        }, 800);
        
      } catch (error) {
        console.error("Error fetching user stats:", error);
        setIsLoading(false);
      }
    };

    fetchUserStats();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-fantasy-accent" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="p-4 bg-black/40 border-fantasy-primary/30">
        <h3 className="text-lg font-semibold mb-2">Battle Statistics</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Total Battles:</span>
            <span className="font-medium">{stats?.total_battles || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Wins:</span>
            <span className="font-medium text-green-400">{stats?.wins || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Losses:</span>
            <span className="font-medium text-red-400">{stats?.losses || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Win Rate:</span>
            <span className="font-medium">
              {stats && stats.total_battles > 0 
                ? `${Math.round((stats.wins / stats.total_battles) * 100)}%` 
                : '0%'}
            </span>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-black/40 border-fantasy-primary/30">
        <h3 className="text-lg font-semibold mb-2">Card Collection</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Favorite Card:</span>
            <span className="font-medium">{stats?.favorite_card_name || "None"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Collection Status:</span>
            <span className="font-medium text-fantasy-accent">
              {stats?.favorite_card_id ? "Active" : "No cards yet"}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UserStats;
