
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Session, User } from '../types';
import { d1Worker } from '@/lib/cloudflare/d1Worker';

// Define the UserProfile interface
interface UserProfile {
  id: string;
  username: string;
  email?: string;
  name?: string;
  surname?: string;
  country?: string;
  created_at: string;
  has_paid?: boolean;
  is_admin?: boolean;
}

interface AuthState {
  user: User | null;
  token: {access_token: string} | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signUp: (email: string, password: string, metadata?: any) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  token: null,
  userProfile: null,
  isLoading: true,
  error: null,
  signIn: async () => {},
  signOut: async () => {},
  refreshToken: async () => {},
  refreshProfile: async () => {},
  signUp: async () => {},
  resetPassword: async () => {},
  updatePassword: async () => {},
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<{access_token: string} | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile
  const fetchUserProfile = async (userId: string) => {
    try {
      if (!token?.access_token) return null;
      
      // Get basic profile
      const profile = await d1Worker.getOne(
        'SELECT * FROM profiles WHERE id = ?',
        { params: [userId] },
        token.access_token
      );
      
      if (!profile) return null;
      
      // Get payment status
      const paymentStatus = await d1Worker.getOne(
        'SELECT * FROM payment_status WHERE user_id = ?',
        { params: [userId] },
        token.access_token
      );
      
      // Create a valid profile object
      const profileData: UserProfile = {
        id: profile.id,
        username: profile.username || `User-${profile.id.substring(0, 5)}`,
        email: profile.email || user?.email || '',
        name: profile.name || '',
        surname: profile.surname || '',
        country: profile.country || '',
        created_at: profile.created_at || new Date().toISOString(),
        has_paid: paymentStatus ? !!paymentStatus.has_paid : false,
        is_admin: !!profile.is_admin
      };
      
      setUserProfile(profileData);
      return profileData;
    } catch (err) {
      console.error("Error fetching user profile:", err);
      return null;
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (user?.id && token?.access_token) {
      await fetchUserProfile(user.id);
    }
  };

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        // For development/migration purposes, we're using localStorage
        // In production, this would integrate with EOS SDK
        const storedUser = localStorage.getItem('eos_user');
        const storedToken = localStorage.getItem('eos_token');
        
        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setToken({ access_token: storedToken });
          
          if (parsedUser.id) {
            await fetchUserProfile(parsedUser.id);
          }
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
      
      // Create basic profile if necessary
      await fetchUserProfile(mockUser.id);
      
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
      setUserProfile(null);
      
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
  
  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // In production this would call the EOS signup API
      // For now, we'll simulate it
      const displayName = metadata?.name || email.split('@')[0];
      
      // Call the API stub
      await signUpApi(email, password, displayName, metadata);
      
      toast({
        title: "Registration successful",
        description: "Please check your email to verify your account.",
      });
      
    } catch (err: any) {
      console.error('Registration failed:', err);
      setError(err.message || 'Registration failed');
      
      toast({
        title: "Registration failed",
        description: err.message || 'Failed to register',
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // In production this would call the EOS password reset API
      // For now, we'll simulate it
      await resetPasswordApi(email);
      
      toast({
        title: "Password reset email sent",
        description: "Please check your email to reset your password.",
      });
      
    } catch (err: any) {
      console.error('Password reset failed:', err);
      setError(err.message || 'Password reset failed');
      
      toast({
        title: "Password reset failed",
        description: err.message || 'Failed to send password reset email',
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const updatePassword = async (password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // In production this would call the EOS password update API
      // For now, we'll just show a success message
      
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
      
    } catch (err: any) {
      console.error('Password update failed:', err);
      setError(err.message || 'Password update failed');
      
      toast({
        title: "Password update failed",
        description: err.message || 'Failed to update password',
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        userProfile,
        isLoading,
        error,
        signIn,
        signOut,
        refreshToken,
        refreshProfile,
        signUp,
        resetPassword,
        updatePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
