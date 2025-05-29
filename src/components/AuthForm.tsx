
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
  const [authStep, setAuthStep] = useState<'eos' | 'wallet' | 'complete'>('eos');

  const handleEOSLogin = async () => {
    try {
      setIsLoading(true);
      const user = await eosManager.login();
      setEosUser(user);
      setAuthStep('wallet');
      
      toast({
        title: "Epic Games Login Successful",
        description: `Welcome, ${user.displayName || user.productUserId}! Now connect your wallet to access NFTs.`,
      });
    } catch (error) {
      toast({
        title: "Epic Games Login Failed",
        description: error instanceof Error ? error.message : "Failed to login with Epic Games",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    if (!eosUser) {
      toast({
        title: "Epic Games Login Required",
        description: "Please login with Epic Games first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const connection = await web3Manager.connectWallet();
      setWalletConnection(connection);
      setAuthStep('complete');
      
      toast({
        title: "Wallet Connected Successfully",
        description: `Connected to ${connection.address.substring(0, 8)}... on Polygon network`,
      });
    } catch (error) {
      toast({
        title: "Wallet Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect MetaMask wallet",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteAuth = async () => {
    if (!eosUser) {
      toast({
        title: "Epic Games Login Required",
        description: "Please complete Epic Games authentication first",
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

      // Store auth token and user data
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
            title: "NFT Collection Synchronized",
            description: "Your cards have been loaded from the blockchain",
          });
        } catch (syncError) {
          console.warn('NFT sync failed:', syncError);
          // Don't block login for sync failures
        }
      }

      onAuthSuccess(authResult.user);
      
      toast({
        title: "Authentication Complete",
        description: "Welcome to Animorphs TCG! Ready to battle.",
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
      title: "Demo Mode Activated",
      description: "Playing in demo mode with AI battles (no NFTs)",
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
            {authStep === 'eos' && "Connect your Epic Games account to start"}
            {authStep === 'wallet' && "Now connect your MetaMask wallet for NFTs"}
            {authStep === 'complete' && "Complete your authentication"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1: Epic Games Login */}
          <div className="space-y-2">
            <Button
              onClick={handleEOSLogin}
              disabled={isLoading || !!eosUser}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isLoading && authStep === 'eos' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              {eosUser ? `✓ Epic Games: ${eosUser.displayName || eosUser.productUserId}` : 'Login with Epic Games'}
            </Button>
            {eosUser && (
              <p className="text-xs text-gray-400 text-center">
                Step 1 Complete - EOS ID: {eosUser.productUserId}
              </p>
            )}
          </div>

          {/* Step 2: MetaMask Wallet Connection (only after EOS login) */}
          {authStep !== 'eos' && (
            <div className="space-y-2">
              <Button
                onClick={handleConnectWallet}
                disabled={isLoading || !eosUser || !!walletConnection}
                variant="outline"
                className="w-full text-white border-white hover:bg-white hover:text-black"
              >
                {isLoading && authStep === 'wallet' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Wallet className="h-4 w-4 mr-2" />
                )}
                {walletConnection ? `✓ Wallet: ${walletConnection.address.substring(0, 8)}...` : 'Connect MetaMask Wallet'}
              </Button>
              {walletConnection && (
                <p className="text-xs text-gray-400 text-center">
                  Step 2 Complete - Polygon Network: {walletConnection.address}
                </p>
              )}
            </div>
          )}

          {/* Step 3: Complete Authentication */}
          {authStep === 'complete' && (
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
          )}

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
            Try Demo Mode (No Login Required)
          </Button>

          <div className="text-center text-xs text-gray-400 pt-4">
            <p><strong>Step 1:</strong> Epic Games login for matchmaking & achievements</p>
            <p><strong>Step 2:</strong> MetaMask wallet for NFT card ownership</p>
            <p><strong>NFT Contract:</strong> 0xb08882e1804B444171B560Cf7cEe99aDD26f7f62</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
