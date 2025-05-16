
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Session, User } from '../types';
import { d1Worker } from '@/lib/cloudflare/d1Worker';
import { UserProfile } from '@/types';

interface AuthState {
  user: User | null;
  token: {access_token: string} | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  token: null,
  isLoading: true,
  error: null,
  signIn: async () => {},
  signOut: async () => {},
  refreshToken: async () => {},
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<{access_token: string} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        // For development/migration purposes, we're using localStorage
        // In production, this would integrate with EOS SDK
        const storedUser = localStorage.getItem('eos_user');
        const storedToken = localStorage.getItem('eos_token');
        
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setToken({ access_token: storedToken });
        }
      } catch (err) {
        console.error('Failed to check session:', err);
        setError('Failed to check authentication status');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // In production, this would be an actual EOS authentication call
      // For migration purposes, we're just simulating a successful login
      
      // Check if a user exists with that email in D1 (mock auth)
      const mockToken = `eos_mock_token_${Date.now()}`;
      
      const mockUser = {
        id: `user_${Date.now()}`,
        email,
        displayName: email.split('@')[0]
      };
      
      // Store in localStorage (temporary for development)
      localStorage.setItem('eos_user', JSON.stringify(mockUser));
      localStorage.setItem('eos_token', mockToken);
      
      setUser(mockUser);
      setToken({ access_token: mockToken });
      
      toast({
        title: "Success",
        description: "You are now signed in",
      });
      
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.message || 'Authentication failed');
      
      toast({
        title: "Authentication failed",
        description: err.message || 'Failed to sign in',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const signOut = async () => {
    try {
      setIsLoading(true);
      
      // Clear local storage
      localStorage.removeItem('eos_user');
      localStorage.removeItem('eos_token');
      
      // Reset state
      setUser(null);
      setToken(null);
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out",
      });
    } catch (err: any) {
      console.error('Sign out failed:', err);
      setError(err.message || 'Failed to sign out');
      
      toast({
        title: "Error",
        description: err.message || 'Failed to sign out',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      setIsLoading(true);
      
      // In production, this would be an actual EOS token refresh
      // For migration purposes, we're just simulating a successful refresh
      if (token) {
        const newToken = `eos_refreshed_token_${Date.now()}`;
        
        // Update localStorage
        localStorage.setItem('eos_token', newToken);
        
        // Update state
        setToken({ access_token: newToken });
      }
    } catch (err: any) {
      console.error('Token refresh failed:', err);
      setError(err.message || 'Failed to refresh authentication');
      
      // If token refresh fails, sign the user out
      await signOut();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        error,
        signIn,
        signOut,
        refreshToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
