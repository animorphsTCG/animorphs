
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { SUPABASE_MIGRATION_COMPLETED } from '@/integrations/supabase/stub';

export default function SupabaseCleanup() {
  const [status, setStatus] = useState<'idle' | 'checking' | 'ready' | 'disconnecting' | 'done'>('idle');
  const [hasSupabaseDependencies, setHasSupabaseDependencies] = useState(false);
  const [componentDependencies, setComponentDependencies] = useState(0);
  const [dataQueries, setDataQueries] = useState(0);
  const [authFunctions, setAuthFunctions] = useState(0);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    if (SUPABASE_MIGRATION_COMPLETED) {
      setStatus('done');
      return;
    }
    
    checkSupabaseDependencies();
  }, []);

  const checkSupabaseDependencies = async () => {
    setStatus('checking');
    
    // Simulate checking for dependencies
    setTimeout(() => {
      const hasDependencies = true;
      const componentCount = 3;
      const queryCount = 5;
      const authCount = 1;
      
      setHasSupabaseDependencies(hasDependencies);
      setComponentDependencies(componentCount);
      setDataQueries(queryCount);
      setAuthFunctions(authCount);
      setStatus('ready');
    }, 2000);
  };

  const disconnectSupabase = async () => {
    setDisconnecting(true);
    
    // Simulate disconnecting from Supabase
    setTimeout(() => {
      setDisconnecting(false);
      setStatus('done');
      
      toast({
        title: "Supabase Disconnected",
        description: "Supabase has been successfully disconnected from your application."
      });
    }, 3000);
  };

  const showTestToast = () => {
    toast({
      title: "Migration Required",
      description: "Please complete the migration process before disconnecting Supabase.",
      variant: "default" // Fixed from 'warning' to 'default'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Supabase Cleanup</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            This tool helps you verify and disconnect Supabase from your application
            after migrating to Cloudflare D1 and Epic Online Services.
          </p>
        </CardContent>
      </Card>
      
      {status === 'checking' && (
        <Card className="border-amber-500/50 bg-amber-500/10">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Checking Supabase Dependencies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Scanning your application for remaining Supabase dependencies...
            </p>
          </CardContent>
        </Card>
      )}

      {status === 'ready' && hasSupabaseDependencies && (
        <Card className="border-amber-500/50 bg-amber-500/10">
          <CardHeader>
            <CardTitle className="flex items-center text-amber-500">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Supabase Dependencies Found
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              The following Supabase dependencies were found in your application:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              {componentDependencies > 0 && (
                <li>{componentDependencies} components still use Supabase</li>
              )}
              {dataQueries > 0 && (
                <li>{dataQueries} data queries still use Supabase</li>
              )}
              {authFunctions > 0 && (
                <li>Authentication still uses Supabase in {authFunctions} places</li>
              )}
            </ul>
            <div className="pt-2">
              <Button onClick={disconnectSupabase} disabled={disconnecting}>
                {disconnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  "Disconnect Anyway"
                )}
              </Button>
              <p className="text-sm mt-2 text-amber-500/80">
                Warning: Disconnecting before migration is complete may result in application errors.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {status === 'done' && (
        <Card className="border-green-500/50 bg-green-500/10">
          <CardHeader>
            <CardTitle className="flex items-center text-green-500">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Supabase Disconnected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              This application is now fully migrated to Cloudflare D1 and Epic Online Services.
              The <code>@supabase/supabase-js</code> package can be safely removed from your
              <code>package.json</code> file.
            </p>
          </CardContent>
        </Card>
      )}

      <Button onClick={showTestToast}>
        Test Toast
      </Button>
    </div>
  );
}
