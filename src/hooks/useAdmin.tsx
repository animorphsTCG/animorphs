import { useEffect, useState } from 'react';
import { useAuth } from '@/modules/auth'; 
import { d1Worker } from '@/lib/cloudflare/d1Worker';

export const useAdmin = () => {
  const { user, token } = useAuth();
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
          await d1Worker.update(
            'profiles',
            { is_admin: true },
            'id = ?',
            [user.id],
            token.access_token
          );
          
          setIsAdmin(true);
          setLoading(false);
          return;
        }
        
        // Otherwise, check the database for admin status
        console.log("Checking database for admin status");
        const profileData = await d1Worker.getOne(
          'SELECT is_admin FROM profiles WHERE id = ?',
          { params: [user.id] },
          token.access_token
        );

        if (!profileData) {
          throw new Error("Profile not found");
        }
        
        console.log("Admin check result:", profileData);
        setIsAdmin(!!profileData?.is_admin); // Convert to boolean
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
