
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { AlertCircle, CheckCircle2, RefreshCw, RotateCcw, XCircle } from "lucide-react";

interface CloudflareError {
  id: string;
  error_message: string;
  command?: string;
  timestamp: string;
  status: 'unresolved' | 'resolved' | 'ignored';
  worker?: string;
  stack_trace?: string;
}

interface PendingScript {
  id: string;
  script: string;
  description?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  executed_at?: string;
  created_by?: string;
  result?: string;
}

const CloudflareErrors: React.FC = () => {
  const [errors, setErrors] = useState<CloudflareError[]>([]);
  const [pendingScripts, setPendingScripts] = useState<PendingScript[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("errors");
  const [selectedError, setSelectedError] = useState<CloudflareError | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch errors
      const errorsResponse = await fetch('/api/admin/cloudflare-errors', {
        credentials: 'include'
      });
      
      if (errorsResponse.ok) {
        const errorsData = await errorsResponse.json();
        setErrors(errorsData.errors || []);
      }
      
      // Fetch pending scripts
      const scriptsResponse = await fetch('/api/admin/pending-scripts', {
        credentials: 'include'
      });
      
      if (scriptsResponse.ok) {
        const scriptsData = await scriptsResponse.json();
        setPendingScripts(scriptsData.scripts || []);
      }
      
    } catch (error) {
      console.error('Error fetching Cloudflare logs:', error);
      toast({
        title: "Error",
        description: "Failed to load Cloudflare logs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateErrorStatus = async (errorId: string, newStatus: 'resolved' | 'ignored') => {
    try {
      const response = await fetch('/api/admin/update-error-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errorId, status: newStatus }),
        credentials: 'include'
      });
      
      if (response.ok) {
        // Update local state
        setErrors(prev => prev.map(error => 
          error.id === errorId ? { ...error, status: newStatus } : error
        ));
        
        toast({
          title: "Status Updated",
          description: `Error marked as ${newStatus}`,
        });
      } else {
        throw new Error(`Failed to update status: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update error status",
        variant: "destructive",
      });
    }
  };
  
  const executeScript = async (scriptId: string) => {
    try {
      const response = await fetch('/api/admin/execute-pending-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptId }),
        credentials: 'include'
      });
      
      if (response.ok) {
        toast({
          title: "Script Executed",
          description: "The script has been executed successfully",
        });
        
        // Refresh data to show updated status
        fetchData();
      } else {
        throw new Error(`Failed to execute script: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error executing script:', error);
      toast({
        title: "Execution Failed",
        description: "Failed to execute the pending script",
        variant: "destructive",
      });
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unresolved':
        return <Badge variant="destructive">Unresolved</Badge>;
      case 'resolved':
        return <Badge variant="secondary" className="bg-green-600">Resolved</Badge>;  // Changed from "success" to "secondary" with custom styling
      case 'ignored':
        return <Badge variant="secondary">Ignored</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500">Pending</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  const viewErrorDetails = (error: CloudflareError) => {
    setSelectedError(error);
    setIsModalOpen(true);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Cloudflare Deployment Logs</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Monitor and manage Cloudflare deployment errors and pending scripts
        </p>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="mb-4"
          onClick={fetchData}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="errors">
            Errors {errors.length > 0 && `(${errors.filter(e => e.status === 'unresolved').length})`}
          </TabsTrigger>
          <TabsTrigger value="scripts">
            Pending Scripts {pendingScripts.length > 0 && `(${pendingScripts.filter(s => s.status === 'pending').length})`}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="errors" className="pt-4">
          {errors.length === 0 ? (
            <Card>
              <CardContent className="text-center py-10">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">No Cloudflare errors found</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Cloudflare Deployment Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Error</TableHead>
                      <TableHead>Worker</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {errors.map((error) => (
                      <TableRow key={error.id}>
                        <TableCell className="whitespace-nowrap">{formatDate(error.timestamp)}</TableCell>
                        <TableCell className="max-w-xs truncate">{error.error_message}</TableCell>
                        <TableCell>{error.worker || 'Unknown'}</TableCell>
                        <TableCell>{getStatusBadge(error.status)}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => viewErrorDetails(error)}
                            className="mr-1"
                          >
                            Details
                          </Button>
                          {error.status === 'unresolved' && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="mr-1"
                                onClick={() => updateErrorStatus(error.id, 'resolved')}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Resolve
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => updateErrorStatus(error.id, 'ignored')}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Ignore
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="scripts" className="pt-4">
          {pendingScripts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-10">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">No pending scripts</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Pending Cloudflare Scripts</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Created At</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingScripts.map((script) => (
                      <TableRow key={script.id}>
                        <TableCell className="whitespace-nowrap">{formatDate(script.created_at)}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {script.description || script.script.substring(0, 50) + '...'}
                        </TableCell>
                        <TableCell>{getStatusBadge(script.status)}</TableCell>
                        <TableCell>
                          {script.status === 'pending' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => executeScript(script.id)}
                            >
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Execute
                            </Button>
                          )}
                          {script.status === 'completed' && (
                            <span className="text-green-600 text-sm flex items-center">
                              <CheckCircle2 className="h-4 w-4 mr-1" /> Completed
                            </span>
                          )}
                          {script.status === 'failed' && (
                            <span className="text-red-600 text-sm flex items-center">
                              <AlertCircle className="h-4 w-4 mr-1" /> Failed
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Error Details Modal would go here */}
    </div>
  );
};

export default CloudflareErrors;
