
import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAdminStatus } from '../hooks/useAdmin';
import { Pencil, Trash, Plus, Loader2 } from "lucide-react";
import { UserProfile } from '@/types';

interface MusicSubscription {
  id: string;
  user_id: string;
  subscription_type: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
  profiles?: {
    username: string;
    email?: string;
  };
}

const SubscriptionManagement = () => {
  const { adminToken } = useAdminStatus();
  const [subscriptions, setSubscriptions] = useState<MusicSubscription[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  const [selectedSubscription, setSelectedSubscription] = useState<MusicSubscription | null>(null);
  
  // Form state
  const [userId, setUserId] = useState<string>("");
  const [subscriptionType, setSubscriptionType] = useState("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchSubscriptions();
    fetchUsers();
  }, []);
  
  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('music_subscriptions')
        .select(`
          id,
          user_id,
          subscription_type,
          start_date,
          end_date,
          created_at,
          profiles (
            username,
            email
          )
        `);

      if (error) {
        throw error;
      }

      setSubscriptions(data as MusicSubscription[]);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch subscription data"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          email
        `);

      if (error) {
        throw error;
      }

      setUsers(data as UserProfile[]);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const resetForm = () => {
    setUserId("");
    setSubscriptionType("annual");
    
    // Set start date to today
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    
    // Set end date to one year from today
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    setEndDate(oneYearFromNow.toISOString().split('T')[0]);
    
    setSelectedSubscription(null);
    setIsEditing(false);
  };

  const handleOpenDialog = (subscription?: MusicSubscription) => {
    if (subscription) {
      setIsEditing(true);
      setSelectedSubscription(subscription);
      setUserId(subscription.user_id);
      setSubscriptionType(subscription.subscription_type);
      setStartDate(new Date(subscription.start_date).toISOString().split('T')[0]);
      setEndDate(subscription.end_date ? new Date(subscription.end_date).toISOString().split('T')[0] : "");
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId || !startDate || !endDate) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out all required fields"
      });
      return;
    }
    
    try {
      const subscriptionData = {
        id: isEditing ? selectedSubscription?.id : undefined,
        user_id: userId,
        subscription_type: subscriptionType,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
      };
      
      if (isEditing && selectedSubscription) {
        // Update existing subscription
        const { error } = await supabase
          .from('music_subscriptions')
          .update(subscriptionData)
          .eq('id', selectedSubscription.id);
          
        if (error) throw error;
      } else {
        // Create new subscription
        const { error } = await supabase
          .from('music_subscriptions')
          .insert(subscriptionData);
          
        if (error) throw error;
      }
      
      // Update music_unlocked in the profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ music_unlocked: true })
        .eq('id', userId);
        
      if (profileError) {
        console.error("Failed to update profile music unlock status:", profileError);
      }
      
      toast({
        title: "Success",
        description: isEditing 
          ? "Subscription updated successfully" 
          : "Subscription created successfully"
      });
      
      setDialogOpen(false);
      resetForm();
      fetchSubscriptions();
    } catch (error) {
      console.error("Error saving subscription:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save subscription"
      });
    }
  };

  const handleDelete = async (subscriptionId: string) => {
    try {
      const { error } = await supabase
        .from('music_subscriptions')
        .delete()
        .eq('id', subscriptionId);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Subscription deleted successfully"
      });
      
      setDeleteConfirmOpen(false);
      fetchSubscriptions();
    } catch (error) {
      console.error("Error deleting subscription:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete subscription"
      });
    }
  };

  // Check if a subscription is active
  const isSubscriptionActive = (endDate: string | null) => {
    if (!endDate) return false;
    return new Date(endDate) >= new Date();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Subscription Management</h3>
        <Button 
          onClick={() => handleOpenDialog()}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add Subscription
        </Button>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Subscription Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.length > 0 ? (
                subscriptions.map((subscription) => {
                  const isActive = isSubscriptionActive(subscription.end_date);
                  return (
                    <TableRow key={subscription.id}>
                      <TableCell className="font-medium">
                        {subscription.profiles?.username || "Unknown"}
                      </TableCell>
                      <TableCell className="capitalize">
                        {subscription.subscription_type}
                      </TableCell>
                      <TableCell>
                        {new Date(subscription.start_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {subscription.end_date 
                          ? new Date(subscription.end_date).toLocaleDateString() 
                          : "No end date"}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isActive 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {isActive ? "Active" : "Expired"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleOpenDialog(subscription)}
                          className="h-8 w-8 p-0 mr-2"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setSelectedSubscription(subscription);
                            setDeleteConfirmOpen(true);
                          }}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No subscriptions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Add/Edit Subscription Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Subscription" : "Add New Subscription"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user">User</Label>
              <Select 
                value={userId}
                onValueChange={setUserId}
                disabled={isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.username} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subscription-type">Subscription Type</Label>
              <Select 
                value={subscriptionType}
                onValueChange={setSubscriptionType}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annual (R24 ZAR)</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="lifetime">Lifetime</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {isEditing ? "Update" : "Add"} Subscription
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this subscription? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedSubscription && handleDelete(selectedSubscription.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionManagement;
