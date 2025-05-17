
import { useState, useCallback } from 'react';
import { d1Worker } from '@/lib/cloudflare/d1Worker';
import { useAuth } from '@/modules/auth';

export interface AdminStatus {
  isAdmin: boolean;
  lastChecked: string | null;
}

export function useAdminStatus() {
  const { user, token } = useAuth();
  const [status, setStatus] = useState<AdminStatus>({ isAdmin: false, lastChecked: null });
  const [loading, setLoading] = useState(false);

  const checkAdminStatus = useCallback(async () => {
    if (!user?.id || !token?.access_token) {
      setStatus({ isAdmin: false, lastChecked: new Date().toISOString() });
      return false;
    }

    try {
      setLoading(true);
      
      const profile = await d1Worker.query(
        'SELECT is_admin FROM profiles WHERE id = ?',
        { params: [user.id] },
        token.access_token
      );
      
      const isAdmin = profile?.length > 0 && Boolean(profile[0]?.is_admin);
      
      setStatus({
        isAdmin,
        lastChecked: new Date().toISOString()
      });
      
      return isAdmin;
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  return {
    isAdmin: status.isAdmin,
    lastChecked: status.lastChecked,
    loading,
    checkAdminStatus
  };
}

export function useAdminAuth() {
  const { token } = useAuth();
  const { checkAdminStatus } = useAdminStatus();
  const [loading, setLoading] = useState(false);

  const authenticateAdmin = useCallback(async (totpCode: string) => {
    if (!token?.access_token || !totpCode) return false;

    try {
      setLoading(true);
      
      // Call the admin authentication endpoint
      const response = await fetch('/api/admin/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.access_token}`
        },
        body: JSON.stringify({ totpCode })
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }
      
      // Refresh admin status after successful authentication
      const isAdmin = await checkAdminStatus();
      return isAdmin;
    } catch (error) {
      console.error("Admin authentication error:", error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [token, checkAdminStatus]);

  return {
    authenticateAdmin,
    loading
  };
}
