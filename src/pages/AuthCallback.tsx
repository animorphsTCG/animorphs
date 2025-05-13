
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/context/EOSAuthContext';
import { Loader2, AlertTriangle, WifiOff, ExternalLink } from 'lucide-react';
import { handleAuthCallback } from '@/lib/eos/eosAuth';
import { Button } from '@/components/ui/button';
import { testD1Connection } from '@/lib/cloudflare/d1Worker';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AuthCallback = () => {
  const { handleExternalAuth } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [detailedError, setDetailedError] = useState<string | null>(null);

  useEffect(() => {
    const processAuth = async () => {
      try {
        console.log("Processing auth callback...");
        // Get the current URL and parse it
        const url = new URL(window.location.href);
        console.log("Auth callback URL:", url.toString());
        
        // Check for error in the URL parameters
        const errorParam = url.searchParams.get('error');
        const errorDescription = url.searchParams.get('error_description');
        
        if (errorParam) {
          throw new Error(errorDescription || 'Authentication failed');
        }
        
        // Handle the OAuth callback
        const authResponse = await handleAuthCallback(url);
        console.log("Auth response received:", { ...authResponse, access_token: "[REDACTED]" });
        
        // Pass the auth response to the auth context
        await handleExternalAuth(authResponse);
        
        // Redirect to profile or home page on success
        navigate('/');
      } catch (error: any) {
        console.error('Auth callback error:', error);
        setError(error.message || 'Authentication failed. Please try again.');
        
        // Capture more detailed error information
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          setDetailedError('Network error: Could not connect to the authentication service. This may be a CORS or network connectivity issue.');
        } else {
          setDetailedError(error.stack || null);
        }
        
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    processAuth();
  }, [handleExternalAuth, navigate]);

  const handleReturnToLogin = () => {
    navigate('/login');
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      const isConnected = await testD1Connection();
      setConnectionStatus(isConnected ? 'Connected successfully to database worker' : 'Failed to connect to database worker');
    } catch (error) {
      setConnectionStatus('Error testing connection: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {error ? (
        <div className="text-center space-y-6 max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <div className="flex justify-center">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-red-500">Authentication Failed</h1>
          <p className="text-gray-500">{error}</p>
          
          {error.includes('Failed to fetch') && (
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900 rounded-md text-left">
              <h3 className="font-semibold flex items-center gap-2">
                <WifiOff className="h-4 w-4" />
                Connection Issue Detected
              </h3>
              <p className="text-sm mt-2">
                There appears to be a connectivity issue with our backend services. This could be due to:
              </p>
              <ul className="list-disc pl-5 text-sm mt-2 space-y-1">
                <li>The authentication service is temporarily unavailable</li>
                <li>Network connectivity issue between the browser and our services</li>
                <li>CORS configuration needs to be updated for your domain</li>
              </ul>
              
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={isTestingConnection}
                  onClick={testConnection}
                  className="text-xs"
                >
                  {isTestingConnection ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Testing connection...
                    </>
                  ) : 'Test Connection'}
                </Button>
                {connectionStatus && (
                  <Alert variant={connectionStatus.includes('successfully') ? 'default' : 'destructive'} className="mt-2">
                    <AlertDescription className="text-xs">
                      {connectionStatus}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              
              {detailedError && (
                <details className="mt-4 text-xs">
                  <summary className="cursor-pointer font-medium">Technical Details</summary>
                  <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded overflow-auto text-xs">
                    {detailedError}
                  </pre>
                </details>
              )}
              
              <div className="mt-4 text-xs border-t border-amber-200 dark:border-amber-800 pt-2">
                <p className="font-semibold">For Administrators:</p>
                <p>You may need to deploy the database worker with updated CORS settings:</p>
                <code className="block p-2 mt-1 bg-gray-100 dark:bg-gray-900 rounded">
                  npx wrangler deploy --name db-worker --env db-worker
                </code>
                <a 
                  href="https://developers.cloudflare.com/workers/wrangler/commands/#deploy" 
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="text-primary flex items-center gap-1 mt-1"
                >
                  Wrangler deployment docs
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}
          
          <Button 
            onClick={handleReturnToLogin}
            className="w-full"
          >
            Return to Login
          </Button>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <h1 className="text-2xl font-bold">Completing Login</h1>
          <p className="text-gray-500">Please wait while we complete your authentication...</p>
        </div>
      )}
    </div>
  );
};

export default AuthCallback;
