
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/modules/auth/context/AuthContext";
import { toast } from "@/components/ui/use-toast";

const ADMIN_PASSWORD = "Adanacia23.";
const ADMIN_EMAIL = "adanacia23d@gmail.com";

interface AdminAccessTriggerProps {
  onAuthenticated?: () => void;
}

const AdminAccessTrigger: React.FC<AdminAccessTriggerProps> = ({ onAuthenticated }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isKeyCombination, setIsKeyCombination] = useState(false);
  const [typedKeys, setTypedKeys] = useState("");
  const { user } = useAuth();

  // Track key states for Ctrl+Alt
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey) {
        setIsKeyCombination(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!event.ctrlKey || !event.altKey) {
        setIsKeyCombination(false);
        if (typedKeys.length > 0) {
          setTypedKeys("");
        }
      }
    };

    const handleKeyPress = (event: KeyboardEvent) => {
      if (isKeyCombination) {
        setTypedKeys(prevKeys => prevKeys + event.key);
        
        // Check if "admin" has been typed
        if ((typedKeys + event.key).toLowerCase().includes("admin")) {
          setIsDialogOpen(true);
          setTypedKeys("");
          setIsKeyCombination(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("keypress", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("keypress", handleKeyPress);
    };
  }, [isKeyCombination, typedKeys]);

  const handleAdminLogin = async () => {
    if (password !== ADMIN_PASSWORD) {
      toast({
        title: "Authentication Failed",
        description: "Invalid admin password",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to access admin functions",
        variant: "destructive"
      });
      return;
    }

    // Verify user is the admin email
    if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      toast({
        title: "Authentication Failed",
        description: "You do not have admin privileges",
        variant: "destructive"
      });
      return;
    }

    try {
      // Set the user as an admin
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Admin Access Granted",
        description: "Welcome to the admin dashboard"
      });
      
      setIsDialogOpen(false);
      if (onAuthenticated) {
        onAuthenticated();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to authenticate admin",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Strictly for Admin only use</DialogTitle>
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
  );
};

export default AdminAccessTrigger;
