
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/context/EOSAuthContext';
import { Loader2 } from 'lucide-react';
import { handleAuthCallback } from '@/lib/eos/eosAuth';

const AuthCallback = () => {
  const { handleExternalAuth } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processAuth = async () => {
      try {
        // Get the current URL and parse it
        const url = new URL(window.location.href);
        
        // Check for error in the URL parameters
        const errorParam = url.searchParams.get('error');
        const errorDescription = url.searchParams.get('error_description');
        
        if (errorParam) {
          throw new Error(errorDescription || 'Authentication failed');
        }
        
        // Handle the OAuth callback
        const authResponse = await handleAuthCallback(url);
        
        // Pass the auth response to the auth context
        await handleExternalAuth(authResponse);
        
        // Redirect to profile or home page
        navigate('/');
      } catch (error: any) {
        console.error('Auth callback error:', error);
        setError(error.message || 'Authentication failed. Please try again.');
        
        // Redirect to login after a delay
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };
    
    processAuth();
  }, [handleExternalAuth, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {error ? (
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-500">Authentication Failed</h1>
          <p className="text-gray-500">{error}</p>
          <p className="text-sm">Redirecting to login page...</p>
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
