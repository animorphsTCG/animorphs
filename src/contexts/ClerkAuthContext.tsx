import React, { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
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

  useEffect(() => {
    if (user && !redirected && !window.location.pathname.startsWith('/profile')) {
      const requiresPaymentPages = [
        '/1v1-battle',
        '/3-player-battle',
        '/4-player-public-battle',
        '/4-player-user-lobby'
      ];

      if (!requiresPaymentPages.some(page => window.location.pathname.startsWith(page))) {
        try {
          setRedirected(true);
          navigate('/profile');
        } catch (err) {
          console.error("Navigation error:", err);
          window.location.href = '/profile';
        }
      }
    }
  }, [user, redirected, navigate]);

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
      try {
        window.location.href = '/';
      } catch (err) {
        console.error("Navigation fallback error:", err);
      }
    }
  };

  const ensureProfileExists = async (userId: string, userData: any) => {
    try {
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
        const supabaseUuid = crypto.randomUUID();
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: supabaseUuid,
            username: userData.username || userId,
            name: userData.firstName || "User",
            surname: userData.lastName || "",
            age: 18,
            clerk_id: userId
          });
          
        if (insertError) {
          console.error("Error creating profile:", insertError);
          throw insertError;
        } else {
          console.log("Created profile for user", userData.id);
          
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
    return Promise.resolve();
  };

  const validateToken = async (): Promise<boolean> => {
    if (!sessionId) return false;
    
    const startTime = performance.now();
    try {
      console.log("Would validate token using introspection endpoint: https://glad-titmouse-32.clerk.accounts.dev/oauth/token_info");
      console.log("Would use sessionId:", sessionId);
      
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
