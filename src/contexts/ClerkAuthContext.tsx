
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
  
  const isLoading = !isClerkLoaded || !isUserLoaded;

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
      }
    }
  }, [user, redirected]);

  const handleSignOut = async () => {
    try {
      await clerkSignOut();
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
