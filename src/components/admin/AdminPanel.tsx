
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useAdmin } from '@/hooks/useAdmin';
import UserManagement from './UserManagement';
import SongManagement from './SongManagement';
import AdminAccessTrigger from './AdminAccessTrigger';

const AdminPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAdmin, loading } = useAdmin();

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
            <TabsList className="w-full justify-start border-b rounded-none px-4">
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="songs">Song Management</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="users" className="p-4 h-[calc(100%-48px)] overflow-auto">
              <UserManagement />
            </TabsContent>
            
            <TabsContent value="songs" className="p-4 h-[calc(100%-48px)] overflow-auto">
              <SongManagement />
            </TabsContent>
            
            <TabsContent value="analytics" className="p-4 h-[calc(100%-48px)] overflow-auto">
              <h3 className="text-xl font-semibold mb-4">Analytics Dashboard</h3>
              <p className="text-muted-foreground">Analytics dashboard is coming soon.</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanel;
