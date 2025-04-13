
import React, { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { trackAuthAttempt } from "@/lib/clerkMonitoring";

interface AuthContextType {
  user: any;
  isLoading: boolean;
  session: any;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  ensureProfileExists: (userId: string, userData: any) => Promise<void>;
  validateToken: () => Promise<boolean>;
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
        const startTime = performance.now();
        try {
          await ensureProfileExists(userId as string, user);
          trackAuthAttempt('login', true, performance.now() - startTime, { userId });
        } catch (err) {
          console.error("Error syncing user profile:", err);
          trackAuthAttempt('login', false, performance.now() - startTime, { userId, error: err });
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
    const startTime = performance.now();
    try {
      await clerkSignOut();
      trackAuthAttempt('signout', true, performance.now() - startTime, { userId });
      navigate('/');
    } catch (error) {
      console.error("Sign out error:", error);
      trackAuthAttempt('signout', false, performance.now() - startTime, { userId, error });
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

  // Create or update profile in Supabase - modified to handle Clerk IDs
  const ensureProfileExists = async (userId: string, userData: any) => {
    try {
      // Check if profile exists - using username match instead of ID to avoid UUID format issues
      const { data: profile, error: checkError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('username', userData.username || userId)
        .maybeSingle();
        
      if (checkError) {
        console.error("Error checking profile:", checkError);
        throw checkError;
      }
        
      if (!profile) {
        // Create a profile if it doesn't exist
        // Converting Clerk UUID format to something Supabase will accept
        // by creating a new UUID for Supabase while maintaining a mapping
        const supabaseUuid = crypto.randomUUID();
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: supabaseUuid,
            username: userData.username || userId, // Store clerk ID in username for lookup
            name: userData.firstName || "User",
            surname: userData.lastName || "",
            age: 18,
            // Store the original Clerk ID as part of the metadata
            clerk_id: userId
          });
          
        if (insertError) {
          console.error("Error creating profile:", insertError);
          throw insertError;
        } else {
          console.log("Created profile for user", userData.id);
          
          // Also create payment status entry
          const { error: paymentError } = await supabase
            .from('payment_status')
            .insert({
              id: supabaseUuid,
              has_paid: false
            });
            
          if (paymentError) {
            console.error("Error creating payment status:", paymentError);
          }
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
  
  // Token validation function that would check with Clerk's token introspection endpoint
  const validateToken = async (): Promise<boolean> => {
    if (!sessionId) return false;
    
    const startTime = performance.now();
    try {
      // In a real implementation, you would make an actual call to the token introspection endpoint
      // This is simulated here since we can't make actual calls to the Clerk API from frontend code
      console.log("Would validate token using introspection endpoint: https://glad-titmouse-32.clerk.accounts.dev/oauth/token_info");
      console.log("Would use sessionId:", sessionId);
      
      // Simulate successful validation
      const valid = !!sessionId;
      
      trackAuthAttempt('token_validation', valid, performance.now() - startTime, { userId });
      return valid;
    } catch (error) {
      console.error("Token validation error:", error);
      trackAuthAttempt('token_validation', false, performance.now() - startTime, { userId, error });
      return false;
    }
  };

  const value = {
    user: user || null,
    isLoading,
    session: sessionId ? { user: user } : null,
    signOut: handleSignOut,
    refreshUser,
    ensureProfileExists,
    validateToken,
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
