
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { RotateCcw, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useAdminAuth } from '../hooks/useAdmin';
import { runMigration } from '@/lib/cloudflare/migrations/migrator';

// Migration status interface
interface MigrationStatus {
  table: string;
  total: number;
  migrated: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  error?: string;
}

const MigrationPanel: React.FC = () => {
  const { token } = useAdminAuth();
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const runDataMigration = async () => {
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "You must be authenticated as an admin to run migrations",
        variant: "destructive",
      });
      return;
    }
    
    setIsRunning(true);
    setIsCompleted(false);
    
    try {
      const status = await runMigration(token);
      setMigrationStatus(status);
      setIsCompleted(true);
      
      const failed = status.filter(s => s.status === 'failed');
      if (failed.length > 0) {
        toast({
          title: "Migration Completed with Errors",
          description: `${failed.length} tables failed to migrate. Check the details below.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Migration Completed",
          description: "All data has been successfully migrated to Cloudflare D1",
        });
      }
    } catch (error) {
      console.error('Migration failed:', error);
      toast({
        title: "Migration Failed",
        description: error.message || "Failed to run data migration",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'in_progress':
        return <RotateCcw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <ArrowRight className="h-5 w-5 text-gray-500" />;
    }
  };
  
  const calculateProgress = (status: MigrationStatus) => {
    if (status.total === 0) return 0;
    return Math.round((status.migrated / status.total) * 100);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Supabase to Cloudflare D1 Migration</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-4">
            This utility will migrate all data from Supabase to Cloudflare D1 database.
            This is necessary to fully decouple from Supabase.
          </p>
          
          <Button
            onClick={runDataMigration}
            disabled={isRunning || !token}
            className="mb-4"
          >
            {isRunning ? (
              <>
                <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                Migrating...
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Run Migration
              </>
            )}
          </Button>
        </div>
        
        {migrationStatus.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {migrationStatus.map((status) => (
                <TableRow key={status.table}>
                  <TableCell className="font-medium">{status.table}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Progress 
                        value={calculateProgress(status)} 
                        className="h-2"
                      />
                      <span className="ml-2 text-xs">
                        {status.migrated} / {status.total}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {getStatusIcon(status.status)}
                      <span className="ml-2 capitalize">{status.status}</span>
                    </div>
                    {status.error && (
                      <p className="text-xs text-red-500 mt-1">{status.error}</p>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        
        {isCompleted && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="text-green-800 font-medium flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Migration Complete
            </h3>
            <p className="mt-2 text-sm text-green-700">
              All data has been migrated from Supabase to Cloudflare D1. You can now disconnect Supabase.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MigrationPanel;
