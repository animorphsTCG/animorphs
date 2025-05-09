
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, UserCheck, Users, Check, X, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/modules/auth";
import useOnlineUsers, { OnlineUser } from "@/hooks/useOnlineUsers";

interface InviteUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lobbyId: string;
  lobbyName: string;
  battleType: string;
  maxPlayers: number;
}

const InviteUserModal: React.FC<InviteUserModalProps> = ({ 
  open, 
  onOpenChange, 
  lobbyId, 
  lobbyName,
  battleType,
  maxPlayers
}) => {
  const { user } = useAuth();
  const { onlineUsers, loading, error, connectionStatus, refreshUsers } = useOnlineUsers(10000); // 10 second refresh
  const [paidUsers, setPaidUsers] = useState<OnlineUser[]>([]);
  const [sentInvites, setSentInvites] = useState<Record<string, boolean>>({});
  const [participantsCount, setParticipantsCount] = useState<number>(1); // Host is already in
  const [refreshingUsers, setRefreshingUsers] = useState(false);
  
  // Filter paid users only
  useEffect(() => {
    if (onlineUsers) {
      // Filter out current user and only include paid users
      const filteredUsers = onlineUsers.filter(
        onlineUser => onlineUser.has_paid && onlineUser.id !== user?.id
      );
      console.log("Filtered paid online users:", filteredUsers);
      setPaidUsers(filteredUsers);
    }
  }, [onlineUsers, user]);
  
  // Get current lobby participants count
  useEffect(() => {
    const fetchParticipants = async () => {
      if (!lobbyId) return;
      
      try {
        const { data, error } = await supabase
          .from('lobby_participants')
          .select('id')
          .eq('lobby_id', lobbyId);
          
        if (error) throw error;
        
        setParticipantsCount(data?.length || 1);
        console.log(`Lobby ${lobbyId} has ${data?.length || 0} participants`);
      } catch (err) {
        console.error("Error fetching participants:", err);
      }
    };
    
    fetchParticipants();
    
    // Listen for new participants
    const channel = supabase
      .channel(`lobby-${lobbyId}`)
      .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'lobby_participants', filter: `lobby_id=eq.${lobbyId}` }, 
          () => fetchParticipants())
      .on('postgres_changes', 
          { event: 'DELETE', schema: 'public', table: 'lobby_participants', filter: `lobby_id=eq.${lobbyId}` }, 
          () => fetchParticipants())
      .subscribe();
          
    return () => {
      supabase.removeChannel(channel);
    };
  }, [lobbyId]);
  
  const sendInvite = async (inviteeId: string) => {
    if (!user || !lobbyId) return;
    
    try {
      // Temporary UI update
      setSentInvites(prev => ({ ...prev, [inviteeId]: true }));
      
      const { error } = await supabase
        .from('battle_invites')
        .insert({
          lobby_id: lobbyId,
          invited_by: user.id,
          user_id: inviteeId,
          lobby_name: lobbyName,
          battle_type: battleType
        });
        
      if (error) throw error;
      
      toast({
        title: "Invite Sent",
        description: "Player has been invited to your lobby"
      });
    } catch (err) {
      console.error("Error sending invite:", err);
      toast({
        title: "Failed to Send Invite",
        description: "There was an error sending the invite",
        variant: "destructive"
      });
      
      // Revert UI state
      setSentInvites(prev => ({ ...prev, [inviteeId]: false }));
    }
  };
  
  const manualRefresh = async () => {
    setRefreshingUsers(true);
    
    try {
      // Force update presence for current user
      if (user) {
        await supabase
          .from('user_presence')
          .upsert({
            user_id: user.id,
            last_seen: new Date().toISOString(),
            status: 'online'
          }, { onConflict: 'user_id' });
      }
      
      // Refresh the online users list
      refreshUsers();
      
    } catch (err) {
      console.error("Error refreshing user presence:", err);
    } finally {
      // Give a bit of time for visual feedback
      setTimeout(() => {
        setRefreshingUsers(false);
      }, 500);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-fantasy text-fantasy-accent">Invite Players</DialogTitle>
          <DialogDescription>
            {participantsCount}/{maxPlayers} players in lobby
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' :
                connectionStatus === 'connecting' ? 'bg-yellow-500' :
                'bg-red-500'
              }`}></div>
              <p className="text-sm text-muted-foreground">
                {paidUsers.length === 0 ? "No paid users online" : `${paidUsers.length} paid ${paidUsers.length === 1 ? 'user' : 'users'} online`}
              </p>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={manualRefresh} 
              disabled={refreshingUsers}
            >
              {refreshingUsers ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-1">Refresh</span>
            </Button>
          </div>
          
          {loading || refreshingUsers ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-fantasy-accent" />
            </div>
          ) : paidUsers.length > 0 ? (
            <div className="divide-y">
              {paidUsers.map((onlineUser) => (
                <div key={onlineUser.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      {onlineUser.profile_image_url ? (
                        <AvatarImage src={onlineUser.profile_image_url} />
                      ) : (
                        <AvatarFallback>{onlineUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-medium">{onlineUser.username}</p>
                      <p className="text-xs text-green-500">Online</p>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => sendInvite(onlineUser.id)}
                    disabled={sentInvites[onlineUser.id] || participantsCount >= maxPlayers}
                  >
                    {sentInvites[onlineUser.id] ? (
                      <>
                        <Check className="mr-1 h-4 w-4" />
                        Invited
                      </>
                    ) : participantsCount >= maxPlayers ? (
                      "Lobby Full"
                    ) : (
                      "Invite"
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-muted-foreground">
              <Users className="mx-auto h-12 w-12 opacity-30 mb-2" />
              <p>No other paid users are online right now</p>
              <p className="text-sm mt-2">Make sure your friends login with paid accounts to play together</p>
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md">
              <p className="text-sm text-red-500">Error: {error}</p>
            </div>
          )}
          
          <div className="pt-4 flex justify-end">
            <Button 
              variant="secondary" 
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteUserModal;
