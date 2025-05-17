
import { useEffect, useState } from 'react';
import { useAuth } from '@/modules/auth';

const useAdmin = () => {
  const { userProfile } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    if (userProfile) {
      setIsAdmin(!!userProfile.is_admin);
    } else {
      setIsAdmin(false);
    }
  }, [userProfile]);
  
  return { isAdmin };
};

export default useAdmin;
