import { useEffect, useState } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { d1Database } from '@/lib/d1Database';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PaymentRecord {
  id: string;
  username: string;
  email: string;
  has_paid: boolean;
  payment_date: string | null;
  payment_method: string | null;
  transaction_id: string | null;
}

export const PaymentManagement = () => {
  const { isAdmin, isLoading, adminToken } = useAdmin();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    if (!isLoading && isAdmin && adminToken) {
      loadPayments();
    }
  }, [isLoading, isAdmin, adminToken]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      
      const query = `
        SELECT 
          p.id,
          p.username,
          p.email,
          ps.has_paid,
          ps.payment_date,
          ps.payment_method,
          ps.transaction_id
        FROM profiles p
        LEFT JOIN payment_status ps ON p.id = ps.id
        ORDER BY p.username ASC
      `;
      
      const data = await d1Database.query<PaymentRecord>(query);
      setPayments(data || []);
    } catch (error) {
      console.error('Error loading payments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment records',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredPayments = payments.filter(payment =>
    payment.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updatePaymentStatus = async (userId: string, hasPaid: boolean) => {
    if (!adminToken) return;
    
    try {
      setProcessing(prev => ({ ...prev, [userId]: true }));
      
      // Update payment status in database
      await d1Database.query(
        `UPDATE payment_status SET has_paid = ? WHERE id = ?`,
        { params: [hasPaid ? 1 : 0, userId] }
      );
      
      // Refresh payments
      await loadPayments();
      
      toast({
        title: 'Success',
        description: `Payment status updated for ${userId}`,
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update payment status',
        variant: 'destructive',
      });
    } finally {
      setProcessing(prev => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Label htmlFor="search">Search Users</Label>
          <div className="relative">
            <Input
              id="search"
              placeholder="Search by username or email..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableCaption>A list of all registered users and their payment status.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Has Paid</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.username}</TableCell>
                  <TableCell>{payment.email}</TableCell>
                  <TableCell className="text-center">
                    {payment.has_paid ? (
                      <CheckCircle className="inline-block h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="inline-block h-4 w-4 text-red-500" />
                    )}
                  </TableCell>
                  <TableCell>{payment.payment_date || 'N/A'}</TableCell>
                  <TableCell>{payment.payment_method || 'N/A'}</TableCell>
                  <TableCell>{payment.transaction_id || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    {processing[payment.id] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updatePaymentStatus(payment.id, !payment.has_paid)}
                        >
                          {payment.has_paid ? 'Revoke Access' : 'Grant Access'}
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentManagement;
