
import React, { useState, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/modules/auth";
import { useNavigate } from "react-router-dom";
import { Mail, Loader2, Check, X } from "lucide-react";

interface BattleInvite {
  id: string;
  lobby_id: string;
  lobby_name: string;
  battle_type: string;
  invited_by: string;
  created_at: string;
  inviter_username?: string;
}

export const BattleInvites = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invites, setInvites] = useState<BattleInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [responding, setResponding] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    if (!user) return;
    
    const fetchInvites = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('battle_invites')
          .select(`
            *,
            profiles:invited_by (username)
          `)
          .eq('user_id', user.id)
          .eq('is_accepted', false)
          .eq('is_rejected', false);
          
        if (error) throw error;
        
        const formattedInvites = data.map(invite => ({
          ...invite,
          inviter_username: invite.profiles?.username
        }));
        
        setInvites(formattedInvites);
      } catch (err) {
        console.error("Error fetching invites:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInvites();
    
    // Subscribe to changes in invites
    const channel = supabase
      .channel('battle-invites')
      .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'battle_invites', filter: `user_id=eq.${user.id}` }, 
          () => {
            fetchInvites();
            toast({
              title: "New Battle Invite",
              description: "You've received a battle invitation",
            });
          })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  const handleInviteResponse = async (inviteId: string, lobbyId: string, accept: boolean) => {
    if (!user) return;
    
    try {
      setResponding(prev => ({ ...prev, [inviteId]: true }));
      
      // Update invite status
      await supabase
        .from('battle_invites')
        .update({
          is_accepted: accept,
          is_rejected: !accept,
          responded_at: new Date().toISOString()
        })
        .eq('id', inviteId);
      
      if (accept) {
        // Check if lobby still exists and has space
        const { data: lobby, error: lobbyError } = await supabase
          .from('battle_lobbies')
          .select('*')
          .eq('id', lobbyId)
          .single();
          
        if (lobbyError || !lobby) {
          toast({
            title: "Lobby Not Available",
            description: "The battle lobby is no longer available",
            variant: "destructive"
          });
          return;
        }
        
        // Check participant count
        const { data: participants, error: participantsError } = await supabase
          .from('lobby_participants')
          .select('*')
          .eq('lobby_id', lobbyId);
          
        if (participantsError) throw participantsError;
        
        if (participants && participants.length >= lobby.max_players) {
          toast({
            title: "Lobby Full",
            description: "The battle lobby is already full",
            variant: "destructive"
          });
          return;
        }
        
        // Join the lobby
        const { error: joinError } = await supabase
          .from('lobby_participants')
          .insert({
            lobby_id: lobbyId,
            user_id: user.id,
            player_number: participants ? participants.length + 1 : 1
          });
          
        if (joinError) throw joinError;
        
        // Close the popover
        setOpen(false);
        
        // Redirect to the right battle page
        let route = "";
        switch (lobby.battle_type) {
          case "1v1":
            route = `/battle/multiplayer/${lobbyId}`;
            break;
          case "3player":
            route = `/3-player-battle/${lobbyId}`;
            break;
          case "4player":
            route = `/4-player-user-lobby/${lobbyId}`;
            break;
        }
        
        navigate(route);
      } else {
        // Remove from invites list
        setInvites(prev => prev.filter(invite => invite.id !== inviteId));
        
        toast({
          title: "Invite Declined",
          description: "You've declined the battle invitation"
        });
      }
    } catch (error) {
      console.error("Error responding to invite:", error);
      toast({
        title: "Error",
        description: "Failed to respond to battle invitation",
        variant: "destructive"
      });
    } finally {
      setResponding(prev => ({ ...prev, [inviteId]: false }));
    }
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Mail className="h-5 w-5" />
          {invites.length > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">
              {invites.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-2">
          <h3 className="font-medium">Battle Invitations</h3>
          
          {loading ? (
            <div className="py-4 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : invites.length > 0 ? (
            <div className="divide-y">
              {invites.map(invite => (
                <div key={invite.id} className="py-3 space-y-2">
                  <div>
                    <p className="font-medium">{invite.lobby_name}</p>
                    <p className="text-sm text-muted-foreground">
                      From: {invite.inviter_username || "Unknown"} • {formatBattleType(invite.battle_type)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleInviteResponse(invite.id, invite.lobby_id, true)}
                      disabled={!!responding[invite.id]}
                    >
                      {responding[invite.id] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-1" />
                      )}
                      Accept
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleInviteResponse(invite.id, invite.lobby_id, false)}
                      disabled={!!responding[invite.id]}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No pending battle invitations
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Helper function to format battle type
function formatBattleType(type: string): string {
  switch (type) {
    case "1v1":
      return "1v1 Battle";
    case "3player":
      return "3-Player Tournament";
    case "4player":
      return "4-Player Battle";
    default:
      return type;
  }
}

export default BattleInvites;
