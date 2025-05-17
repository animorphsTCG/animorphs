
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserManagement from './UserManagement';
import PaymentManagement from './PaymentManagement';
import SubscriptionManagement from './SubscriptionManagement';
import SongManagement from '@/components/admin/SongManagement';
import R2SongManagement from './R2SongManagement';
import AnalyticsDashboard from './AnalyticsDashboard';
import MigrationPanel from './MigrationPanel';
import CloudflareErrors from './CloudflareErrors';
import SupabaseCleanup from './SupabaseCleanup';
import WranglerTerminal from './WranglerTerminal';
import { useAdmin } from '../hooks/useAdmin';
import { Loader2 } from 'lucide-react';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { isAdmin, isLoading } = useAdmin();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-500/20 text-red-400 p-4 rounded-md">
          <h2 className="text-lg font-bold">Access Denied</h2>
          <p>You do not have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="music">Music</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="payments">
          <div className="space-y-8">
            <PaymentManagement />
            <SubscriptionManagement />
          </div>
        </TabsContent>

        <TabsContent value="music">
          <div className="space-y-8">
            <SongManagement />
            <R2SongManagement />
          </div>
        </TabsContent>

        <TabsContent value="system">
          <div className="space-y-8">
            <MigrationPanel />
            <CloudflareErrors />
            <SupabaseCleanup />
            <WranglerTerminal />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
