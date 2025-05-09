
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

// This hook automatically cleans up stale lobbies and battle queue entries
export const useCleanupLobbies = () => {
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Clean up stale lobbies and queue entries on mount
    const performCleanup = async () => {
      try {
        // 1. Clean up stale battle queue entries (older than 15 minutes)
        const fifteenMinutesAgo = new Date();
        fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);
        
        await supabase
          .from('battle_queue')
          .delete()
          .lt('created_at', fifteenMinutesAgo.toISOString());
          
        console.log("Cleaned up stale battle queue entries");
        
        // 2. Mark waiting lobbies as abandoned if they're over 30 minutes old
        const thirtyMinutesAgo = new Date();
        thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);
        
        await supabase
          .from('battle_lobbies')
          .update({ status: 'abandoned' })
          .eq('status', 'waiting')
          .lt('created_at', thirtyMinutesAgo.toISOString());
          
        console.log("Marked old waiting lobbies as abandoned");
        
      } catch (error) {
        console.error("Error cleaning up stale lobbies:", error);
      }
    };
    
    // Perform cleanup immediately on mount
    performCleanup();
    
    // Set up interval for periodic cleanup (every 3 minutes)
    cleanupIntervalRef.current = setInterval(performCleanup, 3 * 60 * 1000);
    
    // Clean up on unmount
    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, []);
  
  // No need to expose anything as this is a background utility
  return null;
};

export default useCleanupLobbies;
