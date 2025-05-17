
import { useState, useEffect } from 'react';
import { useAuth } from '@/modules/auth';
import { createChannel } from '@/lib/channel';
import { d1Worker } from '@/lib/cloudflare/d1Worker';
import { useToast } from '@/hooks/use-toast';

export interface BattleInvite {
  id: string;
  lobby_id: string;
  user_id: string;
  invited_by: string;
  battle_type: string;
  lobby_name: string;
  is_accepted: boolean;
  is_rejected: boolean;
  created_at: string;
  responded_at: string | null;
  from_username?: string;
}

export function useBattleInvites() {
  const { user, token } = useAuth();
  const [invites, setInvites] = useState<BattleInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    if (!user?.id || !token?.access_token) {
      setLoading(false);
      return;
    }
    
    let channel: any;
    let subscription: any;
    
    const loadInvites = async () => {
      try {
        setLoading(true);
        
        // Fetch invites from D1
        const pendingInvites = await d1Worker.query<BattleInvite>(
          `SELECT bi.*, p.username as from_username
           FROM battle_invites bi
           JOIN profiles p ON bi.invited_by = p.id
           WHERE bi.user_id = ? AND bi.is_accepted = 0 AND bi.is_rejected = 0`,
          { params: [user.id] },
          token.access_token
        );
        
        setInvites(pendingInvites);
        
        // Set up channel for real-time invites
        channel = createChannel(`invites:${user.id}`, user.id);
        subscription = channel.subscribe();
        
      } catch (err: any) {
        console.error("Error loading battle invites:", err);
        setError(err.message || "Failed to load battle invites");
      } finally {
        setLoading(false);
      }
    };
    
    loadInvites();
    
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
      
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [user, token]);
  
  const acceptInvite = async (inviteId: string) => {
    if (!user?.id || !token?.access_token) {
      toast({
        title: "Error",
        description: "You must be logged in to accept an invite",
        variant: "destructive"
      });
      return null;
    }
    
    try {
      // Update invite status in D1
      await d1Worker.execute(
        `UPDATE battle_invites 
         SET is_accepted = 1, responded_at = datetime('now') 
         WHERE id = ? AND user_id = ?`,
        { params: [inviteId, user.id] },
        token.access_token
      );
      
      // Get the updated invite
      const updatedInvite = await d1Worker.getOne<BattleInvite>(
        `SELECT * FROM battle_invites WHERE id = ?`,
        { params: [inviteId] },
        token.access_token
      );
      
      if (!updatedInvite) {
        throw new Error("Invite not found");
      }
      
      // Remove from local state
      setInvites(prev => prev.filter(invite => invite.id !== inviteId));
      
      toast({
        title: "Invite Accepted",
        description: "You've joined the battle!"
      });
      
      return updatedInvite;
      
    } catch (err: any) {
      console.error("Error accepting battle invite:", err);
      
      toast({
        title: "Error",
        description: err.message || "Failed to accept battle invite",
        variant: "destructive"
      });
      
      return null;
    }
  };
  
  const declineInvite = async (inviteId: string) => {
    if (!user?.id || !token?.access_token) {
      return false;
    }
    
    try {
      // Update invite status in D1
      await d1Worker.execute(
        `UPDATE battle_invites 
         SET is_rejected = 1, responded_at = datetime('now') 
         WHERE id = ? AND user_id = ?`,
        { params: [inviteId, user.id] },
        token.access_token
      );
      
      // Remove from local state
      setInvites(prev => prev.filter(invite => invite.id !== inviteId));
      
      toast({
        title: "Invite Declined",
        description: "You've declined the battle invite"
      });
      
      return true;
      
    } catch (err: any) {
      console.error("Error declining battle invite:", err);
      
      toast({
        title: "Error",
        description: err.message || "Failed to decline battle invite",
        variant: "destructive"
      });
      
      return false;
    }
  };
  
  return {
    invites,
    loading,
    error,
    acceptInvite,
    declineInvite
  };
}
