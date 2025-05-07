
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { UserProfile } from '@/types';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  userProfile: UserProfile | null;
  signUp: (email: string, password: string, metadata?: any) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
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
  const retryCountRef = useRef<number>(0);

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
        // Check payment status with retry mechanism
        try {
          console.log("Checking payment status for user:", userId);
          
          let hasPaid = false;
          let paymentError = null;
          
          // Try up to 3 times with exponential backoff
          for (let attempt = 0; attempt < 3; attempt++) {
            if (attempt > 0) {
              console.log(`Payment status check attempt ${attempt + 1}/3`);
              // Wait with exponential backoff before retrying
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
            }
            
            try {
              const { data: paymentData, error: paymentCheckError } = await supabase
                .from('payment_status')
                .select('has_paid')
                .eq('id', userId)
                .single();
                
              if (!paymentCheckError && paymentData) {
                console.log("Payment status found:", paymentData);
                hasPaid = paymentData.has_paid;
                paymentError = null;
                break; // Success, exit retry loop
              } else {
                paymentError = paymentCheckError;
              }
            } catch (err) {
              console.error(`Payment check error (attempt ${attempt + 1})`, err);
              paymentError = err;
            }
          }
          
          if (paymentError) {
            console.warn("All payment status check attempts failed:", paymentError);
          }
          
          // Add the has_paid property to the profile
          const completeProfile = {
            ...data,
            has_paid: hasPaid
          };
          
          console.log("Setting user profile with payment status:", completeProfile);
          setUserProfile(completeProfile);

          // Setup realtime listener for payment status changes
          setupRealtimeListener(userId);
          
          // Setup polling fallback for real-time reliability
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
      console.error('Error in fetchUserProfile:', error);
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
        if (status !== 'SUBSCRIBED') {
          // Fallback setup if subscription fails
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
        const { data, error } = await supabase
          .from('payment_status')
          .select('has_paid')
          .eq('id', userId)
          .single();
        
        if (error) {
          console.error("Polling error:", error);
          return;
        }
        
        if (userProfile && data && data.has_paid !== userProfile.has_paid) {
          console.log("Polling detected payment status change:", data);
          setUserProfile(prev => prev ? { ...prev, has_paid: data.has_paid } : prev);
          
          if (data.has_paid) {
            toast({
              title: "Payment Status Updated",
              description: "Your account now has full access to all game modes!",
            });
          }
        }
      } catch (error) {
        console.log('Payment polling error', error);
      }
    }, 30000); // Check every 30 seconds
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
          navigate(`/profile/${currentSession.user.id}`);
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
        } else if (event === 'PASSWORD_RECOVERY') {
          navigate('/update-password');
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

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      console.log("Signing up with email:", email);
      console.log("Metadata:", metadata);
      
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
      
      console.log("Sign up response:", data);
      
      toast({
        title: 'Registration successful',
        description: 'Please check your email to verify your account.',
      });
      
      // After successful registration, redirect to verification page
      navigate('/verify', { state: { email } });
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

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      
      // On successful login, the onAuthStateChange will handle navigation
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

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      
      if (error) throw error;
      
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

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
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
        resetPassword,
        updatePassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
