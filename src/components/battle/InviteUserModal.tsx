
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Users, Loader2, Send, Check } from 'lucide-react';
import { useAuth } from '@/modules/auth';
import { toast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { d1Worker } from '@/lib/cloudflare/d1Worker';

interface User {
  id: string;
  username: string;
  name?: string;
  surname?: string;
  email?: string;
}

interface InviteUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lobbyId: string;
  lobbyName: string;
  battleType: string;
}

const InviteUserModal = ({ open, onOpenChange, lobbyId, lobbyName, battleType }: InviteUserModalProps) => {
  const { user: currentUser, token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [invitedUsers, setInvitedUsers] = useState<string[]>([]);
  const [sendingInvite, setSendingInvite] = useState<string | null>(null);

  useEffect(() => {
    // Reset search when modal opens
    if (open) {
      setSearchQuery('');
      setUsers([]);
      setInvitedUsers([]);
    }
  }, [open]);

  const handleSearch = async () => {
    if (!searchQuery || !token?.access_token) return;
    
    try {
      setIsSearching(true);
      
      // Query D1 for users
      const results = await d1Worker.query(
        `SELECT id, username, name, surname, email 
         FROM profiles 
         WHERE username LIKE ? OR email LIKE ? OR name LIKE ?
         LIMIT 10`,
        { 
          params: [
            `%${searchQuery}%`, 
            `%${searchQuery}%`,
            `%${searchQuery}%`
          ] 
        },
        token.access_token
      );

      // Process results and ensure they match the User interface
      const typedResults: User[] = results.map((user: any) => ({
        id: user.id || '',
        username: user.username || '',
        name: user.name,
        surname: user.surname,
        email: user.email
      }));

      // Filter out current user
      setUsers(typedResults.filter(u => u.id !== currentUser?.id));
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to search users',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const sendInvite = async (invitedUserId: string) => {
    if (!currentUser || !token?.access_token) return;
    
    try {
      setSendingInvite(invitedUserId);

      // Add invite to D1
      const inviteId = crypto.randomUUID();
      await d1Worker.insert(
        'battle_invites',
        {
          id: inviteId,
          user_id: invitedUserId,
          lobby_id: lobbyId,
          invited_by: currentUser.id,
          battle_type: battleType,
          lobby_name: lobbyName,
          is_accepted: false,
          is_rejected: false,
          created_at: new Date().toISOString(),
          responded_at: null
        },
        token.access_token
      );
      
      // Mark as invited
      setInvitedUsers([...invitedUsers, invitedUserId]);
      
      toast({
        title: 'Invite Sent',
        description: 'Battle invitation has been sent!',
      });
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to send invite',
        variant: 'destructive',
      });
    } finally {
      setSendingInvite(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Users to Battle</DialogTitle>
          <DialogDescription>
            Search for users to invite to your battle lobby.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search by username or email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button variant="secondary" size="icon" onClick={handleSearch} disabled={isSearching}>
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="space-y-2 max-h-[240px] overflow-y-auto">
            {users.length > 0 ? (
              users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-accent/50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {user.username ? user.username.substring(0, 2).toUpperCase() : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.username}</p>
                      {user.email && (
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      )}
                    </div>
                  </div>
                  {invitedUsers.includes(user.id) ? (
                    <Button variant="ghost" size="sm" disabled>
                      <Check className="h-4 w-4 mr-2" /> Invited
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendInvite(user.id)}
                      disabled={sendingInvite === user.id}
                    >
                      {sendingInvite === user.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" /> Invite
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ))
            ) : searchQuery ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Users className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No users found</p>
                <p className="text-xs text-muted-foreground">Try a different search term</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Search className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Search for users to invite</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InviteUserModal;
