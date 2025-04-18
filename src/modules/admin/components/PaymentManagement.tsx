
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAdminStatus } from '../hooks/useAdmin';
import { Pencil, Trash, Plus, Loader2 } from "lucide-react";
import { UserProfile, PaymentStatus } from '@/types';

type PaymentWithUser = PaymentStatus & {
  profiles: Pick<UserProfile, 'username' | 'email'>;
};

const PaymentManagement = () => {
  const { adminToken } = useAdminStatus();
  const [payments, setPayments] = useState<PaymentWithUser[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithUser | null>(null);
  
  // Form state
  const [userId, setUserId] = useState<string>("");
  const [hasPaid, setHasPaid] = useState(false);
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [transactionId, setTransactionId] = useState("");

  useEffect(() => {
    fetchPayments();
    fetchUsers();
  }, []);
  
  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payment_status')
        .select(`
          id, 
          has_paid, 
          payment_date, 
          payment_method, 
          transaction_id,
          created_at,
          updated_at,
          profiles (
            username, 
            email
          )
        `);

      if (error) {
        throw error;
      }

      setPayments(data as PaymentWithUser[]);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch payment data"
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
    setHasPaid(false);
    setPaymentDate("");
    setPaymentMethod("");
    setTransactionId("");
    setSelectedPayment(null);
    setIsEditing(false);
  };

  const handleOpenDialog = (payment?: PaymentWithUser) => {
    if (payment) {
      setIsEditing(true);
      setSelectedPayment(payment);
      setUserId(payment.id);
      setHasPaid(payment.has_paid);
      setPaymentDate(payment.payment_date ? new Date(payment.payment_date).toISOString().split('T')[0] : "");
      setPaymentMethod(payment.payment_method || "");
      setTransactionId(payment.transaction_id || "");
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const paymentData = {
        id: userId,
        has_paid: hasPaid,
        payment_date: paymentDate ? new Date(paymentDate).toISOString() : null,
        payment_method: paymentMethod || null,
        transaction_id: transactionId || null,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('payment_status')
        .upsert(paymentData);
        
      if (error) throw error;
      
      // If payment was made, update music_unlocked in the profiles table
      if (hasPaid) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ music_unlocked: true })
          .eq('id', userId);
          
        if (profileError) {
          console.error("Failed to update profile music unlock status:", profileError);
        }
      }
      
      toast({
        title: "Success",
        description: isEditing 
          ? "Payment record updated successfully" 
          : "Payment record created successfully"
      });
      
      setDialogOpen(false);
      resetForm();
      fetchPayments();
    } catch (error) {
      console.error("Error saving payment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save payment record"
      });
    }
  };

  const handleDelete = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('payment_status')
        .delete()
        .eq('id', paymentId);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Payment record deleted successfully"
      });
      
      setDeleteConfirmOpen(false);
      fetchPayments();
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete payment record"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Payment Management</h3>
        <Button 
          onClick={() => handleOpenDialog()}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add Payment
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
                <TableHead>Status</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length > 0 ? (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.profiles?.username || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        payment.has_paid 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {payment.has_paid ? "Paid" : "Unpaid"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {payment.payment_date 
                        ? new Date(payment.payment_date).toLocaleDateString() 
                        : "-"}
                    </TableCell>
                    <TableCell>{payment.payment_method || "-"}</TableCell>
                    <TableCell>{payment.transaction_id || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleOpenDialog(payment)}
                        className="h-8 w-8 p-0 mr-2"
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setSelectedPayment(payment);
                          setDeleteConfirmOpen(true);
                        }}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No payment records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Add/Edit Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Payment Record" : "Add New Payment Record"}
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
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="has-paid" 
                checked={hasPaid}
                onCheckedChange={(checked) => setHasPaid(checked === true)}
              />
              <Label htmlFor="has-paid">Has Paid</Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment-date">Payment Date</Label>
              <Input
                id="payment-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Input
                id="payment-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                placeholder="e.g., Credit Card, PayPal, etc."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="transaction-id">Transaction ID</Label>
              <Input
                id="transaction-id"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter transaction reference"
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {isEditing ? "Update" : "Add"} Payment
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
          <p>Are you sure you want to delete this payment record? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedPayment && handleDelete(selectedPayment.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentManagement;
