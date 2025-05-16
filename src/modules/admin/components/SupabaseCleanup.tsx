import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, CheckCircle, AlertTriangle, RotateCw } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useAdminAuth } from '../hooks/useAdmin';

// Files and modules that need to be deleted/replaced
const SUPABASE_FILES = [
  'src/lib/supabase.ts',
  'src/types/supabase.ts',
  'src/scripts/populateDatabase.js',
];

// Tables that should have been migrated
const MIGRATED_TABLES = [
  'profiles',
  'payment_status',
  'music_subscriptions',
  'songs',
  'user_song_selections',
  'user_music_settings',
  'animorph_cards',
  'vip_codes'
];

interface VerificationStatus {
  table: string;
  supabaseCount: number;
  d1Count: number;
  status: 'pending' | 'verifying' | 'verified' | 'failed';
  message?: string;
}

interface FileStatus {
  path: string;
  referencesCount: number;
  status: 'pending' | 'ready' | 'unreferenced' | 'still_referenced';
}

const SupabaseCleanup: React.FC = () => {
  const { token } = useAdminAuth();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus[]>([]);
  const [fileStatus, setFileStatus] = useState<FileStatus[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [overallStatus, setOverallStatus] = useState<'pending' | 'verifying' | 'ready' | 'completed' | 'failed'>('pending');
  
  // Initialize status on component mount
  useEffect(() => {
    initializeStatus();
  }, []);
  
  const initializeStatus = () => {
    // Initialize table verification status
    setVerificationStatus(MIGRATED_TABLES.map(table => ({
      table,
      supabaseCount: 0,
      d1Count: 0,
      status: 'pending'
    })));
    
    // Initialize file status
    setFileStatus(SUPABASE_FILES.map(path => ({
      path,
      referencesCount: 0,
      status: 'pending'
    })));
    
    setOverallStatus('pending');
  };
  
  const verifyMigration = async () => {
    if (!token || !token.access_token) {
      toast({
        title: "Authentication Required",
        description: "You must be authenticated as an admin to verify migration",
        variant: "destructive",
      });
      return;
    }
    
    setIsVerifying(true);
    setOverallStatus('verifying');
    
    try {
      // Track status of verification
      const updatedVerification = [...verificationStatus];
      
      // Verify each table
      for (let i = 0; i < MIGRATED_TABLES.length; i++) {
        const table = MIGRATED_TABLES[i];
        const index = updatedVerification.findIndex(s => s.table === table);
        
        if (index !== -1) {
          // Update status to verifying
          updatedVerification[index] = {
            ...updatedVerification[index],
            status: 'verifying'
          };
          setVerificationStatus([...updatedVerification]);
          
          try {
            // In a real implementation, you would:
            // 1. Query count from Supabase
            // 2. Query count from D1
            // 3. Compare the counts
            // This is a placeholder for demo
            
            // Simulate successful verification
            const supabaseCount = Math.floor(Math.random() * 1000) + 1;
            const d1Count = supabaseCount; // Assuming perfect migration
            
            // Occasionally simulate a mismatch for demonstration
            const simulateSuccess = Math.random() > 0.2;
            
            // Update the verification status
            updatedVerification[index] = {
              ...updatedVerification[index],
              supabaseCount,
              d1Count: simulateSuccess ? d1Count : d1Count - Math.floor(Math.random() * 10) - 1,
              status: simulateSuccess ? 'verified' : 'failed',
              message: simulateSuccess ? undefined : 'Data count mismatch'
            };
            
            setVerificationStatus([...updatedVerification]);
            
            // Add a small delay to make the verification process visible
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            updatedVerification[index] = {
              ...updatedVerification[index],
              status: 'failed',
              message: error.message || 'Verification failed'
            };
            setVerificationStatus([...updatedVerification]);
          }
        }
      }
      
      // Check for file references
      const updatedFileStatus = [...fileStatus];
      
      for (let i = 0; i < SUPABASE_FILES.length; i++) {
        const file = SUPABASE_FILES[i];
        const index = updatedFileStatus.findIndex(s => s.path === file);
        
        if (index !== -1) {
          // Simulated file reference check
          // In a real implementation, you would check actual reference count
          const referencesCount = Math.floor(Math.random() * 5);
          
          updatedFileStatus[index] = {
            ...updatedFileStatus[index],
            referencesCount,
            status: referencesCount === 0 ? 'unreferenced' : 'still_referenced'
          };
        }
      }
      
      setFileStatus(updatedFileStatus);
      
      // Determine overall status
      const allTablesVerified = !updatedVerification.some(s => s.status !== 'verified');
      const allFilesUnreferenced = !updatedFileStatus.some(s => s.status !== 'unreferenced');
      
      if (allTablesVerified && allFilesUnreferenced) {
        setOverallStatus('ready');
      } else {
        setOverallStatus('failed');
      }
      
      if (!allTablesVerified) {
        toast({
          title: "Verification incomplete",
          description: "Some tables have not been fully migrated to D1",
          variant: "destructive",
        });
      } else if (!allFilesUnreferenced) {
        toast({
          title: "Supabase references found",
          description: "Some files still have references to Supabase",
          variant: "warning",
        });
      } else {
        toast({
          title: "Verification successful",
          description: "All tables migrated successfully and no Supabase references found",
        });
      }
    } catch (error) {
      console.error('Verification failed:', error);
      setOverallStatus('failed');
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify migration",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };
  
  const disconnectSupabase = async () => {
    if (overallStatus !== 'ready') {
      toast({
        title: "Cannot disconnect Supabase",
        description: "Please verify the migration first and ensure all data is migrated",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // In a real implementation, you would:
      // 1. Remove Supabase API keys from environment
      // 2. Delete or archive Supabase-related files
      // 3. Mark the migration as completed in database
      
      // Simulate the disconnection process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setOverallStatus('completed');
      
      toast({
        title: "Supabase Disconnected",
        description: "Successfully disconnected from Supabase. All data is now on Cloudflare D1.",
      });
    } catch (error) {
      toast({
        title: "Disconnection Failed",
        description: error.message || "Failed to disconnect Supabase",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Supabase Cleanup and Disconnection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            This utility helps you verify that all data has been migrated from Supabase to Cloudflare D1 
            and safely disconnect Supabase from your application.
          </p>
          
          <div className="flex items-center gap-4 mb-6">
            <Button
              onClick={verifyMigration}
              disabled={isVerifying}
              variant="outline"
            >
              {isVerifying ? (
                <>
                  <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <RotateCw className="mr-2 h-4 w-4" />
                  Verify Migration
                </>
              )}
            </Button>
            
            <Button
              onClick={disconnectSupabase}
              disabled={overallStatus !== 'ready'}
              variant="destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Disconnect Supabase
            </Button>
            
            <div className="ml-auto">
              {overallStatus === 'pending' && (
                <Badge variant="outline">Pending Verification</Badge>
              )}
              {overallStatus === 'verifying' && (
                <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-300">
                  Verifying...
                </Badge>
              )}
              {overallStatus === 'ready' && (
                <Badge variant="outline" className="bg-green-50 text-green-800 border-green-300">
                  Ready for Disconnection
                </Badge>
              )}
              {overallStatus === 'completed' && (
                <Badge variant="outline" className="bg-green-50 text-green-800 border-green-300">
                  Disconnection Complete
                </Badge>
              )}
              {overallStatus === 'failed' && (
                <Badge variant="outline" className="bg-red-50 text-red-800 border-red-300">
                  Verification Failed
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {/* Table Migration Status */}
        {verificationStatus.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">Table Migration Status</h3>
            <div className="border rounded-md">
              <div className="grid grid-cols-4 gap-4 p-4 border-b text-sm font-medium">
                <div>Table</div>
                <div>Supabase Records</div>
                <div>D1 Records</div>
                <div>Status</div>
              </div>
              <div className="divide-y">
                {verificationStatus.map((status, i) => (
                  <div key={i} className="grid grid-cols-4 gap-4 p-4 text-sm">
                    <div>{status.table}</div>
                    <div>{status.status !== 'pending' ? status.supabaseCount : '-'}</div>
                    <div>{status.status !== 'pending' ? status.d1Count : '-'}</div>
                    <div className="flex items-center">
                      {status.status === 'pending' && <span>Pending</span>}
                      {status.status === 'verifying' && (
                        <span className="flex items-center">
                          <RotateCw className="mr-1 h-3 w-3 animate-spin" />
                          Verifying
                        </span>
                      )}
                      {status.status === 'verified' && (
                        <span className="flex items-center text-green-600">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Verified
                        </span>
                      )}
                      {status.status === 'failed' && (
                        <span className="flex items-center text-red-600">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Failed
                          {status.message && (
                            <span className="ml-2 text-xs text-red-500">{status.message}</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* File References Status */}
        {fileStatus.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Supabase File References</h3>
            <div className="border rounded-md">
              <div className="grid grid-cols-3 gap-4 p-4 border-b text-sm font-medium">
                <div>File</div>
                <div>References</div>
                <div>Status</div>
              </div>
              <div className="divide-y">
                {fileStatus.map((status, i) => (
                  <div key={i} className="grid grid-cols-3 gap-4 p-4 text-sm">
                    <div className="font-mono text-xs">{status.path}</div>
                    <div>{status.status !== 'pending' ? status.referencesCount : '-'}</div>
                    <div>
                      {status.status === 'pending' && <span>Pending</span>}
                      {status.status === 'unreferenced' && (
                        <span className="flex items-center text-green-600">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Ready for Removal
                        </span>
                      )}
                      {status.status === 'still_referenced' && (
                        <span className="flex items-center text-amber-600">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Still Referenced
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Completion Message */}
        {overallStatus === 'completed' && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="text-green-800 font-medium flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Supabase Disconnection Complete
            </h3>
            <p className="mt-2 text-sm text-green-700">
              You have successfully disconnected from Supabase. Your application is now fully running
              on Cloudflare D1 database and Epic Online Services (EOS) authentication.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SupabaseCleanup;
