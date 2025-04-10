
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { User } from "@/types";

type AuthContextType = {
  user: (SupabaseUser & Partial<User>) | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  isEmailVerified: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<(SupabaseUser & Partial<User>) | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  // Function to fetch user profile data
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  // Update user state with profile data
  const updateUserWithProfile = async (authUser: SupabaseUser | null) => {
    if (!authUser) {
      setUser(null);
      setIsEmailVerified(false);
      return;
    }

    try {
      // Check email verification status
      setIsEmailVerified(authUser.email_confirmed_at !== null);

      const profileData = await fetchUserProfile(authUser.id);
      if (profileData) {
        // Merge auth user with profile data
        setUser({
          ...authUser,
          ...profileData
        });
      } else {
        // Fallback if profile doesn't exist yet
        setUser({
          ...authUser,
          username: authUser.email?.split('@')[0] || 'User'
        });
      }
    } catch (error) {
      console.error('Error updating user with profile:', error);
      // Fallback username from email
      setUser({
        ...authUser,
        username: authUser.email?.split('@')[0] || 'User'
      });
    }
  };

  useEffect(() => {
    console.log("AuthProvider: Setting up auth state listener");
    
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("AuthProvider: Auth state changed", event, session?.user?.id);
        setSession(session);
        
        // Defer profile fetching to avoid deadlocks
        setTimeout(() => {
          updateUserWithProfile(session?.user ?? null);
        }, 0);
        
        setIsLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("AuthProvider: Initial session check", session?.user?.id);
      setSession(session);
      
      // Defer profile fetching to avoid deadlocks
      setTimeout(() => {
        updateUserWithProfile(session?.user ?? null);
      }, 0);
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut, isEmailVerified }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
