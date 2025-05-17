
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserManagement from './UserManagement';
import PaymentManagement from './PaymentManagement';
import { SongManagement } from '@/components/admin/SongManagement';
import R2SongManagement from './R2SongManagement';

export default function AdminPanel() {
  return (
    <div className="container p-4 mx-auto max-w-7xl">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
      
      <Tabs defaultValue="users">
        <TabsList className="mb-8">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="songs">Songs</TabsTrigger>
          <TabsTrigger value="r2-songs">R2 Songs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
        
        <TabsContent value="payments">
          <PaymentManagement />
        </TabsContent>
        
        <TabsContent value="songs">
          <SongManagement />
        </TabsContent>
        
        <TabsContent value="r2-songs">
          <R2SongManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
