
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
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<(SupabaseUser & Partial<User>) | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Always set isEmailVerified to true to bypass email verification
  const [isEmailVerified, setIsEmailVerified] = useState(true);

  // Function to fetch user profile data
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("Fetching profile data for user:", userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      
      console.log("Profile data fetched:", data);
      return data;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  // Update user state with profile data
  const updateUserWithProfile = async (authUser: SupabaseUser | null) => {
    if (!authUser) {
      console.log("No auth user to update profile for");
      setUser(null);
      return;
    }

    console.log("Updating user profile for:", authUser.id);
    console.log("Full auth user object:", authUser);
    
    // Always consider email as verified
    setIsEmailVerified(true);

    try {
      const profileData = await fetchUserProfile(authUser.id);
      if (profileData) {
        console.log("Merging auth user with profile data:", profileData);
        // Merge auth user with profile data
        setUser({
          ...authUser,
          ...profileData
        });
      } else {
        // Fallback if profile doesn't exist yet
        console.log("No profile found, using fallback username");
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
  
  // Function to manually refresh user data
  const refreshUser = async () => {
    try {
      console.log("Manually refreshing user data");
      const { data } = await supabase.auth.getUser();
      console.log("Refreshed auth user data:", data?.user);
      if (data?.user) {
        await updateUserWithProfile(data.user);
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  useEffect(() => {
    console.log("AuthProvider: Setting up auth state listener");
    
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("AuthProvider: Auth state changed", event, session?.user?.id);
        console.log("Event type:", event);
        setSession(session);
        
        // Defer profile fetching to avoid deadlocks
        if (session?.user) {
          setTimeout(() => {
            console.log("AuthProvider: Updating user profile after auth state change");
            updateUserWithProfile(session.user);
          }, 0);
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("AuthProvider: Initial session check", session?.user?.id);
      setSession(session);
      
      // Defer profile fetching to avoid deadlocks
      if (session?.user) {
        setTimeout(() => {
          console.log("AuthProvider: Updating user profile after initial session check");
          updateUserWithProfile(session.user);
        }, 0);
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    console.log("Signing out user");
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut, isEmailVerified, refreshUser }}>
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
