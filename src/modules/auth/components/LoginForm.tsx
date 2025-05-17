
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import EpicGamesButton from './EpicGamesButton';

const LoginForm: React.FC = () => {
  const [loginError, setLoginError] = useState<string | null>(null);
  
  return (
    <div className="space-y-6">
      {loginError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{loginError}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">Sign In with Epic Games</h2>
          <p className="text-muted-foreground mt-1">
            Use your Epic Games account to sign in
          </p>
        </div>
        
        <EpicGamesButton variant="default" />
        
        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground">
            Don't have an Epic Games account?{' '}
            <a 
              href="https://www.epicgames.com/id/register" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-primary hover:underline"
            >
              Create one
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
