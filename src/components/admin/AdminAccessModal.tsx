
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/modules/admin';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface AdminAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminAccessModal({ open, onOpenChange }: AdminAccessModalProps) {
  const [totpCode, setTotpCode] = useState('');
  const { authenticateAdmin, loading } = useAdminAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!totpCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter your authentication code",
        variant: "destructive",
      });
      return;
    }
    
    const result = await authenticateAdmin(totpCode);
    
    if (result) {
      onOpenChange(false);
      setTotpCode('');
      toast({
        title: "Success",
        description: "Admin access granted",
      });
    } else {
      toast({
        title: "Authentication Failed",
        description: "Invalid authentication code",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Admin Authentication</DialogTitle>
          <DialogDescription>
            Please enter your authentication code to access admin features.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="totp">Authentication Code</Label>
            <Input 
              id="totp"
              type="text"
              autoComplete="one-time-code"
              placeholder="Enter 6-digit code"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              className="text-center tracking-wider text-lg"
            />
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={loading || !totpCode.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
