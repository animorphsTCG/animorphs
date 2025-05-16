
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Search, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/modules/auth';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface InviteUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lobbyId: string;
  lobbyName: string;
  battleType: '1v1' | '3player' | '4player';
  maxPlayers: number;
}

export default function InviteUserModal({
  open,
  onOpenChange,
  lobbyId,
  lobbyName,
  battleType,
  maxPlayers
}: InviteUserModalProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [sentInvites, setSentInvites] = useState<string[]>([]);
  const [invitedUsers, setInvitedUsers] = useState<any[]>([]);
  const realtimeChannelRef = useRef<any>(null);

  useEffect(() => {
    if (open && lobbyId) {
      fetchInvitedUsers();
      setupRealtimeListener();
    }

    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, [open, lobbyId]);

  const fetchInvitedUsers = async () => {
    if (!lobbyId) return;

    try {
      const { data, error } = await supabase
        .from('battle_invites')
        .select('*, profiles:user_id(username, profile_image_url)')
        .eq('lobby_id', lobbyId);
      
      if (error) throw error;
      
      if (data) {
        setInvitedUsers(data);
        setSentInvites(data.map(invite => invite.user_id));
      }
    } catch (error) {
      console.error('Error fetching invited users:', error);
    }
  };

  const setupRealtimeListener = () => {
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }

    const channel = supabase.channel(`lobby_invites:${lobbyId}`);
    
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Subscribed to battle invites updates');
      }
    });

    realtimeChannelRef.current = channel;
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, profile_image_url')
        .ilike('username', `%${searchQuery}%`)
        .limit(5);

      if (error) throw error;
      
      if (data) {
        // Filter out current user and already invited users
        const filteredResults = data.filter(
          (profile) => 
            profile.id !== user?.id && 
            !sentInvites.includes(profile.id)
        );
        setSearchResults(filteredResults);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        variant: 'destructive',
        title: 'Search failed',
        description: 'Failed to search for users'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const inviteUser = async (userId: string, username: string) => {
    if (!lobbyId || !user) return;

    try {
      const { error } = await supabase
        .from('battle_invites')
        .insert({
          user_id: userId,
          lobby_id: lobbyId,
          invited_by: user.id,
          lobby_name: lobbyName,
          battle_type: battleType
        });

      if (error) throw error;

      // Update local state
      setSentInvites([...sentInvites, userId]);
      toast({
        title: 'Invite sent',
        description: `Invite sent to ${username}`
      });

      // Refresh the invited users list
      fetchInvitedUsers();
    } catch (error) {
      console.error('Error sending invite:', error);
      toast({
        variant: 'destructive',
        title: 'Invite failed',
        description: 'Failed to send battle invite'
      });
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchUsers();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Players</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search for players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyPress}
            />
            <Button onClick={searchUsers} disabled={isSearching}>
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="border rounded-md p-2">
              <h3 className="text-sm font-medium mb-2">Search Results</h3>
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <div key={result.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        {result.profile_image_url ? (
                          <AvatarImage src={result.profile_image_url} />
                        ) : (
                          <AvatarFallback>{result.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                        )}
                      </Avatar>
                      <span>{result.username}</span>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => inviteUser(result.id, result.username)}
                      disabled={sentInvites.includes(result.id)}
                    >
                      {sentInvites.includes(result.id) ? 'Invited' : 'Invite'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          <div>
            <h3 className="text-sm font-medium mb-2">Invited Players ({invitedUsers.length}/{maxPlayers - 1})</h3>
            {invitedUsers.length > 0 ? (
              <div className="space-y-2">
                {invitedUsers.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        {invite.profiles?.profile_image_url ? (
                          <AvatarImage src={invite.profiles?.profile_image_url} />
                        ) : (
                          <AvatarFallback>
                            {(invite.profiles?.username || 'U').substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <div>{invite.profiles?.username || 'Unknown User'}</div>
                        <div className="text-xs text-muted-foreground">
                          {invite.is_accepted ? 
                            'Accepted' : invite.is_rejected ? 
                            'Declined' : 'Pending'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground p-2">
                No players invited yet
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Continue to Battle
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
