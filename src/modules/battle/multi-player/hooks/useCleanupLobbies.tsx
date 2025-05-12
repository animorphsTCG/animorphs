
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export const useCleanupLobbies = () => {
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [lastCleanupTime, setLastCleanupTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Run cleanup once when component mounts
    cleanupStaleLobbies();
    
    // Set up interval to run cleanup every 5 minutes
    cleanupIntervalRef.current = setInterval(cleanupStaleLobbies, 5 * 60 * 1000);
    
    // Clean up the interval when the component unmounts
    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, []);
  
  const cleanupStaleLobbies = async () => {
    try {
      setIsCleaningUp(true);
      setError(null);
      
      // Find lobbies that have been waiting for more than 30 minutes
      const thirtyMinutesAgo = new Date();
      thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);
      
      // Clean up stale waiting lobbies
      const { data: staleLobbies, error: staleError } = await supabase
        .from('battle_lobbies')
        .select('id')
        .eq('status', 'waiting')
        .lt('created_at', thirtyMinutesAgo.toISOString());
        
      if (staleError) throw staleError;
      
      if (staleLobbies && staleLobbies.length > 0) {
        console.log(`Cleaning up ${staleLobbies.length} stale waiting lobbies`);
        
        // Delete the stale lobbies (cascade will remove participants too)
        await supabase
          .from('battle_lobbies')
          .update({ status: 'expired' })
          .in('id', staleLobbies.map(lobby => lobby.id));
      }
      
      // Find in_progress lobbies that haven't been updated in 2 hours
      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
      
      const { data: staleInProgressLobbies, error: progressError } = await supabase
        .from('battle_lobbies')
        .select('id')
        .eq('status', 'in_progress')
        .lt('updated_at', twoHoursAgo.toISOString());
        
      if (progressError) throw progressError;
      
      if (staleInProgressLobbies && staleInProgressLobbies.length > 0) {
        console.log(`Cleaning up ${staleInProgressLobbies.length} stale in-progress lobbies`);
        
        // Mark as completed
        await supabase
          .from('battle_lobbies')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .in('id', staleInProgressLobbies.map(lobby => lobby.id));
      }
      
      console.log("Cleaned up stale battle queue entries");
      console.log("Marked old waiting lobbies as abandoned");
      
      setLastCleanupTime(new Date());
    } catch (err: any) {
      console.error("Error cleaning up stale lobbies:", err);
      setError(err.message || "Failed to clean up stale lobbies");
    } finally {
      setIsCleaningUp(false);
    }
  };
  
  return {
    isCleaningUp,
    lastCleanupTime,
    error,
    cleanupStaleLobbies
  };
};

export default useCleanupLobbies;
