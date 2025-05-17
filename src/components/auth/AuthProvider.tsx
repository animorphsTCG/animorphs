
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { UserProfile } from '@/types';
import { getPerformanceMetrics, resetPerformanceMetrics } from '@/lib/monitoring';
import { Session, User } from './types';
import { d1Worker } from '@/lib/cloudflare/d1Worker';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  userProfile: UserProfile | null;
  signUp: (email: string, password: string, metadata?: any) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({} as AuthState);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Store channel and polling fallback
  const paymentChannelRef = useRef<any>(null);
  const pollingIntervalRef = useRef<any>(null);

  const fetchUserProfile = async (userId: string): Promise<void> => {
    try {
      console.log("Fetching user profile for:", userId);
      setProfileError(null);
      
      const profile = await d1Worker.getOne(
        'SELECT * FROM profiles WHERE id = ?',
        { params: [userId] },
        session?.access_token
      );

      if (!profile) {
        console.error("Profile not found");
        setProfileError("Profile not found");
        return;
      }
      
      // Create a valid UserProfile object
      const userProfileData: UserProfile = {
        id: profile.id as string,
        username: (profile.username as string) || 'User-' + (profile.id as string).substring(0, 5),
        name: profile.name as string || '',
        surname: profile.surname as string || '',
        email: (profile.email as string) || user?.email || '',
        country: profile.country as string || '',
        created_at: (profile.created_at as string) || new Date().toISOString(),
        is_admin: !!profile.is_admin as boolean || false
      };
      
      // Check payment status
      try {
        const paymentStatus = await d1Worker.getOne(
          'SELECT has_paid FROM payment_status WHERE user_id = ?',
          { params: [userId] },
          session?.access_token
        );
        
        if (paymentStatus) {
          userProfileData.has_paid = !!paymentStatus.has_paid;
        }
        
        setUserProfile(userProfileData);
        setupRealtimeListener(userId);
        setupPollingFallback(userId);
        
      } catch (paymentError) {
        console.error("Exception checking payment:", paymentError);
        setUserProfile(userProfileData);
      }
      
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
      setProfileError('Failed to fetch profile data');
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (user?.id) {
      console.log("Refreshing profile for user:", user.id);
      await fetchUserProfile(user.id);
    }
  };

  /* ---- REALTIME ---- */
  // Set up realtime listener for payment status changes
  const setupRealtimeListener = (userId: string) => {
    console.log("Setting up realtime listener for payment status changes, user:", userId);
    // This is now just a stub since we're migrated away from Supabase
    // A proper implementation would connect to Cloudflare Durable Objects
    
    // We'll use polling as the primary method now
    setupPollingFallback(userId);
  };

  // Polling for payment status changes
  const setupPollingFallback = (userId: string) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    console.log("Setting up polling for user:", userId);
    pollingIntervalRef.current = setInterval(async () => {
      try {
        if (!session?.access_token) return;
        
        const paymentStatus = await d1Worker.getOne(
          'SELECT has_paid FROM payment_status WHERE user_id = ?',
          { params: [userId] },
          session.access_token
        );
        
        if (paymentStatus && userProfile && paymentStatus.has_paid !== userProfile.has_paid) {
          console.log("Polling detected payment status change:", paymentStatus.has_paid);
          
          setUserProfile(prev => prev ? { 
            ...prev, 
            has_paid: !!paymentStatus.has_paid 
          } : null);
          
          if (paymentStatus.has_paid) {
            toast({
              title: "Payment Status Updated",
              description: "Your account now has full access to all game modes!",
            });
          }
        }
      } catch (error) {
        console.log('Payment polling error', error);
      }
    }, 60000); // Check every minute
  };

  // Clean up subscriptions and polling on unmount
  useEffect(() => {
    return () => {
      if (paymentChannelRef.current) {
        paymentChannelRef.current = null;
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // This is now a simplified auth state management since we're migrated from Supabase
    // In a real implementation, this would connect to EOS for auth
    
    // Check for existing session in localStorage (simulated)
    const checkSession = async () => {
      // For demo purposes, we'll just use a mock session
      // In a real app, this would come from EOS
      const mockSession = localStorage.getItem('auth_session');
      
      if (mockSession) {
        try {
          const sessionData = JSON.parse(mockSession);
          setSession(sessionData);
          setUser(sessionData.user);
          
          if (sessionData.user?.id) {
            await fetchUserProfile(sessionData.user.id);
          }
        } catch (error) {
          console.error("Error parsing session:", error);
        }
      }
      
      setIsLoading(false);
    };
    
    checkSession();
    
    window.addEventListener('online', () => {
      if (user?.id) fetchUserProfile(user.id);
    });
  }, []);

  /* ---- AUTH API: simplified stubs ---- */
  const signUp = async (email: string, password: string, metadata?: any): Promise<void> => {
    try {
      // This would connect to EOS Auth in a real implementation
      toast({
        title: 'Registration successful',
        description: 'Please check your email to verify your account.',
      });
    } catch (error: any) {
      toast({
        title: 'Registration failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      // This would connect to EOS Auth in a real implementation
      // For demo, we'll create a fake session
      const mockUser = {
        id: 'user-123',
        email: email
      };
      
      const mockSession = {
        access_token: 'fake-token-' + Date.now(),
        refresh_token: 'fake-refresh-' + Date.now(),
        expires_at: Date.now() + (3600 * 1000), // 1 hour
        user: mockUser
      };
      
      localStorage.setItem('auth_session', JSON.stringify(mockSession));
      
      setUser(mockUser);
      setSession(mockSession);
      
      // Fetch profile after login
      await fetchUserProfile(mockUser.id);
      
    } catch (error: any) {
      toast({
        title: 'Sign in failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    try {
      // This would connect to EOS Auth in a real implementation
      toast({
        title: 'Google sign in',
        description: 'This feature is being migrated to Epic Online Services',
      });
    } catch (error: any) {
      toast({
        title: 'Google sign in failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      // Remove session from localStorage
      localStorage.removeItem('auth_session');
      
      // Clear state
      setUser(null);
      setSession(null);
      setUserProfile(null);
      
      // Clean up listeners
      if (paymentChannelRef.current) {
        paymentChannelRef.current = null;
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      
      toast({ title: 'Signed out successfully' });
      navigate('/login');
      resetPerformanceMetrics();
    } catch (error: any) {
      toast({
        title: 'Sign out failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        userProfile,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
