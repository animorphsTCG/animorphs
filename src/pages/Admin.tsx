import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import useAdmin from '@/hooks/useAdmin';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/modules/auth';

// Import admin components with named imports
import { SongManagement } from '@/components/admin/SongManagement';
import { UserManagement } from '@/components/admin/UserManagement';
import CloudflareErrors from '@/modules/admin/components/CloudflareErrors';
import MigrationPanel from '@/modules/admin/components/MigrationPanel';
import WranglerTerminal from '@/modules/admin/components/WranglerTerminal';
import AnalyticsDashboard from '@/modules/admin/components/AnalyticsDashboard';
import SupabaseCleanup from '@/modules/admin/components/SupabaseCleanup';
import PaymentManagement from '@/modules/admin/components/PaymentManagement';
import SubscriptionManagement from '@/modules/admin/components/SubscriptionManagement';
import R2SongManagement from '@/modules/admin/components/R2SongManagement';

const Admin: React.FC = () => {
  const { isAdmin, isLoading: adminLoading, adminToken } = useAdmin();
  const { isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  
  if (isLoading || adminLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-lg text-center mb-6">
          You do not have permission to access the admin panel.
        </p>
        <Button onClick={() => window.history.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
      </header>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="songs">Songs</TabsTrigger>
          <TabsTrigger value="r2songs">R2 Songs</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="errors">CF Logs</TabsTrigger>
          <TabsTrigger value="migrations">Migrations</TabsTrigger>
          <TabsTrigger value="terminal">Terminal</TabsTrigger>
          <TabsTrigger value="cleanup">Cleanup</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
        
        <TabsContent value="songs">
          <SongManagement />
        </TabsContent>
        
        <TabsContent value="r2songs">
          <R2SongManagement />
        </TabsContent>
        
        <TabsContent value="payments">
          <PaymentManagement />
        </TabsContent>
        
        <TabsContent value="subscriptions">
          <SubscriptionManagement />
        </TabsContent>
        
        <TabsContent value="analytics">
          <AnalyticsDashboard />
        </TabsContent>
        
        <TabsContent value="errors">
          <CloudflareErrors />
        </TabsContent>
        
        <TabsContent value="migrations">
          <MigrationPanel />
        </TabsContent>
        
        <TabsContent value="terminal">
          <WranglerTerminal />
        </TabsContent>
        
        <TabsContent value="cleanup">
          <SupabaseCleanup />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
