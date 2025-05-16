
/**
 * @deprecated Auth Type Compatibility Layer
 * This file provides type definitions for backward compatibility
 * with components that still expect Supabase auth types.
 */

// Import the new types
import { Session as EOSSession, User as EOSUser } from '@/modules/auth/context/EOSAuthContext';

// Export compatible types
export type Session = EOSSession;
export type User = EOSUser;

export interface AuthContextType {
  user: EOSUser | null;
  session: EOSSession | null;
  isLoading: boolean;
  userProfile: any | null;
  signUp: (email: string, password: string, metadata?: any) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle?: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<any>;
}
