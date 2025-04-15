
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { UserProfile } from "@/types/admin";
import { calculateUserStats } from "./utils/userStats";
import { UserStatsCard } from "./components/UserStatsCard";
import { UserTable } from "./components/UserTable";
import { EditUserDialog } from "./components/EditUserDialog";

const UserManagement = () => {
  const { isAdmin } = useAdmin();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    hasPaid: false,
    musicUnlocked: false
  });

  useEffect(() => {
    if (!isAdmin) return;

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
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      const { data: emailsData, error: emailsError } = await supabase
        .rpc('get_user_emails');

      if (emailsError) throw emailsError;

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
        hasPaid: false,
        musicUnlocked: user.music_unlocked
      });
      
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
      const { error: paymentError } = await supabase
        .from('payment_status')
        .upsert({
          id: selectedUser,
          has_paid: editData.hasPaid,
          payment_date: editData.hasPaid ? new Date().toISOString() : null,
          payment_method: editData.hasPaid ? 'admin_override' : null
        });
        
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
      
      fetchUsers();
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

  const stats = calculateUserStats(users);

  return (
    <div className="space-y-6">
      <UserStatsCard stats={stats} />
      
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <UserTable 
            users={users}
            onEditUser={handleEditUser}
            loading={loading}
          />
        </CardContent>
      </Card>

      <EditUserDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editData={editData}
        onEditDataChange={setEditData}
        onSave={handleSaveChanges}
      />
    </div>
  );
};

export default UserManagement;
