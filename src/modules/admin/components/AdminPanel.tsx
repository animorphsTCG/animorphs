
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

const AdminPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4 overflow-auto">
      <Card className="w-full max-w-5xl h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-2xl font-bold">Admin Dashboard</h2>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
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
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanel;
