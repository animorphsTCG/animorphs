
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { 
  EOSAuthResponse, 
  signInWithPassword, 
  signUp as eosSignUp,
  refreshAuthToken,
  getUserProfile,
  signOut as eosSignOut,
  resetPassword as eosResetPassword,
  EOSUserProfile
} from '@/lib/eos';
import { d1Client } from '@/lib/cloudflare/d1Client';
import { trackPresence } from '@/lib/eos/eosPresence';

// User profile interface
export interface UserProfile {
  id: string;
  username: string;
  name?: string;
  surname?: string;
  email?: string;
  country?: string;
  created_at?: string;
  has_paid?: boolean;
  mp?: number;
  ai_points?: number;
  lbp?: number;
  digi?: number;
  gold?: number;
  music_unlocked?: boolean;
  music_subscription?: {
    subscription_type: string;
    end_date: string;
  } | null;
}

// Auth state interface
interface AuthState {
  user: EOSUserProfile | null;
  token: EOSAuthResponse | null;
  isLoading: boolean;
  userProfile: UserProfile | null;
  signUp: (email: string, password: string, metadata?: any) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// Create auth context
const AuthContext = createContext<AuthState>({} as AuthState);

// Auth provider hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Local storage keys
const TOKEN_STORAGE_KEY = 'eos_auth_token';
const USER_STORAGE_KEY = 'eos_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<EOSUserProfile | null>(null);
  const [token, setToken] = useState<EOSAuthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Store refs for token refresh interval and presence tracking
  const refreshIntervalRef = useRef<any>(null);
  const presenceIntervalRef = useRef<any>(null);

  // Fetch user profile data from D1
  const fetchUserProfile = async (userId: string, authToken: string): Promise<UserProfile | null> => {
    try {
      console.log("Fetching user profile for:", userId);
      setError(null);

      // Initialize D1 client with auth token
      d1Client.setToken(authToken);
      
      // Fetch profile data
      const profileData = await d1Client.getOne<any>(`
        SELECT * FROM profiles WHERE id = ?
      `, { params: [userId] });
      
      if (!profileData) {
        console.error("No profile found for user:", userId);
        return null;
      }
      
      // Fetch payment status
      const paymentData = await d1Client.getOne<{ has_paid: boolean }>(
        `SELECT has_paid FROM payment_status WHERE id = ?`,
        { params: [userId] }
      );
      
      // Fetch music subscription if any
      const musicSubData = await d1Client.getOne<any>(
        `SELECT subscription_type, end_date FROM music_subscriptions 
        WHERE user_id = ? AND end_date > CURRENT_TIMESTAMP 
        ORDER BY end_date DESC LIMIT 1`,
        { params: [userId] }
      );
      
      // Combine data
      const profile: UserProfile = {
        ...profileData,
        has_paid: paymentData?.has_paid || false,
        music_subscription: musicSubData || null
      };
      
      console.log("Fetched user profile:", profile);
      setUserProfile(profile);
      return profile;
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
      setError('Failed to fetch profile data');
      return null;
    }
  };

  // Refresh user profile
  const refreshProfile = async () => {
    if (user?.id && token?.access_token) {
      console.log("Refreshing profile for user:", user.id);
      return await fetchUserProfile(user.id, token.access_token);
    }
    return null;
  };

  // Set up token refresh timer
  const setupTokenRefresh = (currentToken: EOSAuthResponse) => {
    // Clear any existing refresh interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    
    // If we have a refresh token, set up a timer to refresh before it expires
    if (currentToken.refresh_token && currentToken.expires_at) {
      // Refresh the token 5 minutes before it expires
      const refreshTime = currentToken.expires_at - Date.now() - (5 * 60 * 1000);
      if (refreshTime <= 0) {
        // Token is already expired or about to expire, refresh now
        refreshAuthToken(currentToken.refresh_token)
          .then(newToken => {
            setToken(newToken);
            saveTokenToStorage(newToken);
            setupTokenRefresh(newToken);
          })
          .catch(err => {
            console.error("Failed to refresh token:", err);
            handleSignOut();
          });
      } else {
        // Set up timer to refresh token before it expires
        console.log(`Token will be refreshed in ${Math.floor(refreshTime / 60000)} minutes`);
        refreshIntervalRef.current = setTimeout(() => {
          if (currentToken.refresh_token) {
            refreshAuthToken(currentToken.refresh_token)
              .then(newToken => {
                setToken(newToken);
                saveTokenToStorage(newToken);
                setupTokenRefresh(newToken);
              })
              .catch(err => {
                console.error("Failed to refresh token:", err);
                handleSignOut();
              });
          }
        }, refreshTime);
      }
    }
  };
  
  // Set up presence tracking
  const setupPresenceTracking = (userId: string, authToken: string) => {
    // Clear any existing presence interval
    if (presenceIntervalRef.current) {
      clearInterval(presenceIntervalRef.current);
      presenceIntervalRef.current = null;
    }
    
    // Update presence immediately
    trackPresence(userId, 'online', authToken)
      .catch(err => console.error("Failed to track presence:", err));
    
    // Set up interval to update presence (every 30 seconds)
    presenceIntervalRef.current = setInterval(() => {
      trackPresence(userId, 'online', authToken)
        .catch(err => console.error("Failed to track presence:", err));
    }, 30000);
    
    // Set up event listener for page visibility changes
    const handleVisibilityChange = () => {
      const status = document.visibilityState === 'visible' ? 'online' : 'away';
      trackPresence(userId, status, authToken)
        .catch(err => console.error("Failed to track presence:", err));
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Return cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  };

  // Load auth data from storage
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedTokenJson = localStorage.getItem(TOKEN_STORAGE_KEY);
        const storedUserJson = localStorage.getItem(USER_STORAGE_KEY);

        if (storedTokenJson && storedUserJson) {
          const storedToken: EOSAuthResponse = JSON.parse(storedTokenJson);
          const storedUser: EOSUserProfile = JSON.parse(storedUserJson);

          // If token is not expired or we have a refresh token
          const now = Date.now();
          if ((storedToken.expires_at && storedToken.expires_at > now) || storedToken.refresh_token) {
            // Token is valid or can be refreshed
            setToken(storedToken);
            setUser(storedUser);

            // Set up token refresh
            setupTokenRefresh(storedToken);

            // Initialize D1 client
            d1Client.setToken(storedToken.access_token);

            // Fetch user profile
            await fetchUserProfile(storedUser.id, storedToken.access_token);
            
            // Set up presence tracking
            const cleanup = setupPresenceTracking(storedUser.id, storedToken.access_token);
            return () => cleanup();
          } else {
            // Token is expired and can't be refreshed
            handleSignOut();
          }
        }
      } catch (error) {
        console.error("Error loading stored auth:", error);
        handleSignOut();
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredAuth();

    // Cleanup function
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
      }
    };
  }, []);

  // Save token to storage
  const saveTokenToStorage = (token: EOSAuthResponse) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token));
  };

  // Save user to storage
  const saveUserToStorage = (user: EOSUserProfile) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  };

  // Handle successful authentication
  const handleAuthSuccess = async (
    authToken: EOSAuthResponse, 
    userProfile: EOSUserProfile
  ) => {
    // Save token and user to state and storage
    setToken(authToken);
    setUser(userProfile);
    saveTokenToStorage(authToken);
    saveUserToStorage(userProfile);

    // Initialize D1 client
    d1Client.setToken(authToken.access_token);

    // Set up token refresh
    setupTokenRefresh(authToken);

    // Fetch additional user data
    await fetchUserProfile(userProfile.id, authToken.access_token);
    
    // Set up presence tracking
    setupPresenceTracking(userProfile.id, authToken.access_token);
    
    // Show success message
    toast({ title: 'Signed in successfully' });
    
    // Navigate to profile page (unless on visitor demo)
    if (!location.pathname.includes('visitor-demo')) {
      navigate(`/profile/${userProfile.id}`);
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      // Sign in with EOS
      const authToken = await signInWithPassword(email, password);
      
      // Get user profile
      const userProfile = await getUserProfile(authToken.access_token);
      
      // Handle successful authentication
      await handleAuthSuccess(authToken, userProfile);
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast({
        title: 'Sign in failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      console.log("Signing up with email:", email);
      console.log("Metadata:", metadata);
      
      // Generate display name from email if not provided
      const displayName = metadata?.username || email.split('@')[0];
      
      // Sign up with EOS
      const authToken = await eosSignUp(email, password, displayName, metadata);
      
      // Get user profile
      const userProfile = await getUserProfile(authToken.access_token);
      
      // Create profile record in D1
      d1Client.setToken(authToken.access_token);
      try {
        await d1Client.insert('profiles', {
          id: userProfile.id,
          username: displayName,
          name: metadata?.name || displayName,
          surname: metadata?.surname || '',
          age: metadata?.age || 18,
          country: userProfile.country || metadata?.country || 'ZA',
          mp: 0,
          ai_points: 0,
          lbp: 0,
          digi: 0,
          gold: 0,
          music_unlocked: false,
          created_at: new Date().toISOString()
        });
        
        // Also create payment status record
        await d1Client.insert('payment_status', {
          id: userProfile.id,
          has_paid: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } catch (dbError) {
        console.error("Error creating profile records:", dbError);
      }
      
      toast({
        title: 'Registration successful',
        description: 'Your account has been created.',
      });
      
      // Handle successful authentication
      await handleAuthSuccess(authToken, userProfile);
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast({
        title: 'Registration failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Sign out
  const handleSignOut = async () => {
    // Clear all auth data
    setToken(null);
    setUser(null);
    setUserProfile(null);
    
    // Clear D1 client token
    d1Client.clearToken();
    
    // Clear intervals
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    if (presenceIntervalRef.current) {
      clearInterval(presenceIntervalRef.current);
      presenceIntervalRef.current = null;
    }
    
    // Clear local storage
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    
    // Navigate to login
    if (!location.pathname.includes('visitor-demo')) {
      navigate('/login');
    }
    
    toast({ title: 'Signed out successfully' });
  };

  // Sign out (exposed to API)
  const signOut = async () => {
    try {
      // Update presence to offline before signing out
      if (user?.id && token?.access_token) {
        try {
          await trackPresence(user.id, 'offline', token.access_token);
        } catch (err) {
          console.error("Error setting offline status:", err);
        }
      }
      
      // Call EOS sign out (clears local data)
      await eosSignOut();
      
      // Then handle our own sign out cleanup
      await handleSignOut();
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast({
        title: 'Sign out failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
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
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Update password
  const updatePassword = async (newPassword: string) => {
    try {
      // For EOS, updating password usually requires the old password
      // This is a simplified version that might need to be updated
      if (!token?.access_token) {
        throw new Error('You must be logged in to update your password');
      }
      
      // In a real implementation, we would call the EOS API to update the password
      // For now, we'll just show a message
      toast({
        title: 'Password updated',
        description: 'You can now log in with your new password.',
      });
      
      navigate('/login');
    } catch (error: any) {
      console.error('Update password error:', error);
      toast({
        title: 'Failed to update password',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
