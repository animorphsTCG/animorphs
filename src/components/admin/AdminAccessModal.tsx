
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Fingerprint, Shield, KeySquare } from 'lucide-react';
import { useAdminAuth } from '@/modules/admin/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';

interface AdminAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminAccessModal({ open, onOpenChange }: AdminAccessModalProps) {
  const [totpCode, setTotpCode] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const { authenticateWithTOTP, authenticateWithBiometric, generateBackupCodes, isAuthenticating } = useAdminAuth();
  const { toast } = useToast();

  const handleTOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!totpCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a verification code",
        variant: "destructive",
      });
      return;
    }
    
    const success = await authenticateWithTOTP(totpCode);
    
    if (success) {
      toast({
        title: "Success",
        description: "Admin access granted",
      });
      onOpenChange(false);
    } else {
      toast({
        title: "Error",
        description: "Invalid verification code",
        variant: "destructive",
      });
    }
  };

  const handleBiometricAuth = async () => {
    const success = await authenticateWithBiometric();
    
    if (success) {
      toast({
        title: "Success",
        description: "Admin access granted",
      });
      onOpenChange(false);
    } else {
      toast({
        title: "Error",
        description: "Biometric verification failed",
        variant: "destructive",
      });
    }
  };

  const handleGenerateBackupCodes = async () => {
    const codes = await generateBackupCodes();
    setBackupCodes(codes);
    setShowBackupCodes(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-500" /> 
            Admin Access Verification
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="totp" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="totp" className="flex items-center gap-1">
              <KeySquare className="h-4 w-4" /> TOTP Code
            </TabsTrigger>
            <TabsTrigger value="biometric" className="flex items-center gap-1">
              <Fingerprint className="h-4 w-4" /> Biometric
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="totp">
            <form onSubmit={handleTOTPSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Input
                  id="totp"
                  placeholder="Enter 6-digit verification code"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  className="text-center tracking-widest text-lg"
                  maxLength={6}
                />
              </div>
              
              <div className="flex justify-between items-center">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={handleGenerateBackupCodes}
                  className="text-xs"
                >
                  Generate Backup Codes
                </Button>
                <Button type="submit" disabled={isAuthenticating}>
                  {isAuthenticating ? "Verifying..." : "Verify"}
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="biometric">
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Fingerprint className="h-16 w-16 text-primary" />
              <p className="text-sm text-center text-muted-foreground">
                Use your fingerprint or Face ID to verify your identity
              </p>
              <Button onClick={handleBiometricAuth} disabled={isAuthenticating}>
                {isAuthenticating ? "Verifying..." : "Use Biometric Authentication"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        {showBackupCodes && backupCodes.length > 0 && (
          <div className="mt-4 p-4 border rounded-md bg-muted">
            <h4 className="font-medium mb-2">Backup Codes</h4>
            <p className="text-xs text-muted-foreground mb-2">
              Save these backup codes in a secure place. Each code can be used once.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, index) => (
                <div key={index} className="font-mono text-xs p-1 bg-background rounded border">
                  {code}
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
