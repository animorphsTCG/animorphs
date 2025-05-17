
import { useEffect, useState } from 'react';
import { useAuth } from '@/modules/auth';

export const useAdmin = () => {
  const { userProfile } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (userProfile) {
      setIsAdmin(!!userProfile.is_admin);
      setIsLoading(false);
    } else {
      setIsAdmin(false);
      setIsLoading(false);
    }
  }, [userProfile]);
  
  return { isAdmin, isLoading };
};

// Also export as default for backward compatibility
export default useAdmin;
