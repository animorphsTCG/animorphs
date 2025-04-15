import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface UserProfile {
  id: string;
  username: string;
  email?: string;
  name: string;
  surname: string;
  age: number;
  gender: string | null;
  country: string | null;
  music_unlocked: boolean;
  created_at: string;
}

const UserManagement = () => {
  const { isAdmin } = useAdmin();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    paidUsers: 0,
    musicSubscribers: 0
  });
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    hasPaid: false,
    musicUnlocked: false
  });

  useEffect(() => {
    if (!isAdmin) return;

    // Set up realtime subscription for profiles
    const channel = supabase
      .channel('profiles_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles' 
        }, 
        () => {
          fetchUsers();
        }
      )
      .subscribe();

    fetchUsers();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  const fetchUsers = async () => {
    if (!isAdmin) return;
    
    try {
      setLoading(true);
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Fetch user emails using the secure function
      const { data: emailsData, error: emailsError } = await supabase
        .rpc('get_user_emails');

      if (emailsError) throw emailsError;

      // Merge the data
      const emailMap = new Map(emailsData.map((user: any) => [user.id, user.email]));
      const mergedUsers = profiles.map((profile: any) => ({
        ...profile,
        email: emailMap.get(profile.id) || 'Not available'
      }));

      setUsers(mergedUsers);
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

  const handleEditUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(userId);
      setEditData({
        hasPaid: false, // We'll fetch the actual value
        musicUnlocked: user.music_unlocked
      });
      
      // Get payment status
      supabase
        .from('payment_status')
        .select('has_paid')
        .eq('id', userId)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            setEditData(prev => ({ ...prev, hasPaid: data.has_paid }));
          }
        });
      
      setIsEditDialogOpen(true);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedUser) return;
    
    try {
      // Update payment status
      const { error: paymentError } = await supabase
        .from('payment_status')
        .upsert({
          id: selectedUser,
          has_paid: editData.hasPaid,
          payment_date: editData.hasPaid ? new Date().toISOString() : null,
          payment_method: editData.hasPaid ? 'admin_override' : null
        });
        
      // Update music_unlocked status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ music_unlocked: editData.musicUnlocked })
        .eq('id', selectedUser);
        
      if (paymentError || profileError) {
        throw new Error("Failed to update user settings");
      }
      
      toast({
        title: "Success",
        description: "User settings updated successfully."
      });
      
      fetchUsers(); // Refresh the data
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user settings."
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-2xl font-bold">{stats.paidUsers}</div>
              <div className="text-sm text-muted-foreground">Paid Users</div>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-2xl font-bold">{stats.musicSubscribers}</div>
              <div className="text-sm text-muted-foreground">Music Subscribers</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Has Paid</TableHead>
                  <TableHead>Music Unlocked</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.name} {user.surname}</TableCell>
                      <TableCell>
                        {/* We don't have the actual payment status here, we'll show a placeholder */}
                        <span className="flex items-center">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Loading...
                        </span>
                      </TableCell>
                      <TableCell>
                        {user.music_unlocked ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <X className="h-5 w-5 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditUser(user.id)}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="has-paid">Game Access (Paid Status)</Label>
              <Switch
                id="has-paid"
                checked={editData.hasPaid}
                onCheckedChange={(checked) => setEditData(prev => ({ ...prev, hasPaid: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="music-unlocked">Music Unlocked</Label>
              <Switch
                id="music-unlocked"
                checked={editData.musicUnlocked}
                onCheckedChange={(checked) => setEditData(prev => ({ ...prev, musicUnlocked: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveChanges}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
