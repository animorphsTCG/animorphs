
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/modules/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Shield } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface AdminProfileButtonProps {
  onAuthenticated: () => void;
}

const ADMIN_PASSWORD = "Adanacia23.";
const ADMIN_EMAIL = "adanacia23d@gmail.com";

const AdminProfileButton: React.FC<AdminProfileButtonProps> = ({ onAuthenticated }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const { user } = useAuth();

  const handleAdminLogin = async () => {
    if (password !== ADMIN_PASSWORD) {
      toast({
        title: "Authentication Failed",
        description: "Invalid admin password",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Admin Access Granted",
      description: "Welcome to the admin dashboard"
    });
    
    setIsDialogOpen(false);
    if (onAuthenticated) {
      onAuthenticated();
    }
  };

  // Only show the button if the user is the admin
  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return null;
  }

  return (
    <>
      <Button 
        onClick={() => setIsDialogOpen(true)}
        className="gap-2"
        variant="outline"
      >
        <Shield className="h-4 w-4" />
        Admin Panel
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Access Required</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAdminLogin();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdminLogin}>Login</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminProfileButton;
