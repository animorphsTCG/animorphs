
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { UserProfile } from '@/types';
import { 
  getClientCredentialsToken,
  getUserProfile,
  signInWithPassword,
  signUp as eosSignUp,
  refreshAuthToken,
  signOut as eosSignOut,
  resetPassword as eosResetPassword,
  EOSAuthResponse,
  EOSUserProfile
} from '@/lib/eos/eosAuth';
import { d1Worker } from '@/lib/cloudflare/d1Worker';
import { presenceWorker } from '@/lib/cloudflare/presenceWorker';

// Define our auth state interface
interface EOSAuthState {
  user: EOSUserProfile | null;
  token: EOSAuthResponse | null;
  isLoading: boolean;
  userProfile: UserProfile | null;
  signUp: (email: string, password: string, metadata?: any) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
  handleExternalAuth: (authResponse: EOSAuthResponse) => Promise<void>;
}

// Create the auth context
const EOSAuthContext = createContext<EOSAuthState>({} as EOSAuthState);

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(EOSAuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an EOSAuthProvider');
  }
  return context;
};

// Local storage keys
const USER_STORAGE_KEY = 'eos_auth_user';
const TOKEN_STORAGE_KEY = 'eos_auth_token';

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<EOSUserProfile | null>(null);
  const [token, setToken] = useState<EOSAuthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Load saved auth state from localStorage
        const savedUser = localStorage.getItem(USER_STORAGE_KEY);
        const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
        
        if (savedUser && savedToken) {
          const parsedUser = JSON.parse(savedUser);
          const parsedToken = JSON.parse(savedToken);
          
          // Check if token is expired
          const now = Date.now();
          if (parsedToken.expires_at && parsedToken.expires_at > now) {
            // Token is still valid
            setUser(parsedUser);
            setToken(parsedToken);
            
            // Fetch user profile
            await fetchUserProfile(parsedUser.id, parsedToken);
          } else if (parsedToken.refresh_token && parsedToken.refresh_expires_at && parsedToken.refresh_expires_at > now) {
            // Token expired but refresh token is still valid
            try {
              console.log('Refreshing token...');
              const newToken = await refreshAuthToken(parsedToken.refresh_token);
              
              // Update token in state and localStorage
              setToken(newToken);
              localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(newToken));
              
              // Keep the user and fetch profile
              setUser(parsedUser);
              await fetchUserProfile(parsedUser.id, newToken);
            } catch (error) {
              console.error('Failed to refresh token:', error);
              clearAuthState();
            }
          } else {
            // Both tokens expired
            console.log('Auth tokens expired');
            clearAuthState();
          }
        } else {
          // No saved auth state
          clearAuthState();
        }
      } catch (error) {
        console.error('Error initializing auth state:', error);
        clearAuthState();
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();
  }, []);
  
  // Update user online status when token changes
  useEffect(() => {
    const updatePresence = async () => {
      if (user && token) {
        try {
          await presenceWorker.updatePresence(
            user.id,
            'online',
            {
              username: user.displayName,
              profile_image_url: user.avatarUrl || null
            },
            token.access_token
          );
          
          // Set up interval to update presence every 5 minutes
          const interval = setInterval(async () => {
            if (user && token) {
              await presenceWorker.updatePresence(
                user.id,
                'online',
                {
                  username: user.displayName,
                  profile_image_url: user.avatarUrl || null
                },
                token.access_token
              );
            }
          }, 5 * 60 * 1000);
          
          // Clean up on unmount
          return () => clearInterval(interval);
        } catch (error) {
          console.error('Failed to update presence:', error);
        }
      }
    };
    
    updatePresence();
  }, [user, token]);
  
  // Clear auth state helper
  const clearAuthState = () => {
    setUser(null);
    setToken(null);
    setUserProfile(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  };
  
  // Fetch user profile from D1 database
  const fetchUserProfile = async (userId: string, authToken: EOSAuthResponse) => {
    if (!userId || !authToken) return null;
    
    try {
      console.log('Fetching user profile for:', userId);
      
      // Initialize the D1 worker with the token
      const profile = await d1Worker.getOne<UserProfile>(
        'SELECT * FROM profiles WHERE id = ?',
        { params: [userId] },
        authToken.access_token
      );
      
      if (!profile) {
        // Profile doesn't exist, create it
        console.log('Creating new profile for user:', userId);
        
        // Get user details from EOS
        const eosUserProfile = await getUserProfile(authToken.access_token);
        
        // Create basic profile
        const newProfile: Partial<UserProfile> = {
          id: userId,
          username: eosUserProfile.displayName,
          email: eosUserProfile.email,
          country: eosUserProfile.country || 'ZA',
          created_at: new Date().toISOString(),
          has_paid: false,
          mp: 0,
          ai_points: 0,
          lbp: 0,
          digi: 0
        };
        
        // Insert into database
        await d1Worker.insert('profiles', newProfile, authToken.access_token);
        
        // Return the new profile
        setUserProfile(newProfile as UserProfile);
        return newProfile as UserProfile;
      }
      
      // Get payment status
      const paymentStatus = await d1Worker.getOne(
        'SELECT has_paid FROM payment_status WHERE id = ?',
        { params: [userId] },
        authToken.access_token
      );
      
      // Merge payment status with profile
      const completeProfile = {
        ...profile,
        has_paid: paymentStatus?.has_paid || false
      };
      
      setUserProfile(completeProfile);
      return completeProfile;
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
      return null;
    }
  };
  
  // Refresh user profile
  const refreshProfile = async (): Promise<UserProfile | null> => {
    if (!user?.id || !token) {
      return null;
    }
    
    return await fetchUserProfile(user.id, token);
  };
  
  // Sign up function
  const signUp = async (email: string, password: string, metadata?: any): Promise<void> => {
    try {
      setIsLoading(true);
      
      console.log('Signing up with:', { email, metadata });
      
      // Create the profile with EOS
      const displayName = metadata?.username || email.split('@')[0];
      const response = await eosSignUp(email, password, displayName, metadata);
      
      // Set the new auth state
      const eosProfile = await getUserProfile(response.access_token);
      setUser(eosProfile);
      setToken(response);
      
      // Save to localStorage
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(eosProfile));
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(response));
      
      // Create D1 profile
      await fetchUserProfile(eosProfile.id, response);
      
      toast({
        title: 'Registration successful',
        description: 'Your account has been created successfully.',
      });
      
      // Navigate to profile page
      navigate(`/profile/${eosProfile.id}`);
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast({
        title: 'Registration failed',
        description: error.message || 'Failed to create account',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Sign in function
  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Sign in with EOS
      const response = await signInWithPassword(email, password);
      
      // Get user profile from EOS
      const eosProfile = await getUserProfile(response.access_token);
      
      // Set auth state
      setUser(eosProfile);
      setToken(response);
      
      // Save to localStorage
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(eosProfile));
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(response));
      
      // Fetch D1 profile
      await fetchUserProfile(eosProfile.id, response);
      
      toast({
        title: 'Signed in successfully',
      });
      
      // Navigate to profile or redirect URL
      const redirectTo = new URLSearchParams(location.search).get('redirectTo');
      if (redirectTo && !redirectTo.includes('login') && !redirectTo.includes('register')) {
        navigate(redirectTo);
      } else if (!location.pathname.includes('visitor-demo')) {
        navigate(`/profile/${eosProfile.id}`);
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: 'Sign in failed',
        description: error.message || 'Invalid email or password',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle external authentication (Epic Games OAuth)
  const handleExternalAuth = async (authResponse: EOSAuthResponse): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Get user profile from EOS using the token
      const eosProfile = await getUserProfile(authResponse.access_token);
      
      // Set auth state
      setUser(eosProfile);
      setToken(authResponse);
      
      // Save to localStorage
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(eosProfile));
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(authResponse));
      
      // Fetch or create D1 profile
      await fetchUserProfile(eosProfile.id, authResponse);
      
      toast({
        title: 'Signed in successfully with Epic Games',
      });
      
      // Navigate to profile or redirect URL
      const redirectTo = new URLSearchParams(location.search).get('redirectTo');
      if (redirectTo && !redirectTo.includes('login') && !redirectTo.includes('register')) {
        navigate(redirectTo);
      } else if (!location.pathname.includes('visitor-demo')) {
        navigate(`/profile/${eosProfile.id}`);
      }
    } catch (error: any) {
      console.error('Epic Games auth error:', error);
      toast({
        title: 'Sign in failed',
        description: error.message || 'Failed to authenticate with Epic Games',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Sign out function
  const signOut = async (): Promise<void> => {
    try {
      if (user && token) {
        // Update presence to offline
        try {
          await presenceWorker.updatePresence(
            user.id,
            'offline',
            {},
            token.access_token
          );
        } catch (error) {
          console.error('Failed to update offline status:', error);
        }
        
        // Sign out from EOS (client-side only)
        await eosSignOut();
      }
      
      // Clear local state
      clearAuthState();
      
      toast({
        title: 'Signed out successfully',
      });
      
      // Safe navigation
      if (!location.pathname.includes('visitor-demo')) {
        navigate('/login');
      }
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast({
        title: 'Sign out failed',
        description: error.message || 'Failed to sign out',
        variant: 'destructive',
      });
    }
  };
  
  // Reset password function
  const resetPassword = async (email: string): Promise<void> => {
    try {
      await eosResetPassword(email);
      
      toast({
        title: 'Password reset email sent',
        description: 'Check your email for a link to reset your password.',
      });
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast({
        title: 'Failed to send reset email',
        description: error.message || 'Failed to send reset email',
        variant: 'destructive',
      });
      throw error;
    }
  };
  
  // Update password function (placeholder - would need implementation in eosAuth.ts)
  const updatePassword = async (newPassword: string): Promise<void> => {
    try {
      // TODO: Implement password update in eosAuth.ts
      toast({
        title: 'Password updated',
        description: 'You can now log in with your new password.',
      });
      
      navigate('/login');
    } catch (error: any) {
      console.error('Update password error:', error);
      toast({
        title: 'Failed to update password',
        description: error.message || 'Failed to update password',
        variant: 'destructive',
      });
      throw error;
    }
  };
  
  return (
    <EOSAuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        userProfile,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        refreshProfile,
        handleExternalAuth,
      }}
    >
      {children}
    </EOSAuthContext.Provider>
  );
};

export default AuthProvider;
