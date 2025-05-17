import { useEffect, useState } from 'react';
import { useAuth } from '@/modules/auth';
import { useAdminAuth } from './useAdminAuth';

// This is the hook that provides admin functionality
export const useAdmin = () => {
  const { user } = useAuth();
  const { loading, token } = useAdminAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  
  useEffect(() => {
    if (user) {
      setIsAdmin(!!user.is_admin);
      setAdminToken(user.is_admin ? localStorage.getItem('admin_token') : null);
      setIsLoading(false);
    } else {
      setIsAdmin(false);
      setAdminToken(null);
      setIsLoading(false);
    }
  }, [user]);
  
  return { 
    isAdmin, 
    isLoading, 
    adminToken,
    token, // Include token from useAdminAuth for MigrationPanel
    loading
  };
};

// Also export as default for backward compatibility
export default useAdmin;
