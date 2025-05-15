
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Fingerprint, Lock, KeyRound, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { isPlatformAuthenticatorAvailable } from '@/lib/auth/webauthn';
import { useAuth } from '@/modules/auth';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<string>("totp");
  const [totpCode, setTotpCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasBiometrics, setHasBiometrics] = useState<boolean>(false);
  const [isTotpSetup, setIsTotpSetup] = useState<boolean>(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState<boolean>(false);
  const { user } = useAuth();

  useEffect(() => {
    // Check if biometrics are available
    const checkBiometrics = async () => {
      const available = await isPlatformAuthenticatorAvailable();
      setHasBiometrics(available);
    };
    
    // Check if TOTP is set up for this user
    const checkTotpSetup = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/api/totp/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
          credentials: 'include'
        });
        
        const data = await response.json();
        setIsTotpSetup(data.isSetup || false);
      } catch (error) {
        console.error('Error checking TOTP status:', error);
      }
    };
    
    checkBiometrics();
    checkTotpSetup();
  }, [user]);
  
  const handleVerifyTotp = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in first",
        variant: "destructive",
      });
      return;
    }
    
    if (!totpCode || totpCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit verification code",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/totp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id,
          code: totpCode
        }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Authentication Successful",
          description: "You now have admin access",
          variant: "default",  // Changed from "success" to "default"
        });
        onSuccess();
        onClose();
      } else {
        toast({
          title: "Authentication Failed",
          description: data.message || "Invalid verification code",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Authentication Error",
        description: "Failed to verify code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBiometricAuth = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Start WebAuthn authentication
      const response = await fetch('/api/webauthn/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
        credentials: 'include'
      });
      
      const options = await response.json();
      
      // Convert options.challenge from base64 to ArrayBuffer
      const challenge = Uint8Array.from(
        atob(options.challenge), c => c.charCodeAt(0)
      );
      options.challenge = challenge.buffer;
      
      // Request biometric authentication
      const credential = await navigator.credentials.get({
        publicKey: options
      }) as PublicKeyCredential;
      
      // Verify with server
      const verifyResponse = await fetch('/api/webauthn/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: credential.id,
          rawId: Array.from(new Uint8Array(credential.rawId)),
          response: {
            authenticatorData: Array.from(
              new Uint8Array((credential.response as AuthenticatorAssertionResponse).authenticatorData)
            ),
            clientDataJSON: Array.from(
              new Uint8Array(credential.response.clientDataJSON)
            ),
            signature: Array.from(
              new Uint8Array((credential.response as AuthenticatorAssertionResponse).signature)
            )
          },
          type: credential.type
        }),
        credentials: 'include'
      });
      
      const verifyResult = await verifyResponse.json();
      
      if (verifyResult.success) {
        toast({
          title: "Authentication Successful",
          description: "Biometric verification complete",
          variant: "default",  // Changed from "success" to "default"
        });
        onSuccess();
        onClose();
      } else {
        toast({
          title: "Authentication Failed",
          description: "Biometric verification failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
      toast({
        title: "Authentication Error",
        description: "Biometric authentication failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const generateBackupCodes = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/totp/generate-backup-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success && data.codes) {
        setBackupCodes(data.codes);
        setShowBackupCodes(true);
        toast({
          title: "Backup Codes Generated",
          description: "Store these codes securely for future use",
          variant: "default",  // Changed from "success" to "default"
        });
      } else {
        toast({
          title: "Generation Failed",
          description: data.message || "Failed to generate backup codes",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate backup codes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTotpInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and limit to 6 digits
    const value = e.target.value.replace(/\D/g, '').substring(0, 6);
    setTotpCode(value);
    
    // Auto-submit when 6 digits are entered
    if (value.length === 6) {
      handleVerifyTotp();
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <DialogTitle>Admin Authentication</DialogTitle>
          </div>
          <DialogDescription>
            Additional verification is required to access admin features
          </DialogDescription>
        </DialogHeader>
        
        {showBackupCodes ? (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-medium text-lg">Your Backup Codes</h3>
              <p className="text-sm text-muted-foreground">
                Save these codes in a secure location. Each code can only be used once.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, index) => (
                <div key={index} className="bg-muted p-2 rounded-md text-center font-mono">
                  {code}
                </div>
              ))}
            </div>
            
            <Button 
              className="w-full" 
              variant="default" 
              onClick={() => setShowBackupCodes(false)}
            >
              Done
            </Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="totp" disabled={isLoading}>
                <Lock className="h-4 w-4 mr-2" /> 
                Verification Code
              </TabsTrigger>
              {hasBiometrics && (
                <TabsTrigger value="biometric" disabled={isLoading}>
                  <Fingerprint className="h-4 w-4 mr-2" /> 
                  Fingerprint
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="totp" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="totp-code">Enter 6-digit verification code</Label>
                <Input
                  id="totp-code"
                  placeholder="000000"
                  value={totpCode}
                  onChange={handleTotpInput}
                  maxLength={6}
                  className="text-center text-lg font-mono tracking-widest"
                  disabled={isLoading}
                  autoComplete="one-time-code"
                />
              </div>
              
              <Button 
                className="w-full" 
                onClick={handleVerifyTotp} 
                disabled={totpCode.length !== 6 || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </Button>
              
              <div className="text-center">
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={generateBackupCodes}
                  disabled={isLoading}
                >
                  <KeyRound className="h-3 w-3 inline mr-1" />
                  Generate Backup Codes
                </button>
              </div>
            </TabsContent>
            
            {hasBiometrics && (
              <TabsContent value="biometric" className="space-y-4 pt-4">
                <div className="text-center p-6">
                  <Fingerprint className="h-16 w-16 mx-auto text-primary mb-4" />
                  <h3 className="text-lg font-medium mb-2">Use Fingerprint</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Authenticate using your device's biometric sensor
                  </p>
                  
                  <Button 
                    className="w-full" 
                    onClick={handleBiometricAuth} 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Use Fingerprint'
                    )}
                  </Button>
                </div>
              </TabsContent>
            )}
          </Tabs>
        )}
        
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="mt-2 sm:mt-0"
            disabled={isLoading}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminAuthModal;
