
import React, { useEffect } from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface ConnectionStatusProps {
  status: 'connected' | 'connecting' | 'disconnected';
  lastError: string | null;
  onRefresh: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  status, 
  lastError, 
  onRefresh 
}) => {
  // Show toast notification when disconnected
  useEffect(() => {
    if (status === 'disconnected') {
      toast({
        title: 'Connection Lost',
        description: 'Trying to reconnect...',
        variant: 'destructive',
      });
    }
  }, [status]);

  if (status === 'connected') {
    return (
      <div className="flex items-center text-green-500 text-sm">
        <Wifi className="h-4 w-4 mr-1" />
        <span>Connected</span>
      </div>
    );
  }

  if (status === 'connecting') {
    return (
      <div className="flex items-center text-amber-500 text-sm">
        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        <span>Connecting...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center text-red-500 text-sm">
        <WifiOff className="h-4 w-4 mr-1" />
        <span>Disconnected</span>
      </div>
      {lastError && (
        <div className="text-xs text-red-400 mt-1">{lastError}</div>
      )}
      <button 
        className="text-xs text-blue-500 hover:underline mt-1"
        onClick={onRefresh}
      >
        Retry connection
      </button>
    </div>
  );
};

export default ConnectionStatus;
