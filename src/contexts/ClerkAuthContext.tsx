
import React, { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface AuthContextType {
  user: any;
  isLoading: boolean;
  session: any;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  ensureProfileExists: (userId: string, userData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const ClerkAuthProvider = ({ children }: { children: ReactNode }) => {
  const { isLoaded: isClerkLoaded, userId, sessionId, signOut: clerkSignOut } = useClerkAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [redirected, setRedirected] = useState(false);
  const navigate = useNavigate();
  
  const isLoading = !isClerkLoaded || !isUserLoaded;

  // Ensure user data is synced with Supabase profiles
  useEffect(() => {
    const syncUserProfile = async () => {
      if (user && isClerkLoaded && isUserLoaded) {
        try {
          await ensureProfileExists(userId as string, user);
        } catch (err) {
          console.error("Error syncing user profile:", err);
          toast({
            title: "Profile Sync Error",
            description: "Unable to sync your profile data. Please try again later.",
            variant: "destructive",
          });
        }
      }
    };
    
    if (user && userId) {
      syncUserProfile();
    }
  }, [user, isClerkLoaded, isUserLoaded, userId]);

  // Redirect functionality with error handling
  useEffect(() => {
    // If user is logged in and not on the profile page, redirect them there
    if (user && !redirected && !window.location.pathname.startsWith('/profile')) {
      const requiresPaymentPages = [
        '/1v1-battle',
        '/3-player-battle',
        '/4-player-public-battle',
        '/4-player-user-lobby'
      ];

      // Only redirect if not trying to access payment-protected routes
      // Those routes have their own redirect logic in PaidAccessRoute component
      if (!requiresPaymentPages.some(page => window.location.pathname.startsWith(page))) {
        try {
          setRedirected(true);
          navigate('/profile');
        } catch (err) {
          console.error("Navigation error:", err);
          // Fallback if navigate fails
          window.location.href = '/profile';
        }
      }
    }
  }, [user, redirected, navigate]);

  // Enhanced sign-out with better error handling
  const handleSignOut = async () => {
    try {
      await clerkSignOut();
      navigate('/');
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Sign Out Error",
        description: "Unable to sign out properly. Please try again.",
        variant: "destructive",
      });
      // Fallback if sign out fails
      try {
        window.location.href = '/';
      } catch (err) {
        console.error("Navigation fallback error:", err);
      }
    }
  };

  // Create or update profile in Supabase
  const ensureProfileExists = async (userId: string, userData: any) => {
    try {
      // Check if profile exists
      const { data: profile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', userData.username || userData.id)
        .maybeSingle();
        
      if (checkError) {
        console.error("Error checking profile:", checkError);
        throw checkError;
      }
        
      if (!profile) {
        // Create a profile if it doesn't exist
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            username: userData.username || userData.id,
            name: userData.firstName || "User",
            surname: userData.lastName || "",
            age: 18
          });
          
        if (insertError) {
          console.error("Error creating profile:", insertError);
          throw insertError;
        } else {
          console.log("Created profile for user", userData.id);
        }
      }
    } catch (err) {
      console.error("Profile creation error:", err);
      throw err;
    }
  };

  const refreshUser = async () => {
    // Clerk automatically manages user data refreshing
    return Promise.resolve();
  };

  const value = {
    user: user || null,
    isLoading,
    session: sessionId ? { user: user } : null,
    signOut: handleSignOut,
    refreshUser,
    ensureProfileExists,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
