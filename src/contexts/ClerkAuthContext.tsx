
import React, { createContext, useContext, ReactNode } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-react";

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
  
  const isLoading = !isClerkLoaded || !isUserLoaded;

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
