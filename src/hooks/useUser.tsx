
import { useState, useEffect } from 'react';
import { useAuth } from '@/modules/auth';
import { d1Worker } from '@/lib/cloudflare/d1Worker';

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
  const { user, token } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const targetId = userId || user?.id;
        
        if (!targetId || !token?.access_token) {
          setLoading(false);
          setError("No user ID provided or not authenticated");
          return;
        }
        
        // Get user profile from D1
        const profile = await d1Worker.getOne(
          'SELECT * FROM profiles WHERE id = ?',
          { params: [targetId] },
          token.access_token
        );
        
        if (!profile) {
          setLoading(false);
          setError("User not found");
          return;
        }
        
        // Get payment status
        const paymentStatus = await d1Worker.getOne(
          'SELECT has_paid FROM payment_status WHERE user_id = ?',
          { params: [targetId] },
          token.access_token
        );
        
        // Get music subscription if any
        const musicSubscription = await d1Worker.getOne(
          'SELECT subscription_type, end_date FROM music_subscriptions WHERE user_id = ? AND end_date > NOW()',
          { params: [targetId] },
          token.access_token
        );
        
        const userData: UserData = {
          id: targetId,
          username: profile.username || 'User-' + targetId.substring(0, 5),
          email: profile.email || user?.email,
          name: profile.name,
          surname: profile.surname,
          country: profile.country,
          created_at: profile.created_at || new Date().toISOString(),
          has_paid: paymentStatus?.has_paid || false,
          music_subscription: musicSubscription || null
        };
        
        setUserData(userData);
        
      } catch (error: any) {
        console.error("Error in useUser hook:", error);
        setError(error.message || "Failed to load user data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId, user, token]);
  
  return { userData, loading, error };
};

export default useUser;
