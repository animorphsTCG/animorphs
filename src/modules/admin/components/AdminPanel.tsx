
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CloudflareErrors from './CloudflareErrors';
import WranglerTerminal from './WranglerTerminal';
import MigrationPanel from './MigrationPanel'; // Import the new component
import { useAdminAuth } from '../hooks/useAdmin';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("migration"); // Set initial tab to migration
  const { isAuthenticated } = useAdminAuth();
  
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Authentication required to access Admin Panel</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Admin Panel</h2>
        <p className="text-muted-foreground">
          Manage your Animorphs TCG application
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-[400px]">
          <TabsTrigger value="migration">Data Migration</TabsTrigger>
          <TabsTrigger value="errors">Cloudflare Logs</TabsTrigger>
          <TabsTrigger value="terminal">Wrangler Terminal</TabsTrigger>
        </TabsList>
        
        <TabsContent value="migration" className="space-y-4">
          <MigrationPanel />
        </TabsContent>
        
        <TabsContent value="errors" className="space-y-4">
          <CloudflareErrors />
        </TabsContent>
        
        <TabsContent value="terminal" className="space-y-4">
          <WranglerTerminal />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
