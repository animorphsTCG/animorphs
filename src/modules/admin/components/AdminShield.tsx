
import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/modules/auth';
import AdminAuthModal from './AdminAuthModal';
import { toast } from '@/components/ui/use-toast';

/**
 * AdminShield - Floating shield icon for admin authentication
 * 
 * Displayed at the top-right of the screen to trigger admin authentication
 */
const AdminShield: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    // Check if user is an admin when user changes
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      
      try {
        const { data: profile } = await fetch('/api/check-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
          credentials: 'include'
        }).then(res => res.json());
        
        setIsAdmin(profile?.is_admin || false);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };
    
    checkAdminStatus();
  }, [user]);
  
  const handleOpenModal = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in first to access admin features",
        variant: "destructive",
      });
      return;
    }
    
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant={isAdmin ? "default" : "outline"}
          size="icon"
          className={`rounded-full ${isAdmin ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-800/50 backdrop-blur-sm'}`}
          onClick={handleOpenModal}
          title="Admin Authentication"
        >
          <Shield className={`h-5 w-5 ${isAdmin ? 'text-white' : 'text-slate-300'}`} />
        </Button>
      </div>
      
      {isModalOpen && (
        <AdminAuthModal 
          isOpen={isModalOpen} 
          onClose={handleCloseModal}
          onSuccess={() => setIsAdmin(true)}
        />
      )}
    </>
  );
};

export default AdminShield;
