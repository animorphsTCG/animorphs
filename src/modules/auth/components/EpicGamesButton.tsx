
import React from 'react';
import { Button } from '@/components/ui/button';
import { getEpicGamesOAuthURL } from '@/lib/eos/eosAuth';
import { Gamepad2 } from 'lucide-react';

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
  isLoading = false
}) => {
  const handleEpicLogin = () => {
    const epicOAuthURL = getEpicGamesOAuthURL();
    window.location.href = epicOAuthURL;
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={`w-full flex items-center justify-center ${className}`}
      onClick={handleEpicLogin}
      disabled={isLoading}
    >
      <Gamepad2 className="mr-2 h-5 w-5" />
      {isLoading ? 'Connecting...' : 'Continue with Epic Games'}
    </Button>
  );
};

export default EpicGamesButton;
