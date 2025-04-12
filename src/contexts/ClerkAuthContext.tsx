
import React, { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: any;
  isLoading: boolean;
  session: any;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
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
          // Check if profile exists
          const { data: profile, error: checkError } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', user.username || user.id)
            .maybeSingle();
            
          if (checkError) {
            console.error("Error checking profile:", checkError);
          }
            
          if (!profile) {
            // Create a profile if it doesn't exist
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: userId, // Use the clean ID from Clerk
                username: user.username || user.id,
                name: user.firstName || "User",
                surname: user.lastName || "",
                age: 18
              });
              
            if (insertError) {
              console.error("Error creating profile:", insertError);
            } else {
              console.log("Created profile for user", user.id);
            }
          }
        } catch (err) {
          console.error("Error syncing user profile:", err);
        }
      }
    };
    
    syncUserProfile();
  }, [user, isClerkLoaded, isUserLoaded, userId]);

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
        setRedirected(true);
        navigate('/profile');
      }
    }
  }, [user, redirected, navigate]);

  const handleSignOut = async () => {
    try {
      await clerkSignOut();
      navigate('/');
    } catch (error) {
      console.error("Sign out error:", error);
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
