
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Search } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get profiles with payment status joined
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          *,
          payment_status(has_paid)
        `);
        
      if (profilesError) throw profilesError;

      // Get user emails using the admin function
      const { data: usersData, error: usersError } = await supabase
        .rpc('get_user_emails');
        
      if (usersError) throw usersError;
      
      // Get music subscriptions
      const { data: musicSubs, error: musicError } = await supabase
        .from('music_subscriptions')
        .select('*');
        
      if (musicError) throw musicError;

      // Combine data
      const combined = profiles?.map(profile => {
        const userEmail = usersData?.find(u => u.id === profile.id);
        const musicSub = musicSubs?.find(sub => sub.user_id === profile.id);
        
        return {
          id: profile.id,
          username: profile.username || 'No username',
          email: userEmail?.email,
          name: profile.name || '',
          surname: profile.surname || '',
          country: profile.country || 'N/A',
          created_at: profile.created_at,
          has_paid: profile.payment_status?.has_paid || false,
          music_subscription: musicSub ? {
            subscription_type: musicSub.subscription_type,
            end_date: musicSub.end_date
          } : null
        };
      }) || [];

      setUsers(combined);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load user data"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchable = `${user.username} ${user.email} ${user.name} ${user.surname}`.toLowerCase();
    return searchable.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">User Management</h3>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username, email, or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs pl-8"
            />
          </div>
          <Button 
            variant="outline" 
            onClick={fetchUsers}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-sm text-muted-foreground">Loading users...</p>
        </div>
      ) : (
        <div className="border rounded-md">
          <div className="grid grid-cols-[1fr_1.5fr_1fr_1fr_100px] gap-4 p-2 font-medium bg-muted border-b">
            <div>Username</div>
            <div>Email</div>
            <div>Location</div>
            <div>Status</div>
            <div>Actions</div>
          </div>
          {filteredUsers.length > 0 ? (
            <div className="divide-y">
              {filteredUsers.map(user => (
                <div key={user.id} className="grid grid-cols-[1fr_1.5fr_1fr_1fr_100px] gap-4 p-2 items-center">
                  <div className="font-medium">{user.username}</div>
                  <div className="text-sm">{user.email || 'No email'}</div>
                  <div>{user.country}</div>
                  <div>
                    <div className="flex gap-2">
                      <Badge variant={user.has_paid ? "default" : "outline"}>
                        {user.has_paid ? 'Paid' : 'Free'}
                      </Badge>
                      {user.music_subscription && (
                        <Badge variant="secondary">Music</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              No users found matching your search criteria
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserManagement;
