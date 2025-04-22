
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';
import { supabase, resetSupabaseConnection } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { UserProfile } from '@/types';
import { getPerformanceMetrics, resetPerformanceMetrics } from '@/lib/monitoring';

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
  
  // Reference to Realtime subscription channel
  const paymentChannelRef = useRef<any>(null);
  // Reference to polling interval
  const pollingIntervalRef = useRef<any>(null);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching user profile for', userId);
      setProfileError(null);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        setProfileError(error.message);
        return null;
      }
      
      // If the profile was found, check if they have paid
      if (data) {
        try {
          // Use our new optimized RPC function
          const { data: paymentStatus, error: paymentError } = await supabase.rpc('check_paid', {
            user_id: userId
          });
            
          if (paymentError) throw paymentError;
          
          // Add the has_paid property to the profile
          const completeProfile = {
            ...data,
            has_paid: paymentStatus || false
          };
          
          setUserProfile(completeProfile);
          
          // Setup realtime listener for payment changes after profile is loaded
          setupPaymentListener(userId);
          
          return completeProfile;
        } catch (paymentError) {
          console.error('Error checking payment status:', paymentError);
          // Still return the profile even if payment status check fails
          setUserProfile(data);
          return data;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setProfileError('Failed to fetch profile data');
      return null;
    }
  };

  // Set up Realtime listener for payment status changes
  const setupPaymentListener = (userId: string) => {
    // First clean up existing subscription if any
    if (paymentChannelRef.current) {
      supabase.removeChannel(paymentChannelRef.current);
      paymentChannelRef.current = null;
    }

    console.log('Setting up payment listener for user', userId);
    
    try {
      // Create a channel specific to this user's payment status
      const channel = supabase
        .channel(`payment-status-${userId}`)
        .on('postgres_changes', 
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'payment_status',
            filter: `id=eq.${userId}`
          }, 
          (payload) => {
            console.log('Payment status changed:', payload);
            // Update the user profile with the new payment status
            setUserProfile((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                has_paid: payload.new.has_paid
              };
            });
            
            // Notify the user about the payment status change
            if (payload.new.has_paid) {
              toast({
                title: "Payment Status Updated",
                description: "Your account now has full access to all game modes!",
              });
            }
          }
        )
        .subscribe((status) => {
          console.log('Payment channel status:', status);
          
          // If subscription fails, set up polling as fallback
          if (status !== 'SUBSCRIBED') {
            setupPollingFallback(userId);
          }
        });
      
      // Store the channel reference for later cleanup
      paymentChannelRef.current = channel;
      
    } catch (error) {
      console.error('Error setting up payment listener:', error);
      // Set up polling as fallback if realtime fails
      setupPollingFallback(userId);
    }
  };
  
  // Set up polling fallback for payment status
  const setupPollingFallback = (userId: string) => {
    console.log('Setting up polling fallback for payment status');
    
    // Clear existing interval if any
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    // Set up polling interval (every 60 seconds)
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const { data } = await supabase.rpc('check_paid', { user_id: userId });
        
        // Only update if different from current state
        if (data !== undefined && userProfile && data !== userProfile.has_paid) {
          console.log('Polling detected payment status change:', data);
          setUserProfile(prev => ({
            ...prev!,
            has_paid: data
          }));
          
          if (data) {
            toast({
              title: "Payment Status Updated",
              description: "Your account now has full access to all game modes!",
            });
          }
        }
      } catch (error) {
        console.error('Error in payment status polling:', error);
      }
    }, 60000); // Poll every 60 seconds
  };

  const refreshProfile = async () => {
    if (user?.id) {
      return await fetchUserProfile(user.id);
    }
    return null;
  };

  // Clean up subscriptions and intervals when component unmounts
  useEffect(() => {
    return () => {
      // Clean up payment channel subscription
      if (paymentChannelRef.current) {
        supabase.removeChannel(paymentChannelRef.current);
        paymentChannelRef.current = null;
      }
      
      // Clean up polling interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST to avoid missing events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state changed:', event);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (event === 'SIGNED_IN' && currentSession?.user) {
          // Use setTimeout to prevent potential race conditions
          setTimeout(() => {
            fetchUserProfile(currentSession.user.id);
          }, 0);
          toast({ title: 'Signed in successfully' });
        } else if (event === 'SIGNED_OUT') {
          setUserProfile(null);
          toast({ title: 'Signed out successfully' });
          navigate('/login');
          
          // Clean up subscriptions on sign out
          if (paymentChannelRef.current) {
            supabase.removeChannel(paymentChannelRef.current);
            paymentChannelRef.current = null;
          }
          
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          
          // Reset monitoring metrics on sign out
          resetPerformanceMetrics();
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log('Got session:', currentSession ? 'yes' : 'no');
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        fetchUserProfile(currentSession.user.id)
          .finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // Handle connection issues
    window.addEventListener('online', () => {
      console.log('Connection restored, resetting Supabase connection');
      resetSupabaseConnection();
      
      // Re-fetch profile and re-establish realtime on reconnect
      if (user?.id) {
        fetchUserProfile(user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
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

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: 'Sign in failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: 'Google sign in failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
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
