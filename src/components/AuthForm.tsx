
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Wallet, Zap, Loader2 } from "lucide-react";
import { eosManager, EOSUser } from "@/lib/eos";
import { web3Manager, WalletConnection } from "@/lib/web3";
import { apiClient } from "@/lib/api";

interface AuthFormProps {
  onAuthSuccess: (user: any) => void;
}

export const AuthForm = ({ onAuthSuccess }: AuthFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [walletConnection, setWalletConnection] = useState<WalletConnection | null>(null);
  const [eosUser, setEosUser] = useState<EOSUser | null>(null);

  const handleConnectWallet = async () => {
    try {
      setIsLoading(true);
      const connection = await web3Manager.connectWallet();
      setWalletConnection(connection);
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${connection.address.substring(0, 8)}...`,
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEOSLogin = async () => {
    try {
      setIsLoading(true);
      const user = await eosManager.login();
      setEosUser(user);
      
      toast({
        title: "EOS Login Successful",
        description: `Welcome, ${user.displayName || user.productUserId}!`,
      });
    } catch (error) {
      toast({
        title: "EOS Login Failed",
        description: error instanceof Error ? error.message : "Failed to login with EOS",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteAuth = async () => {
    if (!eosUser) {
      toast({
        title: "EOS Login Required",
        description: "Please login with Epic Online Services first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Login to our backend with EOS ID and optional wallet address
      const authResult = await apiClient.login(
        eosUser.productUserId,
        walletConnection?.address
      );

      // Store auth token
      localStorage.setItem('auth_token', authResult.token);
      localStorage.setItem('eos_user', JSON.stringify(eosUser));
      
      if (walletConnection) {
        localStorage.setItem('wallet_address', walletConnection.address);
      }

      // Sync NFTs if wallet is connected
      if (walletConnection?.address) {
        try {
          await apiClient.syncNFTs(walletConnection.address);
          toast({
            title: "NFTs Synchronized",
            description: "Your card collection has been updated",
          });
        } catch (syncError) {
          console.warn('NFT sync failed:', syncError);
          // Don't block login for sync failures
        }
      }

      onAuthSuccess(authResult.user);
      
      toast({
        title: "Login Successful",
        description: "Welcome to Animorphs TCG!",
      });
    } catch (error) {
      toast({
        title: "Authentication Failed",
        description: error instanceof Error ? error.message : "Failed to complete authentication",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoMode = () => {
    // Demo mode - no authentication required
    const demoUser = {
      id: 0,
      eos_id: 'demo_user',
      email: 'demo@example.com',
      wallet_address: null,
      has_battle_pass: false,
      created_at: new Date().toISOString(),
    };

    localStorage.setItem('demo_mode', 'true');
    onAuthSuccess(demoUser);
    
    toast({
      title: "Demo Mode",
      description: "Playing in demo mode with AI battles",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <Card className="w-full max-w-md bg-black/20 border-white/10 text-white">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Zap className="h-12 w-12 text-yellow-400" />
          </div>
          <CardTitle className="text-2xl">Welcome to Animorphs TCG</CardTitle>
          <CardDescription className="text-gray-300">
            Connect your accounts to start playing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* EOS Login */}
          <div className="space-y-2">
            <Button
              onClick={handleEOSLogin}
              disabled={isLoading || !!eosUser}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              {eosUser ? `✓ Connected as ${eosUser.displayName || eosUser.productUserId}` : 'Login with Epic Games'}
            </Button>
            {eosUser && (
              <p className="text-xs text-gray-400 text-center">
                EOS ID: {eosUser.productUserId}
              </p>
            )}
          </div>

          {/* Wallet Connection */}
          <div className="space-y-2">
            <Button
              onClick={handleConnectWallet}
              disabled={isLoading || !!walletConnection}
              variant="outline"
              className="w-full text-white border-white hover:bg-white hover:text-black"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Wallet className="h-4 w-4 mr-2" />
              )}
              {walletConnection ? `✓ ${walletConnection.address.substring(0, 8)}...` : 'Connect Wallet (Optional)'}
            </Button>
            {walletConnection && (
              <p className="text-xs text-gray-400 text-center">
                Chain: Polygon • {walletConnection.address}
              </p>
            )}
          </div>

          {/* Complete Authentication */}
          <Button
            onClick={handleCompleteAuth}
            disabled={isLoading || !eosUser}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Enter Game
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-black/20 px-2 text-gray-400">Or</span>
            </div>
          </div>

          {/* Demo Mode */}
          <Button
            onClick={handleDemoMode}
            variant="ghost"
            className="w-full text-gray-300 hover:text-white hover:bg-white/10"
          >
            Try Demo Mode (10v10 AI Battles)
          </Button>

          <div className="text-center text-xs text-gray-400 pt-4">
            <p>EOS provides matchmaking, voice chat, and achievements</p>
            <p>Wallet connection enables NFT card ownership</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
