import { useState, useCallback } from 'react';
import { d1Worker } from '@/lib/cloudflare/d1Worker';
import { useAuth } from '@/modules/auth';

export function useAdminAuth() {
  const { user, token } = useAuth();
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
      
      return true;
    } catch (error) {
      console.error("Admin authentication error:", error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [token]);

  return {
    authenticateAdmin,
    loading,
    token
  };
}
