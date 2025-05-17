
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { d1 } from '@/lib/d1Database';
import { toast } from '@/hooks/use-toast';
import { Loader2, Search, RefreshCw, UserCheck } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use D1 database instead of Supabase
      const profiles = await d1.from('profiles')
        .select('*')
        .orderBy('username', 'asc')
        .get();
      
      // Get user emails using a separate query - adapt from the previous Supabase RPC
      const usersData = await d1.from('users')
        .select('id, email')
        .get();
      
      // Create a lookup map for emails
      const emailMap = new Map();
      usersData?.forEach(user => {
        emailMap.set(user.id, user.email);
      });
      
      // Get payment statuses
      const paymentStatuses = await d1.from('payment_status')
        .select('*')
        .get();
      
      // Create lookup map for payment status
      const paymentMap = new Map();
      paymentStatuses?.forEach(payment => {
        paymentMap.set(payment.user_id || payment.id, payment);
      });
      
      // Get music subscriptions
      const musicSubs = await d1.from('music_subscriptions')
        .select('*')
        .get();
      
      // Create lookup map for music subscriptions
      const musicSubMap = new Map();
      musicSubs?.forEach(sub => {
        musicSubMap.set(sub.user_id, sub);
      });

      // Combine data
      const combined = profiles?.map(profile => {
        const userEmail = emailMap.get(profile.id);
        const paymentStatus = paymentMap.get(profile.id);
        const musicSub = musicSubMap.get(profile.id);
        
        return {
          id: profile.id,
          username: profile.username || 'No username',
          email: userEmail || 'No email',
          name: profile.name || '',
          surname: profile.surname || '',
          country: profile.country || 'N/A',
          created_at: profile.created_at,
          has_paid: paymentStatus?.has_paid || false,
          music_subscription: musicSub ? {
            subscription_type: musicSub.subscription_type,
            end_date: musicSub.end_date
          } : null
        };
      }) || [];

      setUsers(combined);
      setError(null);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load user data');
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
    const searchable = `${user.username} ${user.email} ${user.name} ${user.surname} ${user.country}`.toLowerCase();
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
              placeholder="Search by username, email, name, or country..."
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
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-sm text-muted-foreground">Loading users...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8 border rounded-md">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchUsers}>Try Again</Button>
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
                  <div className="text-sm">{user.email}</div>
                  <div>{user.country}</div>
                  <div>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant={user.has_paid ? "default" : "outline"}>
                        {user.has_paid ? 'Paid' : 'Free'}
                      </Badge>
                      {user.music_subscription && (
                        <Badge variant="secondary">Music</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => window.open(`/profile/${user.id}`, '_blank')}
                      className="flex items-center gap-1"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
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
