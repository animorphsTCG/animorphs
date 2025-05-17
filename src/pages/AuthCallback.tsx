
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth';
import { Loader2 } from 'lucide-react';

const AuthCallback: React.FC = () => {
  const { handleEpicAuthCallback } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const processAuthCallback = async () => {
      try {
        // Get the current URL with all query parameters
        const url = new URL(window.location.href);
        
        // Check for error in URL
        const errorParam = url.searchParams.get('error');
        const errorDescription = url.searchParams.get('error_description');
        
        if (errorParam) {
          throw new Error(errorDescription || `Authentication error: ${errorParam}`);
        }
        
        // Handle auth callback
        const success = await handleEpicAuthCallback(url);
        
        if (success) {
          // Auth successful, redirect to home or return URL
          const returnPath = sessionStorage.getItem('auth_return_path') || '/';
          sessionStorage.removeItem('auth_return_path');
          navigate(returnPath);
        } else {
          // Auth failed but no error was thrown
          navigate('/login');
        }
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message);
        setTimeout(() => navigate('/login'), 5000);
      }
    };

    processAuthCallback();
  }, [handleEpicAuthCallback, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md text-center">
        {error ? (
          <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">Authentication Failed</h2>
            <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Redirecting to login in 5 seconds...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h2 className="text-xl font-bold">Processing Login</h2>
            <p className="text-gray-500 dark:text-gray-400">
              Please wait while we authenticate your Epic Games account...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
