
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
import { UserProfile } from "@/types";

const UserManagement = () => {
  const { isAdmin } = useAdmin();
  const [users, setUsers] = useState<(UserProfile & {email?: string})[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    paidUsers: 0,
    musicSubscribers: 0
  });
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    hasPaid: false,
    musicUnlocked: false,
    isAdmin: false
  });

  useEffect(() => {
    if (!isAdmin) return;
    fetchUsers();
  }, [isAdmin]);

  const fetchUsers = async () => {
    if (!isAdmin) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Use the admin edge function to fetch user data
      const { data: adminData, error: adminError } = await supabase.functions.invoke('admin-dashboard', {
        body: { action: 'fetch_users' }
      });
      
      if (adminError) {
        console.error("Admin function error:", adminError);
        setError("Failed to call admin function");
        throw adminError;
      }

      if (adminData?.error) {
        console.error("Users fetch error:", adminData.error);
        setError(`Error: ${adminData.error}`);
        throw new Error(adminData.error);
      }
      
      if (adminData?.data) {
        setUsers(adminData.data);
        
        // Update statistics
        setStats({
          totalUsers: adminData.data.length,
          paidUsers: adminData.data.filter((user: any) => user.has_paid).length || 0,
          musicSubscribers: adminData.data.filter((profile: any) => profile.music_unlocked).length || 0
        });
      } else {
        setError("No user data returned");
      }
      
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.message || "Failed to load user data");
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
        hasPaid: user.has_paid || false,
        musicUnlocked: user.music_unlocked,
        isAdmin: user.is_admin || false
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
        
      // Update profile status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          music_unlocked: editData.musicUnlocked,
          is_admin: editData.isAdmin
        })
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
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={fetchUsers}>Try Again</Button>
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
                  <TableHead>Admin</TableHead>
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
                        {user.has_paid ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <X className="h-5 w-5 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        {user.music_unlocked ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <X className="h-5 w-5 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        {user.is_admin ? (
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
                    <TableCell colSpan={7} className="text-center py-8">
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
            <div className="flex items-center justify-between">
              <Label htmlFor="is-admin">Admin Access</Label>
              <Switch
                id="is-admin"
                checked={editData.isAdmin}
                onCheckedChange={(checked) => setEditData(prev => ({ ...prev, isAdmin: checked }))}
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
