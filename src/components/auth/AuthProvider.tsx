
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

  // Store channel and polling fallback
  const paymentChannelRef = useRef<any>(null);
  const pollingIntervalRef = useRef<any>(null);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("Fetching user profile for:", userId);
      setProfileError(null);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        setProfileError(error.message);
        return null;
      }
      
      if (data) {
        // Use has_paid_unlock_fee to check payment status
        try {
          console.log("Checking payment status for user:", userId);
          const { data: hasPaid, error: paymentError } = await supabase.rpc('has_paid_unlock_fee', { user_id: userId });
          
          if (paymentError) {
            console.error("Error checking payment status:", paymentError);
            // Still return profile without payment status
            setUserProfile(data);
            return data;
          }
          
          console.log("Payment status result:", hasPaid);
          
          // Add the has_paid property to the profile
          const completeProfile = {
            ...data,
            has_paid: hasPaid || false
          };
          
          setUserProfile(completeProfile);

          // Setup realtime listener and polling fallback
          setupRealtimeListener(userId);
          setupPollingFallback(userId);
          
          return completeProfile;
        } catch (paymentError) {
          console.error("Exception checking payment:", paymentError);
          setUserProfile(data);
          return data;
        }
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
      setProfileError('Failed to fetch profile data');
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      console.log("Refreshing profile for user:", user.id);
      return await fetchUserProfile(user.id);
    }
    return null;
  };

  /* ---- REALTIME ---- */
  // Set up realtime listener for payment status changes
  const setupRealtimeListener = (userId: string) => {
    // Remove old channel if any
    if (paymentChannelRef.current) {
      supabase.removeChannel(paymentChannelRef.current);
      paymentChannelRef.current = null;
    }

    console.log("Setting up realtime listener for payment status changes, user:", userId);
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
          console.log("Payment status changed:", payload);
          setUserProfile(prev =>
            prev ? { ...prev, has_paid: payload.new.has_paid } : prev
          );
          if (payload.new.has_paid) {
            toast({
              title: "Payment Status Updated",
              description: "Your account now has full access to all game modes!",
            });
          }
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to payment changes');
        } else {
          // fallback setup
          console.log('Failed to subscribe to realtime, using polling fallback');
          setupPollingFallback(userId);
        }
      });

    paymentChannelRef.current = channel;
  };

  // Optional: polling fallback if Realtime is not working
  const setupPollingFallback = (userId: string) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    console.log("Setting up polling fallback for user:", userId);
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const { data, error } = await supabase.rpc('has_paid_unlock_fee', { user_id: userId });
        
        if (error) {
          console.error("Polling error:", error);
          return;
        }
        
        if (typeof data === 'boolean' && userProfile && data !== userProfile.has_paid) {
          console.log("Polling detected payment status change:", data);
          setUserProfile(prev => prev ? { ...prev, has_paid: data } : prev);
          
          if (data) {
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
        supabase.removeChannel(paymentChannelRef.current);
        paymentChannelRef.current = null;
      }
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
        console.log("Auth state changed:", event);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (event === 'SIGNED_IN' && currentSession?.user) {
          // Use setTimeout to prevent potential race conditions
          setTimeout(() => {
            fetchUserProfile(currentSession.user.id);
          }, 0);
          toast({ title: 'Signed in successfully' });
        } else if (event === 'SIGNED_OUT') {
          // Clean up userProfile and channels
          setUserProfile(null);
          if (paymentChannelRef.current) {
            supabase.removeChannel(paymentChannelRef.current);
            paymentChannelRef.current = null;
          }
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          toast({ title: 'Signed out successfully' });
          navigate('/login');
          resetPerformanceMetrics();
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log("Got session:", currentSession ? 'yes' : 'no');
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        fetchUserProfile(currentSession.user.id)
          .finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    window.addEventListener('online', () => {
      resetSupabaseConnection();
      if (user?.id) fetchUserProfile(user.id);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  /* ---- AUTH API: unchanged ---- */
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
