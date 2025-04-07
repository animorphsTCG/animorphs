
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const Admin = () => {
  const [loading, setLoading] = useState(false);
  
  // Sample VIP codes data
  const vipCodes = [
    { id: 1, code: "WonAgainstAi", max_uses: 50, current_uses: 12 },
    { id: 2, code: "ZypherDan", max_uses: 51, current_uses: 3 },
    { id: 3, code: "BattleMaster", max_uses: 20, current_uses: 20 },
  ];
  
  // Sample users data
  const users = [
    { id: 1, username: "dragonslayer", email: "dragon@example.com", name: "Alex", surname: "Carter", age: 27 },
    { id: 2, username: "techwarrior", email: "warrior@example.com", name: "Sam", surname: "Johnson", age: 31 },
    { id: 3, username: "forestmage", email: "forest@example.com", name: "Jamie", surname: "Smith", age: 24 },
  ];
  
  // Form states
  const [newVipCode, setNewVipCode] = useState("");
  const [maxUses, setMaxUses] = useState("50");
  
  const handleCreateVipCode = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setNewVipCode("");
      setMaxUses("50");
      alert("VIP code created successfully!");
    }, 1000);
  };

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold text-center mb-4 font-fantasy">
          <span className="text-fantasy-accent">Admin</span> Dashboard
        </h1>
        <p className="text-gray-300 text-center mb-12">
          Manage your Animorph Battle Verse game from this central dashboard
        </p>
        
        <Tabs defaultValue="vip-codes" className="w-full">
          <TabsList className="grid grid-cols-4 mb-8">
            <TabsTrigger value="vip-codes">VIP Codes</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="music">Music</TabsTrigger>
          </TabsList>
          
          {/* VIP Codes Tab */}
          <TabsContent value="vip-codes">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="bg-black/70 border-fantasy-primary/50">
                  <CardHeader>
                    <CardTitle>VIP Codes</CardTitle>
                    <CardDescription>Manage existing VIP codes and their usage</CardDescription>
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
                    <CardDescription>Generate a new VIP code for users</CardDescription>
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
          
          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="bg-black/70 border-fantasy-primary/50">
              <CardHeader>
                <CardTitle>Users Management</CardTitle>
                <CardDescription>Manage registered users and their details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-fantasy-primary/30">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Surname</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.name}</TableCell>
                          <TableCell>{user.surname}</TableCell>
                          <TableCell>{user.age}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" className="mr-2">
                              View
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
          </TabsContent>
          
          {/* Cards Tab */}
          <TabsContent value="cards">
            <div className="h-96 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-2xl font-fantasy mb-4">Card Management</h3>
                <p className="text-gray-300 mb-6">Create, edit and manage battle cards</p>
                <Button className="fantasy-button">Coming Soon</Button>
              </div>
            </div>
          </TabsContent>
          
          {/* Music Tab */}
          <TabsContent value="music">
            <div className="h-96 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-2xl font-fantasy mb-4">Music Management</h3>
                <p className="text-gray-300 mb-6">Add and manage YouTube music tracks</p>
                <Button className="fantasy-button">Coming Soon</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
