
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Gamepad2 } from 'lucide-react';
import EpicGamesButton from './EpicGamesButton';

const RegistrationForm: React.FC = () => {
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  
  return (
    <div className="space-y-8">
      {registrationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{registrationError}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">Create Your Account</h2>
          <p className="text-muted-foreground mt-1">
            Join our gaming community with your Epic Games account
          </p>
        </div>
        
        <div className="space-y-2">
          <EpicGamesButton variant="default" />
          
          <div className="text-center pt-4">
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                By continuing, you agree to our{' '}
                <Link to="/terms-and-conditions" className="text-primary hover:underline">
                  Terms and Conditions
                </Link>
              </p>
              
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
      </div>
      
      <div className="flex items-center justify-center text-sm">
        <div className="inline-flex items-center">
          <Gamepad2 className="h-5 w-5 text-muted-foreground mr-2" />
          <span className="text-muted-foreground">
            Powered by Epic Online Services
          </span>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;
