
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/modules/auth';
import { eosAchievements, Achievement, Stat } from '@/lib/eos/eosAchievements';

export const useEOSAchievements = () => {
  const { user, token } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load achievements and stats
  const loadData = useCallback(async () => {
    if (!user?.id || !token?.access_token) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Load achievements
      const achievementsData = await eosAchievements.getAchievements(token.access_token, user.id);
      setAchievements(achievementsData);
      
      // Load stats
      const statsData = await eosAchievements.getStats(token.access_token, user.id);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to load achievements data:", error);
      setError(error.message || "Failed to load achievements and stats");
    } finally {
      setLoading(false);
    }
  }, [user, token]);
  
  // Load data when user or token changes
  useEffect(() => {
    if (user && token) {
      loadData();
    }
  }, [user, token, loadData]);
  
  // Update achievement progress
  const updateAchievementProgress = useCallback(async (
    achievementId: string,
    progress: number
  ) => {
    if (!user?.id || !token?.access_token) {
      return false;
    }
    
    try {
      const success = await eosAchievements.updateAchievementProgress(
        token.access_token,
        user.id,
        achievementId,
        progress
      );
      
      if (success) {
        // Update local state
        setAchievements(prev => prev.map(ach => 
          ach.id === achievementId 
            ? { ...ach, progress, unlocked: progress >= (ach.maxProgress || 0) }
            : ach
        ));
      }
      
      return success;
    } catch (error) {
      console.error(`Error updating achievement progress for ${achievementId}:`, error);
      return false;
    }
  }, [user, token]);
  
  // Update stat value
  const updateStat = useCallback(async (
    statName: string,
    value: number
  ) => {
    if (!user?.id || !token?.access_token) {
      return false;
    }
    
    try {
      const success = await eosAchievements.updateStat(
        token.access_token,
        user.id,
        statName,
        value
      );
      
      if (success) {
        // Update local state
        setStats(prev => prev.map(stat => 
          stat.name === statName ? { ...stat, value } : stat
        ));
      }
      
      return success;
    } catch (error) {
      console.error(`Error updating stat ${statName}:`, error);
      return false;
    }
  }, [user, token]);
  
  return {
    achievements,
    stats,
    loading,
    error,
    loadData,
    updateAchievementProgress,
    updateStat
  };
};

export default useEOSAchievements;
