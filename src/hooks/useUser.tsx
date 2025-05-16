
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/modules/auth';

interface UserData {
  id: string;
  username: string;
  email?: string;
  name?: string;
  surname?: string;
  country?: string;
  created_at: string;
  has_paid?: boolean;
  music_subscription?: {
    subscription_type: string;
    end_date: string;
  } | null;
}

export const useUser = (userId?: string) => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const targetId = userId || user?.id;
        
        if (!targetId) {
          setLoading(false);
          setError("No user ID provided");
          return;
        }
        
        // Creating placeholder data since this is a stub
        // In the real implementation, we'd get this data from D1/EOS
        const placeholderUserData: UserData = {
          id: targetId,
          username: 'User-' + targetId.substring(0, 5),
          email: user?.email || undefined,
          created_at: new Date().toISOString(),
          has_paid: false,
          music_subscription: null
        };
        
        setUserData(placeholderUserData);
        console.log("Stub useUser hook returned placeholder data");
        
      } catch (error: any) {
        console.error("Error in useUser hook:", error);
        setError(error.message || "Failed to load user data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId, user]);
  
  return { userData, loading, error };
};

export default useUser;
