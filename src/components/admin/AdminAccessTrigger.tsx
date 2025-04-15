
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";

/**
 * Hidden admin panel access trigger component
 * Listens for Ctrl+Alt+"admin" key combination and shows login dialog
 */
const AdminAccessTrigger: React.FC = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [keyBuffer, setKeyBuffer] = useState('');
  const [keysPressed, setKeysPressed] = useState({
    ctrl: false,
    alt: false
  });
  
  const navigate = useNavigate();

  // Listen for key combinations
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Update pressed modifier keys state
      if (event.key === 'Control') {
        setKeysPressed(prev => ({ ...prev, ctrl: true }));
      }
      if (event.key === 'Alt') {
        setKeysPressed(prev => ({ ...prev, alt: true }));
      }
      
      // If both modifiers are pressed, start capturing typed keys
      if (keysPressed.ctrl && keysPressed.alt) {
        // Don't add modifier keys to the buffer
        if (event.key !== 'Control' && event.key !== 'Alt') {
          setKeyBuffer(prev => prev + event.key);
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      // Update released modifier keys state
      if (event.key === 'Control') {
        setKeysPressed(prev => ({ ...prev, ctrl: false }));
      }
      if (event.key === 'Alt') {
        setKeysPressed(prev => ({ ...prev, alt: false }));
      }
      
      // If modifiers are released, check buffer
      if (event.key === 'Alt' || event.key === 'Control') {
        if (keyBuffer.toLowerCase().includes('admin')) {
          setIsLoginOpen(true);
          setKeyBuffer('');
        }
        
        // Reset buffer if the combination wasn't completed
        setTimeout(() => {
          setKeyBuffer('');
        }, 2000);
      }
    };

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Clean up listeners
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [keysPressed, keyBuffer]);

  const handleLogin = () => {
    if (password === 'Adanacia23.') {
      setIsLoginOpen(false);
      setPassword('');
      navigate('/admin');
    } else {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Incorrect password."
      });
    }
  };

  return (
    <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Strictly for Admin only use</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleLogin();
              }
            }}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsLoginOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLogin}>
              Login
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminAccessTrigger;
