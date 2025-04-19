
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
        
        // Get profile data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', targetId)
          .single();
          
        if (profileError) {
          console.error("Error fetching user profile:", profileError);
          throw new Error("Could not load user profile");
        }
        
        // Get user email
        const { data: emailData, error: emailError } = await supabase
          .rpc('get_user_emails');
          
        if (emailError) {
          console.error("Error fetching user email:", emailError);
          throw new Error("Could not load user email");
        }
        
        const userEmail = emailData.find(item => item.id === targetId);
        
        // Get payment status
        const { data: paymentData, error: paymentError } = await supabase
          .from('payment_status')
          .select('*')
          .eq('id', targetId)
          .maybeSingle();
          
        if (paymentError) {
          console.error("Error fetching payment status:", paymentError);
          throw new Error("Could not load payment status");
        }
        
        // Get music subscription
        const { data: musicSub, error: musicError } = await supabase
          .from('music_subscriptions')
          .select('*')
          .eq('user_id', targetId)
          .maybeSingle();
          
        if (musicError) {
          console.error("Error fetching music subscription:", musicError);
          throw new Error("Could not load music subscription");
        }
        
        // Combine data
        setUserData({
          ...profile,
          email: userEmail?.email,
          has_paid: paymentData?.has_paid || false,
          music_subscription: musicSub || null
        });
        
      } catch (error) {
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
