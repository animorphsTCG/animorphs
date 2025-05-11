
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/context/EOSAuthContext';
import { Loader2, AlertTriangle } from 'lucide-react';
import { handleAuthCallback } from '@/lib/eos/eosAuth';
import { Button } from '@/components/ui/button';

const AuthCallback = () => {
  const { handleExternalAuth } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {error ? (
        <div className="text-center space-y-6 max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <div className="flex justify-center">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-red-500">Authentication Failed</h1>
          <p className="text-gray-500">{error}</p>
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
