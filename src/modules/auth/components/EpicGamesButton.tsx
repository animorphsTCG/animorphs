
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getEpicGamesOAuthURL } from '@/lib/eos/eosAuth';
import { Gamepad2, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface EpicGamesButtonProps {
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  isLoading?: boolean;
}

const EpicGamesButton: React.FC<EpicGamesButtonProps> = ({ 
  variant = 'default',
  size = 'default',
  className = '',
  isLoading: externalLoading = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleEpicLogin = () => {
    try {
      setIsLoading(true);
      const epicOAuthURL = getEpicGamesOAuthURL();
      window.location.href = epicOAuthURL;
    } catch (error) {
      console.error('Epic Games login error:', error);
      toast({
        variant: 'destructive',
        title: 'Epic Games Login Failed',
        description: 'Unable to connect to Epic Games. Please try again later.'
      });
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={`w-full flex items-center justify-center ${className}`}
      onClick={handleEpicLogin}
      disabled={isLoading || externalLoading}
    >
      {isLoading || externalLoading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Gamepad2 className="mr-2 h-5 w-5" />
          Continue with Epic Games
        </>
      )}
    </Button>
  );
};

export default EpicGamesButton;
