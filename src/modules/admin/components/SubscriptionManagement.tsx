import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { format, addMonths, addYears } from 'date-fns';

interface MusicSubscription {
  id: string;
  user_id: string;
  subscription_type: 'monthly' | 'yearly';
  start_date: string;
  end_date: string;
  created_at: string;
  user_info?: {
    username: string;
    email: string;
  };
}

const SubscriptionManagement = () => {
  const { isAdmin } = useAdmin();
  const [subscriptions, setSubscriptions] = useState<MusicSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<MusicSubscription | null>(null);
  const [users, setUsers] = useState<{id: string, username: string, name: string, surname: string, email: string}[]>([]);

  const [userId, setUserId] = useState('');
  const [subscriptionType, setSubscriptionType] = useState<'monthly' | 'yearly'>('monthly');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (isAdmin) {
      fetchSubscriptions();
      fetchUsers();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (startDate) {
      const start = new Date(startDate);
      const end = subscriptionType === 'monthly' 
        ? addMonths(start, 1) 
        : addYears(start, 1);
      setEndDate(format(end, 'yyyy-MM-dd'));
    }
  }, [startDate, subscriptionType]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('music_subscriptions')
        .select('*');

      if (subscriptionError) throw subscriptionError;

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username');

      if (profileError) throw profileError;
      
      const profileMap = new Map();
      for (const profile of profileData) {
        profileMap.set(profile.id, {
          username: profile.username || 'Unknown',
          email: 'Unknown'
        });
      }

      const combinedData = subscriptionData.map((subscription) => ({
        ...subscription,
        user_info: profileMap.get(subscription.user_id) || { username: 'Unknown', email: 'Unknown' }
      }));

      setSubscriptions(combinedData);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch subscription data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, name, surname');

      if (profilesError) throw profilesError;

      const { data: emailData, error: emailError } = await supabase
        .rpc('get_user_emails');

      if (emailError) throw emailError;

      const transformedUsers = profiles.map(profile => {
        const userEmail = emailData.find(e => e.id === profile.id);
        return {
          id: profile.id,
          username: profile.username,
          name: profile.name,
          surname: profile.surname,
          email: userEmail?.email || 'No email'
        };
      });

      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch user data.',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    if (!userId) {
      toast({
        title: 'Error',
        description: 'Please select a user.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const subscriptionData = {
        user_id: userId,
        subscription_type: subscriptionType,
        start_date: startDate,
        end_date: endDate,
      };

      let operation;
      if (isEditing && selectedSubscription) {
        operation = supabase
          .from('music_subscriptions')
          .update(subscriptionData)
          .eq('id', selectedSubscription.id);
      } else {
        operation = supabase
          .from('music_subscriptions')
          .insert(subscriptionData);
      }

      const { error } = await operation;
      if (error) throw error;

      await supabase
        .from('profiles')
        .update({ music_unlocked: true })
        .eq('id', userId);

      toast({
        title: 'Success',
        description: isEditing ? 'Subscription updated successfully.' : 'Subscription added successfully.',
      });
      
      setDialogOpen(false);
      resetForm();
      fetchSubscriptions();
    } catch (error) {
      console.error('Error saving subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to save subscription data.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (subscription: MusicSubscription) => {
    setSelectedSubscription(subscription);
    setUserId(subscription.user_id);
    setSubscriptionType(subscription.subscription_type);
    setStartDate(subscription.start_date);
    setEndDate(subscription.end_date);
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subscription?')) return;

    try {
      const { error } = await supabase
        .from('music_subscriptions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Subscription deleted successfully.',
      });
      
      fetchSubscriptions();
    } catch (error) {
      console.error('Error deleting subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete subscription.',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setUserId('');
    setSubscriptionType('monthly');
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setEndDate(format(addMonths(new Date(), 1), 'yyyy-MM-dd'));
    setSelectedSubscription(null);
    setIsEditing(false);
  };

  const handleAddNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  const isActive = (endDate: string) => {
    return new Date(endDate) >= new Date();
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Music Subscription Management</h3>
        <Button onClick={handleAddNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Subscription
        </Button>
      </div>
      
      {subscriptions.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User ID</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((subscription) => (
              <TableRow key={subscription.id}>
                <TableCell>{subscription.user_id}</TableCell>
                <TableCell>{subscription.user_info?.username}</TableCell>
                <TableCell className="capitalize">{subscription.subscription_type}</TableCell>
                <TableCell>{format(new Date(subscription.start_date), 'PPP')}</TableCell>
                <TableCell>{format(new Date(subscription.end_date), 'PPP')}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    isActive(subscription.end_date) 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {isActive(subscription.end_date) ? 'Active' : 'Expired'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(subscription)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(subscription.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center p-8 bg-muted rounded-md">
          <p>No subscription records found.</p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Subscription' : 'Add Subscription'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="user">User</Label>
              <Select value={userId} onValueChange={(value) => setUserId(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} {user.surname} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="subscription-type">Subscription Type</Label>
              <Select 
                value={subscriptionType} 
                onValueChange={(value: 'monthly' | 'yearly') => setSubscriptionType(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subscription type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Auto-calculated based on subscription type and start date
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionManagement;
