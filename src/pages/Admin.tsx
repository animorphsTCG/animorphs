
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import UserManagement from "@/components/admin/UserManagement";
import SongManagement from "@/components/admin/SongManagement";

interface VipCode {
  id: number;
  code: string;
  max_uses: number;
  current_uses: number;
}

const Admin = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [vipCodes, setVipCodes] = useState<VipCode[]>([]);
  const [newVipCode, setNewVipCode] = useState("");
  const [maxUses, setMaxUses] = useState<string>("50");
  const [loading, setLoading] = useState(false);
  
  // Function to fetch VIP codes from database
  const fetchVipCodes = async () => {
    try {
      const { data, error } = await supabase
        .from("vip_codes")
        .select("*")
        .order("id", { ascending: true });
        
      if (error) {
        throw error;
      }
      
      if (data) {
        setVipCodes(data);
      }
    } catch (error) {
      console.error("Error fetching VIP codes:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load VIP codes"
      });
    }
  };
  
  // Function to create a new VIP code
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
      
      const { data, error } = await supabase
        .from("vip_codes")
        .insert({
          code: newVipCode.trim(),
          max_uses: parseInt(maxUses),
          current_uses: 0
        })
        .select();
        
      if (error) {
        throw error;
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
        description: "Failed to create VIP code"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Load VIP codes when the component mounts or the tab changes to "vip-codes"
  React.useEffect(() => {
    if (activeTab === "vip-codes") {
      fetchVipCodes();
    }
  }, [activeTab]);
  
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
          
          {/* Users Tab */}
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
          
          {/* Music Tab */}
          <TabsContent value="music">
            <SongManagement />
          </TabsContent>
          
          {/* VIP Codes Tab */}
          <TabsContent value="vip-codes">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="bg-black/70 border-fantasy-primary/50">
                  <CardHeader>
                    <CardTitle>VIP Codes</CardTitle>
                  </CardHeader>
                  <CardContent>
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
                          {vipCodes.map((code) => (
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
                          ))}
                        </TableBody>
                      </Table>
                    </div>
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
