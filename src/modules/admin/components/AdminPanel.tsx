
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useAdminStatus } from '../hooks/useAdmin';
import UserManagement from './UserManagement';
import SongManagement from './SongManagement';
import AdminAccessTrigger from './AdminAccessTrigger';
import PaymentManagement from './PaymentManagement';
import SubscriptionManagement from './SubscriptionManagement';
import AnalyticsDashboard from './AnalyticsDashboard';
import WranglerTerminal from './WranglerTerminal';
import CloudflareErrors from './CloudflareErrors';

interface AdminPanelProps {
  onClose?: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [isOpen, setIsOpen] = useState(true);
  const { isAdmin, loading } = useAdminStatus();

  if (loading) {
    return null; // Don't render anything while checking admin status
  }

  if (!isAdmin) {
    return <AdminAccessTrigger onAuthenticated={() => setIsOpen(true)} />;
  }

  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };
  
  const handleRunScript = async (script: string) => {
    try {
      const response = await fetch('/api/admin/run-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Script execution failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error running script:', error);
      throw error;
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4 overflow-auto">
      <Card className="w-full max-w-5xl h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-2xl font-bold">Admin Dashboard</h2>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <CardContent className="flex-grow overflow-auto p-0">
          <Tabs defaultValue="users" className="w-full h-full">
            <TabsList className="w-full justify-start border-b rounded-none px-4 overflow-x-auto">
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="songs">Song Management</TabsTrigger>
              <TabsTrigger value="payments">Payment Management</TabsTrigger>
              <TabsTrigger value="subscriptions">Subscription Management</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="wrangler">Wrangler Terminal</TabsTrigger>
              <TabsTrigger value="errors">Cloudflare Logs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="users" className="p-4 h-[calc(100%-48px)] overflow-auto">
              <UserManagement />
            </TabsContent>
            
            <TabsContent value="songs" className="p-4 h-[calc(100%-48px)] overflow-auto">
              <SongManagement />
            </TabsContent>
            
            <TabsContent value="payments" className="p-4 h-[calc(100%-48px)] overflow-auto">
              <PaymentManagement />
            </TabsContent>
            
            <TabsContent value="subscriptions" className="p-4 h-[calc(100%-48px)] overflow-auto">
              <SubscriptionManagement />
            </TabsContent>
            
            <TabsContent value="analytics" className="p-4 h-[calc(100%-48px)] overflow-auto">
              <AnalyticsDashboard />
            </TabsContent>
            
            <TabsContent value="wrangler" className="p-4 h-[calc(100%-48px)] overflow-auto">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Wrangler Terminal</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Run Wrangler commands to manage your Cloudflare Workers and D1 Database
                  </p>
                </div>
                
                <WranglerTerminal 
                  onScriptRun={handleRunScript}
                  defaultScript="# Example: Query D1 database\nnpx wrangler d1 execute animorphs-db --command 'SELECT * FROM profiles LIMIT 5'"
                />
                
                <div className="text-sm text-muted-foreground mt-4">
                  <h4 className="font-medium mb-1">Common Commands:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><code>npx wrangler d1 execute animorphs-db --command 'SQL_QUERY_HERE'</code></li>
                    <li><code>npx wrangler publish worker-templates/db-worker.js</code></li>
                    <li><code>npx wrangler d1 migrations apply animorphs-db</code></li>
                  </ul>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="errors" className="p-4 h-[calc(100%-48px)] overflow-auto">
              <CloudflareErrors />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanel;
