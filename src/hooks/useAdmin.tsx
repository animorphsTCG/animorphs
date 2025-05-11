import { useEffect, useState } from 'react';
import { useAuth } from '@/modules/auth'; // Updated import path
import { supabase } from '@/lib/supabase';

export const useAdmin = () => {
  const { user, token } = useAuth();  // Updated to use token instead of session
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user || !token) {
        setIsAdmin(false);
        setLoading(false);
        setAdminToken(null);
        return;
      }

      try {
        setCheckError(null);
        console.log("Checking admin status for user:", user.id);
        
        // Store the access token for admin API calls
        setAdminToken(token.access_token);

        // Hard-coded admin email for security (keep this for quick admin access)
        const adminEmail = 'adanacia23d@gmail.com';
        
        // First check if current user's email matches admin email
        if (user.email?.toLowerCase() === adminEmail.toLowerCase()) {
          console.log("Admin access granted based on admin email");
          
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
        console.log("Checking database for admin status");
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Error fetching admin status:", error);
          setCheckError(error.message);
          throw error;
        }
        
        console.log("Admin check result:", data);
        setIsAdmin(data?.is_admin || false);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setCheckError("Failed to check admin status");
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, token]);

  return { isAdmin, loading, adminToken, checkError };
};

export default useAdmin;
