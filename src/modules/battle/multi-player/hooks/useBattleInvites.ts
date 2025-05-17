
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/modules/auth';
import { d1Database } from '@/lib/d1Database';
import { createChannelWithCallback } from '@/lib/channel';
import { toast } from '@/components/ui/use-toast';

interface BattleInvite {
  id: string;
  from_user_id: string;
  from_username?: string;
  to_user_id: string;
  created_at: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  lobby_id?: string;
}

export const useBattleInvites = () => {
  const { user, token } = useAuth();
  const [sentInvites, setSentInvites] = useState<BattleInvite[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<BattleInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load invites
  const loadInvites = useCallback(async () => {
    if (!user?.id || !token?.access_token) {
      setSentInvites([]);
      setReceivedInvites([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Get sent invites
      const sentResult = await d1Database.query(`
        SELECT i.*, p.username as from_username
        FROM battle_invites i
        JOIN profiles p ON i.from_user_id = p.id
        WHERE i.from_user_id = ? AND i.status = 'pending'
      `, { params: [user.id] });
      
      setSentInvites(sentResult || []);
      
      // Get received invites
      const receivedResult = await d1Database.query(`
        SELECT i.*, p.username as from_username
        FROM battle_invites i
        JOIN profiles p ON i.from_user_id = p.id
        WHERE i.to_user_id = ? AND i.status = 'pending'
      `, { params: [user.id] });
      
      setReceivedInvites(receivedResult || []);
      
    } catch (err) {
      console.error('Error loading battle invites:', err);
      setError('Failed to load invites');
    } finally {
      setLoading(false);
    }
  }, [user, token]);
  
  // Load invites on mount and when user changes
  useEffect(() => {
    loadInvites();
  }, [loadInvites]);
  
  // Setup subscription for invite changes
  useEffect(() => {
    if (!user?.id) return;
    
    const { subscription: sentSubscription } = createChannelWithCallback(
      `battle_invites:${user.id}:sent`,
      'update',
      () => loadInvites()
    );
    
    const { subscription: receivedSubscription } = createChannelWithCallback(
      `battle_invites:${user.id}:received`,
      'update',
      () => loadInvites()
    );
    
    return () => {
      if (sentSubscription) sentSubscription.unsubscribe();
      if (receivedSubscription) receivedSubscription.unsubscribe();
    };
  }, [user, loadInvites]);
  
  // Send invite function
  const sendInvite = useCallback(async (toUserId: string): Promise<string | null> => {
    if (!user?.id || !token?.access_token) return null;
    
    if (user.id === toUserId) {
      toast({
        title: "Error",
        description: "You cannot invite yourself",
        variant: "destructive"
      });
      return null;
    }
    
    try {
      // Check if we already have a pending invite to this user
      const existingInvite = sentInvites.find(invite => 
        invite.to_user_id === toUserId && invite.status === 'pending'
      );
      
      if (existingInvite) {
        toast({
          title: "Invite Exists",
          description: "You already sent an invite to this user",
          variant: "destructive"
        });
        return null;
      }
      
      // Generate a unique ID for the invite
      const inviteId = crypto.randomUUID();
      
      // Set expiry time (30 minutes from now)
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
      
      // Insert the invite
      await d1Database.query(`
        INSERT INTO battle_invites (
          id,
          from_user_id,
          to_user_id,
          status,
          created_at,
          expires_at
        )
        VALUES (?, ?, ?, 'pending', CURRENT_TIMESTAMP, ?)
      `, {
        params: [
          inviteId,
          user.id,
          toUserId,
          expiresAt
        ]
      });
      
      // Refresh invites
      await loadInvites();
      
      toast({
        title: "Invite Sent",
        description: "Battle invite has been sent",
      });
      
      return inviteId;
    } catch (err) {
      console.error('Error sending battle invite:', err);
      
      toast({
        title: "Error",
        description: "Failed to send invite",
        variant: "destructive"
      });
      
      return null;
    }
  }, [user, token, sentInvites, loadInvites]);
  
  // Accept invite function
  const acceptInvite = useCallback(async (inviteId: string): Promise<string | null> => {
    if (!user?.id || !token?.access_token) return null;
    
    try {
      // Find the invite
      const invite = receivedInvites.find(i => i.id === inviteId);
      
      if (!invite) {
        toast({
          title: "Invalid Invite",
          description: "The invite could not be found",
          variant: "destructive"
        });
        return null;
      }
      
      // Create a battle lobby
      const lobbyId = crypto.randomUUID();
      
      await d1Database.query(`
        INSERT INTO battle_lobbies (
          id,
          name,
          created_by,
          battle_type,
          max_players,
          is_public,
          status,
          created_at
        )
        VALUES (?, ?, ?, '1v1', 2, 0, 'waiting', CURRENT_TIMESTAMP)
      `, {
        params: [
          lobbyId,
          `${invite.from_username}'s Battle`,
          invite.from_user_id,
          
        ]
      });
      
      // Add the inviter to the lobby
      await d1Database.query(`
        INSERT INTO lobby_participants (
          id,
          lobby_id,
          user_id,
          player_number
        )
        VALUES (?, ?, ?, 1)
      `, {
        params: [
          crypto.randomUUID(),
          lobbyId,
          invite.from_user_id
        ]
      });
      
      // Add the invitee (current user) to the lobby
      await d1Database.query(`
        INSERT INTO lobby_participants (
          id,
          lobby_id,
          user_id,
          player_number
        )
        VALUES (?, ?, ?, 2)
      `, {
        params: [
          crypto.randomUUID(),
          lobbyId,
          user.id
        ]
      });
      
      // Update the invite status
      await d1Database.query(`
        UPDATE battle_invites
        SET status = 'accepted', lobby_id = ?
        WHERE id = ?
      `, {
        params: [lobbyId, inviteId]
      });
      
      // Refresh invites
      await loadInvites();
      
      toast({
        title: "Invite Accepted",
        description: "You've joined the battle lobby",
      });
      
      return lobbyId;
    } catch (err) {
      console.error('Error accepting battle invite:', err);
      
      toast({
        title: "Error",
        description: "Failed to accept invite",
        variant: "destructive"
      });
      
      return null;
    }
  }, [user, token, receivedInvites, loadInvites]);
  
  // Decline invite function
  const declineInvite = useCallback(async (inviteId: string): Promise<boolean> => {
    if (!user?.id || !token?.access_token) return false;
    
    try {
      // Find the invite
      const invite = receivedInvites.find(i => i.id === inviteId);
      
      if (!invite) {
        toast({
          title: "Invalid Invite",
          description: "The invite could not be found",
          variant: "destructive"
        });
        return false;
      }
      
      // Update the invite status
      await d1Database.query(`
        UPDATE battle_invites
        SET status = 'declined'
        WHERE id = ?
      `, {
        params: [inviteId]
      });
      
      // Refresh invites
      await loadInvites();
      
      toast({
        title: "Invite Declined",
        description: "You've declined the battle invite",
      });
      
      return true;
    } catch (err) {
      console.error('Error declining battle invite:', err);
      
      toast({
        title: "Error",
        description: "Failed to decline invite",
        variant: "destructive"
      });
      
      return false;
    }
  }, [user, token, receivedInvites, loadInvites]);
  
  // Cancel invite function
  const cancelInvite = useCallback(async (inviteId: string): Promise<boolean> => {
    if (!user?.id || !token?.access_token) return false;
    
    try {
      // Find the invite
      const invite = sentInvites.find(i => i.id === inviteId);
      
      if (!invite) {
        toast({
          title: "Invalid Invite",
          description: "The invite could not be found",
          variant: "destructive"
        });
        return false;
      }
      
      // Delete the invite
      await d1Database.query(`
        DELETE FROM battle_invites
        WHERE id = ?
      `, {
        params: [inviteId]
      });
      
      // Refresh invites
      await loadInvites();
      
      toast({
        title: "Invite Cancelled",
        description: "You've cancelled the battle invite",
      });
      
      return true;
    } catch (err) {
      console.error('Error cancelling battle invite:', err);
      
      toast({
        title: "Error",
        description: "Failed to cancel invite",
        variant: "destructive"
      });
      
      return false;
    }
  }, [user, token, sentInvites, loadInvites]);
  
  // Clean up expired invites
  useEffect(() => {
    const cleanupExpiredInvites = async () => {
      if (!user?.id || !token?.access_token) return;
      
      try {
        await d1Database.query(`
          UPDATE battle_invites
          SET status = 'expired'
          WHERE status = 'pending' AND expires_at < CURRENT_TIMESTAMP
        `);
        
        // We don't need to refresh invites here as we're just cleaning up
      } catch (err) {
        console.error('Error cleaning up expired invites:', err);
      }
    };
    
    // Run cleanup on mount
    cleanupExpiredInvites();
    
    // Set up interval to clean up expired invites
    const interval = setInterval(cleanupExpiredInvites, 60000); // Every minute
    
    return () => {
      clearInterval(interval);
    };
  }, [user, token]);
  
  return {
    sentInvites,
    receivedInvites,
    loading,
    error,
    sendInvite,
    acceptInvite,
    declineInvite,
    cancelInvite,
    refreshInvites: loadInvites
  };
};

export default useBattleInvites;
