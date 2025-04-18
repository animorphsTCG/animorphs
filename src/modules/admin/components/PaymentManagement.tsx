
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { format } from 'date-fns';

interface UserProfile {
  username: string;
  email: string;
}

interface Payment {
  id: string;
  user_id: string;
  has_paid: boolean;
  payment_date: string | null;
  payment_method: string | null;
  transaction_id: string | null;
  created_at: string;
  updated_at?: string;
  profiles?: UserProfile; // Changed from array to object
}

// Define the structure of payments with user info
type PaymentWithUser = Payment;

const PaymentManagement = () => {
  const { isAdmin, adminToken } = useAdmin();
  const [payments, setPayments] = useState<PaymentWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [users, setUsers] = useState<{id: string, username: string, email: string}[]>([]);

  // Form state
  const [userId, setUserId] = useState('');
  const [hasPaid, setHasPaid] = useState(false);
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    if (isAdmin) {
      fetchPayments();
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_status')
        .select('*, profiles:user_id(username, email:auth.users(email))');

      if (error) throw error;

      // Transform data to match PaymentWithUser structure
      const transformedData = data.map(item => {
        return {
          ...item,
          profiles: {
            username: item.profiles?.username || 'Unknown',
            email: item.profiles?.auth_users?.[0]?.email || 'Unknown'
          }
        };
      }) as PaymentWithUser[];

      setPayments(transformedData);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch payment data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, auth_users:auth.users(email)')
        .order('username');

      if (error) throw error;

      const transformedUsers = data.map(user => ({
        id: user.id,
        username: user.username || 'Unknown',
        email: user.auth_users?.[0]?.email || 'Unknown'
      }));

      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
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
      const paymentData = {
        user_id: userId,
        has_paid: hasPaid,
        payment_date: paymentDate || null,
        payment_method: paymentMethod || null,
        transaction_id: transactionId || null,
      };

      let operation;
      if (isEditing && selectedPayment) {
        operation = supabase
          .from('payment_status')
          .update(paymentData)
          .eq('id', selectedPayment.id);
      } else {
        operation = supabase
          .from('payment_status')
          .insert(paymentData);
      }

      const { error } = await operation;
      if (error) throw error;

      // If payment is marked as paid, update user's battle_unlocked status
      if (hasPaid) {
        await supabase
          .from('profiles')
          .update({ battle_unlocked: true })
          .eq('id', userId);
      }

      toast({
        title: 'Success',
        description: isEditing ? 'Payment updated successfully.' : 'Payment added successfully.',
      });
      
      setDialogOpen(false);
      resetForm();
      fetchPayments();
    } catch (error) {
      console.error('Error saving payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to save payment data.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (payment: Payment) => {
    setSelectedPayment(payment);
    setUserId(payment.user_id);
    setHasPaid(payment.has_paid);
    setPaymentDate(payment.payment_date || '');
    setPaymentMethod(payment.payment_method || '');
    setTransactionId(payment.transaction_id || '');
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment record?')) return;

    try {
      const { error } = await supabase
        .from('payment_status')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Payment deleted successfully.',
      });
      
      fetchPayments();
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete payment.',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setUserId('');
    setHasPaid(false);
    setPaymentDate('');
    setPaymentMethod('');
    setTransactionId('');
    setSelectedPayment(null);
    setIsEditing(false);
  };

  const handleAddNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Payment Management</h3>
        <Button onClick={handleAddNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Payment
        </Button>
      </div>
      
      {payments.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Payment Date</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Transaction ID</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{payment.profiles?.username}</TableCell>
                <TableCell>{payment.profiles?.email}</TableCell>
                <TableCell>
                  {payment.has_paid ? (
                    <Badge variant="default" className="bg-green-500">Yes</Badge>
                  ) : (
                    <Badge variant="outline">No</Badge>
                  )}
                </TableCell>
                <TableCell>{payment.payment_date ? format(new Date(payment.payment_date), 'PPP') : '-'}</TableCell>
                <TableCell>{payment.payment_method || '-'}</TableCell>
                <TableCell>{payment.transaction_id || '-'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(payment)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(payment.id)}>
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
          <p>No payment records found.</p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Payment' : 'Add Payment'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="user">User</Label>
              <select
                id="user"
                className="w-full px-3 py-2 border rounded-md"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              >
                <option value="">Select a user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Checkbox 
                id="has-paid"
                checked={hasPaid}
                onCheckedChange={(checked) => setHasPaid(checked as boolean)}
              />
              <Label htmlFor="has-paid">Has Paid</Label>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="payment-date">Payment Date</Label>
              <Input
                id="payment-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Input
                id="payment-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                placeholder="e.g., Credit Card, PayPal"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="transaction-id">Transaction ID</Label>
              <Input
                id="transaction-id"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g., TXN12345678"
              />
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

export default PaymentManagement;
