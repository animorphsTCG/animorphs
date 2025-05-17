import { useState, useEffect } from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle, XCircle, Search, BadgeCheck } from 'lucide-react';
import { d1Database } from '@/lib/d1Database';
import { toast } from '@/components/ui/use-toast';
import { UserProfile } from '@/types/user';

export const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingUser, setProcessingUser] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Use our updated d1Database API
      const result = await d1Database
        .from<UserProfile>('profiles')
        .order('created_at', 'desc')
        .get();
      
      if (result.error) {
        throw result.error;
      }
      
      setUsers(result.data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      
      const result = await d1Database.query<UserProfile>(
        `SELECT * FROM profiles WHERE username LIKE ? OR email LIKE ?`,
        { params: [`%${searchTerm}%`, `%${searchTerm}%`] }
      );
      
      setUsers(result || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to search users',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    setProcessingUser(userId);
    
    try {
      const newStatus = !currentStatus;
      
      await d1Database.execute(
        `UPDATE profiles SET is_admin = ? WHERE id = ?`,
        [newStatus ? 1 : 0, userId]
      );
      
      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, is_admin: newStatus } : user
        )
      );
      
      toast({
        title: 'User Updated',
        description: `Admin status toggled ${newStatus ? 'on' : 'off'}`,
      });
    } catch (error) {
      console.error('Error toggling admin status:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle admin status',
        variant: 'destructive'
      });
    } finally {
      setProcessingUser(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Search by username or email"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Search
          </Button>
        </div>
        
        <Table>
          <TableCaption>A list of all users in your account. Click on a user to view details.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Admin</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell className="text-right">
                  {user.is_admin ? (
                    <BadgeCheck className="inline-block h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="inline-block h-4 w-4 text-red-500" />
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAdminStatus(user.id, !!user.is_admin)}
                    disabled={processingUser === user.id}
                  >
                    {processingUser === user.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                      </>
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
