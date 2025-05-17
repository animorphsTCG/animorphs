
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { d1 } from '@/lib/d1Database';
import { useAuth } from '@/modules/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string | null;
  surname: string | null;
  username: string | null;
  age: number | null;
  created_at: string;
}

const UserSearch = () => {
  const [users, setUsers] = useState<User[]>([]);
  const { register, handleSubmit, reset } = useForm<{ query: string }>();
  const { token } = useAuth();

  const onSubmit = async (data: { query: string }) => {
    try {
      if (!token?.access_token) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in to search users",
          variant: "destructive",
        });
        return;
      }

      const searchQuery = `SELECT * FROM profiles WHERE name LIKE ? OR username LIKE ?`;
      const searchParam = `%${data.query}%`;
      
      const results = await d1Worker.query(
        searchQuery,
        { params: [searchParam, searchParam] },
        token.access_token
      );

      setUsers(results || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Search Error",
        description: "Failed to search users. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-12">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>User Search</CardTitle>
          <CardDescription>Search for users by name.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Label htmlFor="search">Search Query</Label>
              <Input type="text" id="search" placeholder="Enter name" {...register('query')} />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {users.length > 0 && (
        <Card className="max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>Users found matching your query.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>A list of users matching your search query.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Surname</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.id}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.surname}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.age}</TableCell>
                    <TableCell>{user.created_at}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserSearch;
