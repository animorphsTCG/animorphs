
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/modules/auth';
import { createChannel } from '@/lib/channel';
import { Check, X } from 'lucide-react';

interface Invite {
  id: string;
  from: {
    id: string;
    username: string;
  };
  battleType: '1v1' | '4player';
  timestamp: number;
}

export function BattleInvites() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [channel, setChannel] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  
  // Set up invite channel on mount
  useEffect(() => {
    if (!user) return;
    
    // Create channel for the user's invites
    const inviteChannel = createChannel(`invites:${user.id}`, user.id);
    setChannel(inviteChannel);
    
    // Subscribe to the channel
    const sub = inviteChannel.subscribe();
    setSubscription(sub);
    
    // Cleanup on unmount
    return () => {
      if (sub) {
        sub.unsubscribe();
      }
      
      if (inviteChannel) {
        inviteChannel.unsubscribe();
      }
    };
  }, [user]);
  
  // Handle receiving a battle invite
  const handleInviteReceived = (invite: Invite) => {
    setInvites(prev => [...prev, invite]);
    
    toast({
      title: 'Battle Invite',
      description: `${invite.from.username} has invited you to a ${invite.battleType} battle!`,
      duration: 10000,
    });
  };
  
  // Accept an invite
  const acceptInvite = async (invite: Invite) => {
    try {
      // Remove the invite from the list
      setInvites(prev => prev.filter(i => i.id !== invite.id));
      
      // Navigate to the battle room
      navigate(`/battle/multiplayer/${invite.id}`);
      
      toast({
        title: 'Battle Accepted',
        description: `You've joined ${invite.from.username}'s battle!`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to accept the invite.',
        variant: 'destructive',
      });
    }
  };
  
  // Decline an invite
  const declineInvite = (invite: Invite) => {
    setInvites(prev => prev.filter(i => i.id !== invite.id));
    
    toast({
      title: 'Battle Declined',
      description: `You've declined ${invite.from.username}'s battle invite.`,
    });
  };
  
  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  if (invites.length === 0) {
    return null;
  }
  
  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 bg-slate-900/90 backdrop-blur-sm border-fantasy-accent shadow-lg">
      <CardHeader className="py-3">
        <CardTitle className="text-lg flex items-center">
          Battle Invites
          <Badge variant="secondary" className="ml-2">
            {invites.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[200px] overflow-y-auto">
        {invites.map(invite => (
          <div 
            key={invite.id} 
            className="bg-slate-800/60 p-3 rounded-md flex flex-col"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">{invite.from.username}</span>
              <span className="text-xs opacity-70">{formatTime(invite.timestamp)}</span>
            </div>
            <div className="text-sm mb-2">
              Invites you to a {invite.battleType} battle
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => declineInvite(invite)}
                className="h-8 px-2 text-red-400 hover:text-red-500"
              >
                <X className="h-4 w-4 mr-1" /> Decline
              </Button>
              <Button 
                size="sm"
                onClick={() => acceptInvite(invite)}
                className="h-8 px-2 bg-green-700 hover:bg-green-600"
              >
                <Check className="h-4 w-4 mr-1" /> Accept
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
