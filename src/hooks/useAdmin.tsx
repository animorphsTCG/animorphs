import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase';

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Hard-coded admin email for security
        const adminEmail = 'adanacia23d@gmail.com';
        
        // First check if current user's email matches admin email
        if (user.email?.toLowerCase() === adminEmail.toLowerCase()) {
          // Update the profile to ensure the is_admin flag is set
          await supabase
            .from('profiles')
            .update({ is_admin: true })
            .eq('id', user.id);
          
          setIsAdmin(true);
          setLoading(false);
          return;
        }
        
        // Otherwise, check the database for admin status
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setIsAdmin(data?.is_admin || false);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  return { isAdmin, loading };
};
