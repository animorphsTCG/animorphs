
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
import { Loader2, User, UserCheck, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

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
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
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
      setError(null);
      console.log("Fetching users data for admin panel...");
      
      // Get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        setError("Failed to fetch user profiles");
        throw profilesError;
      }

      // Get user emails
      const { data: usersData, error: usersError } = await supabase
        .rpc('get_user_emails');
        
      if (usersError) {
        console.error("Error fetching user emails:", usersError);
        setError("Failed to fetch user emails");
        throw usersError;
      }
      
      // Get payment statuses
      const { data: paymentData, error: paymentError } = await supabase
        .from('payment_status')
        .select('*');
        
      if (paymentError) {
        console.error("Error fetching payment statuses:", paymentError);
        setError("Failed to fetch payment data");
        throw paymentError;
      }
      
      // Get music subscriptions
      const { data: musicSubs, error: musicError } = await supabase
        .from('music_subscriptions')
        .select('*');
        
      if (musicError) {
        console.error("Error fetching music subscriptions:", musicError);
        setError("Failed to fetch music subscription data");
        throw musicError;
      }

      // Create lookup maps for faster joining
      const emailMap = new Map();
      usersData?.forEach(user => {
        emailMap.set(user.id, user.email);
      });
      
      const paymentMap = new Map();
      paymentData?.forEach(payment => {
        paymentMap.set(payment.id, payment.has_paid);
      });
      
      const musicSubMap = new Map();
      musicSubs?.forEach(sub => {
        musicSubMap.set(sub.user_id, sub);
      });

      // Combine data
      const combined = profiles?.map(profile => {
        const userEmail = emailMap.get(profile.id);
        const hasPaid = paymentMap.get(profile.id) || false;
        const musicSub = musicSubMap.get(profile.id);
        
        return {
          id: profile.id,
          username: profile.username || 'No username',
          name: profile.name || '',
          surname: profile.surname || '',
          email: userEmail,
          created_at: profile.created_at,
          has_paid: hasPaid,
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
      
      setError(null);
      console.log("Successfully loaded user data:", combined.length, "users");
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load user data. Please try again.");
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

  const filteredUsers = users.filter(user => {
    const searchable = `${user.username} ${user.email} ${user.name} ${user.surname}`.toLowerCase();
    return searchable.includes(searchTerm.toLowerCase());
  });

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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage user accounts and permissions</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-8"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUsers}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <p className="text-red-500">{error}</p>
              <Button onClick={fetchUsers}>Try Again</Button>
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
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
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
                        <TableCell>{user.email || 'No email'}</TableCell>
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
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.open(`/profile/${user.id}`, '_blank')}
                          >
                            <UserCheck className="h-4 w-4 mr-1" /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        No users found matching your search criteria
                      </TableCell>
                    </TableRow>
                  )}
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
