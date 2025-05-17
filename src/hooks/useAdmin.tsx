
import { useEffect, useState } from 'react';
import { useAuth } from '@/modules/auth';

export const useAdmin = () => {
  const { userProfile } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  
  useEffect(() => {
    if (userProfile) {
      setIsAdmin(!!userProfile.is_admin);
      setAdminToken(userProfile.is_admin ? localStorage.getItem('admin_token') : null);
      setIsLoading(false);
    } else {
      setIsAdmin(false);
      setAdminToken(null);
      setIsLoading(false);
    }
  }, [userProfile]);
  
  return { isAdmin, isLoading, adminToken };
};

// Also export as default for backward compatibility
export default useAdmin;
