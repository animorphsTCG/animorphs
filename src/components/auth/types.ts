
/**
 * @deprecated Auth Type Compatibility Layer
 * This file provides type definitions for backward compatibility
 * with components that still expect Supabase auth types.
 */

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: User;
}

export interface User {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  userProfile: any | null;
  signUp: (email: string, password: string, metadata?: any) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle?: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<any>;
}
