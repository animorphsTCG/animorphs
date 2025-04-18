
import React, { createContext, useContext, useState, useEffect } from 'react';
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
  updatePassword: (accessToken: string, newPassword: string) => Promise<void>;
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

  const fetchUserProfile = async (userId: string) => {
    try {
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
          const { data: paymentData } = await supabase
            .from('payment_status')
            .select('has_paid')
            .eq('id', userId)
            .single();
            
          // Add the has_paid property to the profile
          const completeProfile = {
            ...data,
            has_paid: paymentData?.has_paid || false
          };
          
          setUserProfile(completeProfile);
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

  const refreshProfile = async () => {
    if (user?.id) {
      return await fetchUserProfile(user.id);
    }
    return null;
  };

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
        } else if (event === 'PASSWORD_RECOVERY') {
          navigate('/update-password');
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

  const updatePassword = async (accessToken: string, newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      toast({
        title: 'Password updated',
        description: 'You can now log in with your new password.',
      });
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

