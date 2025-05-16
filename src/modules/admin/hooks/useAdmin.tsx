import { useEffect, useState } from 'react';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { d1Worker } from '@/lib/cloudflare/d1Worker';
import { toast } from '@/components/ui/use-toast';

export interface AdminStatus {
  isAdmin: boolean;
  loading: boolean;
  adminToken: string | null;
  isAuthenticated: boolean;
  error: string | null;
}

export const useAdminStatus = (): AdminStatus => {
  const { user, token } = useAuth(); // Use token instead of session from EOSAuth
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user || !token?.access_token) { // Use token?.access_token instead of session
        setIsAdmin(false);
        setLoading(false);
        setAdminToken(null);
        setIsAuthenticated(false);
        setError(null);
        return;
      }

      try {
        // Store the access token for admin API calls
        setAdminToken(token.access_token);

        // Hard-coded admin email for security (keep this for quick admin access)
        const adminEmail = 'adanacia23d@gmail.com';
        
        // First check if current user's email matches admin email
        if (user.email?.toLowerCase() === adminEmail.toLowerCase()) {
          try {
            // Check if user has admin flag in database
            const profile = await d1Worker.getOne(
              'SELECT is_admin FROM profiles WHERE id = ?', 
              { params: [user.id] },
              token.access_token
            );
            
            if (!profile || profile.is_admin !== true) {
              // Update the profile to ensure the is_admin flag is set
              await d1Worker.update(
                'profiles',
                { is_admin: true },
                'id = ?',
                [user.id],
                '',
                token.access_token
              );
            }
          } catch (dbError) {
            console.error('Error updating admin status:', dbError);
          }
          
          setIsAdmin(true);
          setLoading(false);
          return;
        }
        
        // Otherwise, check the database for admin status
        try {
          const profile = await d1Worker.getOne(
            'SELECT is_admin FROM profiles WHERE id = ?', 
            { params: [user.id] },
            token.access_token
          );
          
          setIsAdmin(profile?.is_admin || false);
        } catch (dbError) {
          console.error('Error checking admin status in database:', dbError);
          setError('Failed to check admin status');
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setError('Failed to check admin status');
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, token]); // Use token instead of session

  // Check if user has completed 2FA
  useEffect(() => {
    const checkAdminAuth = async () => {
      if (!isAdmin || !user || !token?.access_token) { // Use token?.access_token instead of session
        setIsAuthenticated(false);
        return;
      }
      
      // Check if admin has an active session
      // In a real implementation, we would verify this with the server
      // For now, just check local storage
      
      const adminAuthTime = localStorage.getItem('admin_auth_time');
      if (!adminAuthTime) {
        setIsAuthenticated(false);
        return;
      }
      
      // Check if auth is still valid (1 hour expiry)
      const authTime = parseInt(adminAuthTime);
      const now = Date.now();
      const isValid = now - authTime < 60 * 60 * 1000; // 1 hour
      
      setIsAuthenticated(isValid);
    };
    
    checkAdminAuth();
  }, [isAdmin, user, token]); // Use token instead of session

  return { 
    isAdmin, 
    loading, 
    adminToken,
    isAuthenticated,
    error
  };
};

// Hook for authenticating admin access (2FA)
export const useAdminAuth = () => {
  const { user, token } = useAuth(); // Use token instead of session from EOSAuth
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<any>(null); // Add token state
  
  // Initialize token from session
  useEffect(() => {
    if (token) {
      setToken(token);
    }
  }, [token]);
  
  const authenticateWithTOTP = async (code: string): Promise<boolean> => {
    if (!user || !token?.access_token) {
      toast({
        title: "Authentication Failed",
        description: "User session not found",
        variant: "destructive"
      });
      return false;
    }
    
    setIsAuthenticating(true);
    setError(null);
    
    try {
      // In a real implementation, we would verify with the server
      // For demo purposes, accept any 6-digit code
      const isValidFormat = /^\d{6}$/.test(code);
      
      if (isValidFormat) {
        // Set admin auth time in local storage
        localStorage.setItem('admin_auth_time', Date.now().toString());
        setIsAuthenticated(true);
        return true;
      } else {
        setError('Invalid verification code format');
        return false;
      }
    } catch (err) {
      console.error('TOTP verification error:', err);
      setError(err.message || 'Authentication failed');
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };
  
  const authenticateWithBiometric = async (): Promise<boolean> => {
    if (!user || !token?.access_token) {
      toast({
        title: "Authentication Failed",
        description: "User session not found",
        variant: "destructive"
      });
      return false;
    }
    
    setIsAuthenticating(true);
    setError(null);
    
    try {
      // In a real implementation, we would use WebAuthn
      // For demo purposes, just simulate success
      
      // Set admin auth time in local storage
      localStorage.setItem('admin_auth_time', Date.now().toString());
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      console.error('Biometric verification error:', err);
      setError(err.message || 'Authentication failed');
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };
  
  const generateBackupCodes = async (): Promise<string[]> => {
    if (!user || !token?.access_token) {
      toast({
        title: "Authentication Failed",
        description: "User session not found",
        variant: "destructive"
      });
      return [];
    }
    
    setIsAuthenticating(true);
    setError(null);
    
    try {
      // In a real implementation, we would generate from the server
      // For demo purposes, generate random codes
      const codes = Array(10).fill(0).map(() => 
        Math.random().toString(36).substring(2, 10).toUpperCase()
      );
      
      return codes;
    } catch (err) {
      console.error('Backup code generation error:', err);
      setError(err.message || 'Failed to generate backup codes');
      return [];
    } finally {
      setIsAuthenticating(false);
    }
  };
  
  return {
    authenticateWithTOTP,
    authenticateWithBiometric,
    generateBackupCodes,
    isAuthenticating,
    isAuthenticated,
    token,
    error
  };
};
