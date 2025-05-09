
import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/lib/supabase";
import UserManagement from "@/components/admin/UserManagement";
import SongManagement from "@/components/admin/SongManagement";
import { VipCode } from "@/types";

interface VipCodeResponse {
  id: number;
  code: string;
  max_uses: number;
  current_uses: number;
}

const Admin = () => {
  const { isAdmin, loading: adminLoading, adminToken } = useAdmin();
  const [activeTab, setActiveTab] = useState("users");
  const [vipCodes, setVipCodes] = useState<VipCode[]>([]);
  const [newVipCode, setNewVipCode] = useState("");
  const [maxUses, setMaxUses] = useState<string>("50");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  useEffect(() => {
    // Only fetch data once the admin status is confirmed
    if (!adminLoading && isAdmin && activeTab === "vip-codes") {
      fetchVipCodes();
    }
  }, [activeTab, isAdmin, adminLoading]);
  
  const fetchVipCodes = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      
      const { data: adminData, error: adminError } = await supabase.functions.invoke('admin-dashboard', {
        body: { action: 'fetch_vip_codes' }
      });

      if (adminError) {
        console.error("Admin function error:", adminError);
        setFetchError("Failed to call admin function");
        throw adminError;
      }

      if (adminData?.error) {
        console.error("VIP codes error:", adminData.error);
        setFetchError(`Error: ${adminData.error}`);
        throw new Error(adminData.error);
      }
        
      if (adminData?.data) {
        setVipCodes(adminData.data);
      } else {
        setFetchError("No VIP codes data returned");
      }
    } catch (error) {
      console.error("Error fetching VIP codes:", error);
      setFetchError(error.message || "Failed to load VIP codes");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load VIP codes"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateVipCode = async () => {
    if (!newVipCode.trim() || !maxUses.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide both a code name and maximum uses"
      });
      return;
    }
    
    try {
      setLoading(true);
      
      const { data: adminData, error: adminError } = await supabase.functions.invoke('admin-dashboard', {
        body: { 
          action: 'create_vip_code', 
          data: { 
            code: newVipCode.trim(), 
            max_uses: maxUses 
          } 
        }
      });
      
      if (adminError || adminData?.error) {
        throw new Error(adminError?.message || adminData?.error || "Failed to create VIP code");
      }
        
      toast({
        title: "Success",
        description: `VIP code "${newVipCode}" created successfully`
      });
      
      setNewVipCode("");
      setMaxUses("50");
      fetchVipCodes(); // Refresh the list
      
    } catch (error) {
      console.error("Error creating VIP code:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create VIP code"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Early return for loading state
  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // Early return for unauthorized access
  if (!isAdmin) {
    return <Navigate to="/" replace />;
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="bg-black/70 border-fantasy-primary/50">
                  <CardHeader>
                    <CardTitle>VIP Codes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : fetchError ? (
                      <div className="text-center py-8">
                        <p className="text-red-500 mb-4">{fetchError}</p>
                        <Button onClick={fetchVipCodes}>Try Again</Button>
                      </div>
                    ) : (
                      <div className="rounded-md border border-fantasy-primary/30">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Code</TableHead>
                              <TableHead>Max Uses</TableHead>
                              <TableHead>Current Uses</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {vipCodes.length > 0 ? (
                              vipCodes.map((code) => (
                                <TableRow key={code.id}>
                                  <TableCell className="font-medium">{code.code}</TableCell>
                                  <TableCell>{code.max_uses}</TableCell>
                                  <TableCell>{code.current_uses}</TableCell>
                                  <TableCell>
                                    {code.current_uses >= code.max_uses ? (
                                      <span className="text-fantasy-danger">Exhausted</span>
                                    ) : (
                                      <span className="text-fantasy-success">Active</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Button variant="outline" size="sm" className="mr-2">
                                      Edit
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-fantasy-danger">
                                      Delete
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-4">
                                  No VIP codes found
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card className="bg-black/70 border-fantasy-primary/50">
                  <CardHeader>
                    <CardTitle>Create VIP Code</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="code-name">Code Name</Label>
                        <Input
                          id="code-name"
                          className="fantasy-input"
                          value={newVipCode}
                          onChange={(e) => setNewVipCode(e.target.value)}
                          placeholder="Enter VIP code name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="max-uses">Maximum Uses</Label>
                        <Input
                          id="max-uses"
                          className="fantasy-input"
                          type="number"
                          value={maxUses}
                          onChange={(e) => setMaxUses(e.target.value)}
                          placeholder="50"
                          required
                        />
                      </div>
                    </form>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="fantasy-button w-full" 
                      onClick={handleCreateVipCode}
                      disabled={loading}
                    >
                      {loading ? "Creating..." : "Create VIP Code"}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
