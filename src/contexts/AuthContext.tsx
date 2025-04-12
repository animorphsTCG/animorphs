
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { User } from "@/types";
import { toast } from "@/components/ui/use-toast";

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
        
        // If the profile doesn't exist, it might be because the database trigger hasn't run yet
        if (error.code === 'PGRST116') { // Record not found
          console.log("Profile not found, will retry in 2 seconds");
          return new Promise((resolve) => {
            setTimeout(async () => {
              const retryResult = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
                
              if (retryResult.error) {
                console.error('Error in retry fetch of user profile:', retryResult.error);
                resolve(null);
              } else {
                console.log("Profile found on retry:", retryResult.data);
                resolve(retryResult.data);
              }
            }, 2000);
          });
        }
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
    
    // Always consider email as verified
    setIsEmailVerified(true);

    try {
      const profileData = await fetchUserProfile(authUser.id);
      if (profileData) {
        console.log("Merging auth user with profile data:", profileData);
        const combinedData = Object.assign({}, authUser, profileData) as (SupabaseUser & Partial<User>);
        setUser(combinedData);
      } else {
        // If profile doesn't exist yet, attempt to create it
        console.log("No profile found, attempting to create one");
        
        try {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: authUser.id,
              username: authUser.user_metadata.username || authUser.email?.split('@')[0] || 'User',
              name: authUser.user_metadata.name || '',
              surname: authUser.user_metadata.surname || '',
              age: authUser.user_metadata.age || 18,
              gender: authUser.user_metadata.gender,
              country: authUser.user_metadata.country
            });
            
          if (insertError) {
            console.error("Error creating profile:", insertError);
          } else {
            console.log("Successfully created user profile");
            // Fetch the newly created profile
            const newProfile = await fetchUserProfile(authUser.id);
            if (newProfile) {
              const combinedData = Object.assign({}, authUser, newProfile) as (SupabaseUser & Partial<User>);
              setUser(combinedData);
              return;
            }
          }
        } catch (insertErr) {
          console.error("Exception creating profile:", insertErr);
        }
        
        // Fallback if profile creation failed
        console.log("Using fallback username from email");
        const fallbackUser = Object.assign({}, authUser, {
          username: authUser.email?.split('@')[0] || 'User'
        }) as (SupabaseUser & Partial<User>);
        setUser(fallbackUser);
      }
    } catch (error) {
      console.error('Error updating user with profile:', error);
      // Fallback username from email
      const fallbackUser = Object.assign({}, authUser, {
        username: authUser.email?.split('@')[0] || 'User'
      }) as (SupabaseUser & Partial<User>);
      setUser(fallbackUser);
    }
  };
  
  // Function to manually refresh user data
  const refreshUser = async (): Promise<void> => {
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
      async (event, newSession) => {
        console.log("AuthProvider: Auth state changed", event, newSession?.user?.id);
        console.log("Event type:", event);
        setSession(newSession);
        
        if (newSession?.user) {
          console.log("User is authenticated, updating profile");
          // Wait for the profile to be created by the DB trigger
          setTimeout(async () => {
            await updateUserWithProfile(newSession.user);
          }, 500);
        } else {
          setUser(null);
        }
        
        // Show toast for certain events
        if (event === 'SIGNED_IN') {
          toast({
            title: "Signed in",
            description: "You are now signed in.",
          });
        } else if (event === 'SIGNED_OUT') {
          toast({
            title: "Signed out",
            description: "You have been signed out.",
          });
        } else if (event === 'USER_UPDATED') {
          toast({
            title: "Profile updated",
            description: "Your profile has been updated.",
          });
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      console.log("AuthProvider: Initial session check", existingSession?.user?.id);
      setSession(existingSession);
      
      if (existingSession?.user) {
        await updateUserWithProfile(existingSession.user);
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async (): Promise<void> => {
    console.log("Signing out user");
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Sign out failed",
        description: "There was an error signing out. Please try again.",
        variant: "destructive",
      });
    }
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
