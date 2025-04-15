
import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import UserManagement from "@/components/admin/UserManagement";
import SongManagement from "@/components/admin/SongManagement";
import VIPCodeManagement from "@/components/admin/VIPCodeManagement";

const Admin = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [activeTab, setActiveTab] = useState("users");
  
  if (!adminLoading && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold text-center mb-4 font-fantasy">
          <span className="text-fantasy-accent">Admin</span> Dashboard
        </h1>
        <p className="text-gray-300 text-center mb-12">
          Manage your Animorph Battle Verse game from this central dashboard
        </p>
        
        <Tabs defaultValue="users" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="music">Music</TabsTrigger>
            <TabsTrigger value="vip-codes">VIP Codes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
          
          <TabsContent value="music">
            <SongManagement />
          </TabsContent>
          
          <TabsContent value="vip-codes">
            <VIPCodeManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
