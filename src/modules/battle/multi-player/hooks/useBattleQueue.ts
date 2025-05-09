import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/modules/auth';
import { toast } from '@/components/ui/use-toast';
import { AnimorphCard } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { useEOSPresence } from './useEOSPresence';

interface QueueConfig {
  battleType: '1v1' | '3player' | '4player';
  deckCards: AnimorphCard[];
  metadata?: Record<string, any>;
}

export const useBattleQueue = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [inQueue, setInQueue] = useState(false);
  const [queueStartTime, setQueueStartTime] = useState<Date | null>(null);
  const [matchFound, setMatchFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queueId, setQueueId] = useState<string | null>(null);
  const [presenceStatus, setPresenceStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  
  // Initialize presence tracking
  const presence = useEOSPresence({
    heartbeatInterval: 5000, // Shorter interval for queue
  });
  
  useEffect(() => {
    setPresenceStatus(presence.connectionStatus);
  }, [presence.connectionStatus]);
  
  // Format queue time
  const formattedQueueTime = (): string => {
    if (!queueStartTime) return '0';
    const now = new Date();
    const diff = now.getTime() - queueStartTime.getTime();
    const seconds = Math.floor(diff / 1000);
    return seconds.toString();
  };
  
  // Join the battle queue
  const joinQueue = useCallback(async (config: QueueConfig) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You need to be logged in to join the battle queue",
        variant: "destructive"
      });
      return;
    }
    
    if (inQueue) {
      toast({
        title: "Already In Queue",
        description: "You are already in the battle queue",
        variant: "destructive"
      });
      return;
    }
    
    setInQueue(true);
    setQueueStartTime(new Date());
    setError(null);
    
    const newQueueId = uuidv4();
    setQueueId(newQueueId);
    
    try {
      // Insert into battle_queue
      const { error: queueError } = await supabase
        .from('battle_queue')
        .insert({
          id: newQueueId,
          user_id: user.id,
          battle_type: config.battleType,
          deck_data: config.deckCards,
          metadata: config.metadata || {}
        });
        
      if (queueError) throw queueError;
      
      // Set presence status
      presence.setStatus('queueing');
      
      toast({
        title: "Joined Battle Queue",
        description: `Looking for a ${config.battleType} battle...`,
      });
    } catch (err: any) {
      console.error("Error joining battle queue:", err);
      setError(err.message || "Failed to join battle queue");
      setInQueue(false);
      setQueueStartTime(null);
      toast({
        title: "Error",
        description: "Failed to join battle queue",
        variant: "destructive"
      });
    }
  }, [user, inQueue, presence]);
  
  // Leave the battle queue
  const leaveQueue = useCallback(async () => {
    if (!user || !inQueue) return;
    
    try {
      // Delete from battle_queue
      const { error: queueError } = await supabase
        .from('battle_queue')
        .delete()
        .eq('user_id', user.id);
        
      if (queueError) throw queueError;
      
      // Reset state
      setInQueue(false);
      setQueueStartTime(null);
      setMatchFound(false);
      
      // Reset presence
      presence.setStatus('online');
      
      toast({
        title: "Left Battle Queue",
        description: "You have left the battle queue.",
      });
    } catch (err: any) {
      console.error("Error leaving battle queue:", err);
      setError(err.message || "Failed to leave battle queue");
      toast({
        title: "Error",
        description: "Failed to leave battle queue",
        variant: "destructive"
      });
    }
  }, [user, inQueue, presence]);

  // Handle match found
  const handleMatchFound = useCallback(async (payload: any) => {
    try {
      console.log('Match found:', payload);
      setMatchFound(true);

      // Get the battle type from the queue record
      const { data: queueData, error: queueError } = await supabase
        .from('battle_queue')
        .select('battle_type')
        .eq('user_id', user?.id)
        .single();

      if (queueError) throw queueError;
      
      const battleType = queueData ? queueData.battle_type : '1v1'; // Default to 1v1 if not found
      
      toast({
        title: "Match Found!",
        description: `Preparing your ${battleType} battle...`,
      });
      
      // Navigate to the battle
      setTimeout(() => {
        navigate(`/battle/multiplayer/${payload.record.id}`);
      }, 2000);
    } catch (error) {
      console.error('Error handling match found:', error);
    }
  }, [user, navigate]);
  
  // Subscribe to queue changes
  useEffect(() => {
    if (!user) return;
    
    // Listen for matches
    const channel = supabase
      .channel('battle_queue')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'battle_sessions', filter: `player_ids @> array["${user.id}"]` }, 
        handleMatchFound
      )
      .subscribe();
      
    // Clean up subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, handleMatchFound]);
  
  return {
    inQueue,
    queueStartTime,
    formattedQueueTime,
    matchFound,
    error,
    presenceStatus,
    joinQueue,
    leaveQueue
  };
};
