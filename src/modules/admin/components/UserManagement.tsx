
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

// This component was imported but wasn't in the repository
// Creating a basic version that mirrors functionality from the UserManagement component
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
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*, auth_users:auth.users(email)');
      
      if (error) throw error;
      
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load user data",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchable = `${user.username} ${user.email}`.toLowerCase();
    return searchable.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">User Management</h3>
        <div className="flex gap-2">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
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
        <div className="text-center py-4">Loading users...</div>
      ) : (
        <div className="border rounded-md">
          <div className="grid grid-cols-[1fr_1fr_1fr_100px] gap-4 p-2 font-medium bg-muted border-b">
            <div>User</div>
            <div>Email</div>
            <div>Country</div>
            <div>Actions</div>
          </div>
          
          {filteredUsers.length > 0 ? (
            <div className="divide-y">
              {filteredUsers.map(user => (
                <div key={user.id} className="grid grid-cols-[1fr_1fr_1fr_100px] gap-4 p-2 items-center">
                  <div className="flex flex-col">
                    <span className="font-medium">{user.username}</span>
                    <span className="text-sm text-muted-foreground">
                      {user.name} {user.surname}
                    </span>
                  </div>
                  <div>{user.auth_users?.email}</div>
                  <div>{user.country || 'N/A'}</div>
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
