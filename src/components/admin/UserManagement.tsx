
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Loader2, User, UserCheck } from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  name: string;
  surname: string;
  email?: string;
  created_at: string;
  has_paid: boolean;
  music_subscription?: {
    subscription_type: string;
    end_date: string;
  };
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    free: 0,
    musicSubscribers: 0,
  });

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
          payment_status:payment_status(has_paid)
        `)
        .order('created_at', { ascending: false });
        
      if (profilesError) throw profilesError;

      // Get user emails
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
          name: profile.name || '',
          surname: profile.surname || '',
          email: userEmail?.email,
          created_at: profile.created_at,
          has_paid: profile.payment_status?.has_paid || false,
          music_subscription: musicSub ? {
            subscription_type: musicSub.subscription_type,
            end_date: musicSub.end_date
          } : undefined
        };
      }) || [];

      setUsers(combined);
      
      // Calculate stats
      const totalUsers = combined.length;
      const paidUsers = combined.filter(user => user.has_paid).length;
      const musicSubscribers = combined.filter(user => user.music_subscription).length;
      
      setStats({
        total: totalUsers,
        paid: paidUsers,
        free: totalUsers - paidUsers,
        musicSubscribers
      });
      
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePaymentStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('payment_status')
        .update({ has_paid: !currentStatus })
        .eq('id', userId);
        
      if (error) throw error;
      
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, has_paid: !currentStatus } 
          : user
      ));
      
      toast({
        title: "Success",
        description: `Payment status updated for user`
      });
      
      // Update stats
      const newPaidCount = currentStatus 
        ? stats.paid - 1 
        : stats.paid + 1;
        
      setStats({
        ...stats,
        paid: newPaidCount,
        free: stats.total - newPaidCount
      });
      
    } catch (error) {
      console.error("Error toggling payment status:", error);
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paid}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Free Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.free}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Music Subscribers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.musicSubscribers}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Paid Status</TableHead>
                    <TableHead>Music Subscription</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">{user.name} {user.surname}</p>
                            <p className="text-xs text-muted-foreground">{user.username}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={user.has_paid}
                            onCheckedChange={() => togglePaymentStatus(user.id, user.has_paid)}
                          />
                          <Badge variant={user.has_paid ? "default" : "outline"}>
                            {user.has_paid ? "Paid" : "Free"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.music_subscription ? (
                          <div>
                            <Badge variant="secondary">{user.music_subscription.subscription_type}</Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              Expires: {new Date(user.music_subscription.end_date).toLocaleDateString()}
                            </p>
                          </div>
                        ) : (
                          <Badge variant="outline">None</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <UserCheck className="h-4 w-4 mr-1" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
