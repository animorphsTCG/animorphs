
/**
 * SUPABASE TYPES STUB
 * 
 * This file provides stub type definitions to prevent TypeScript errors
 * while the application is being migrated from Supabase to Cloudflare D1
 * and Epic Online Services.
 * 
 * Once all components have been migrated, this file should be removed.
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

export interface SupabaseClient {
  auth: {
    getSession: () => Promise<{ data: { session: Session | null }, error: null | Error }>;
    getUser: () => Promise<{ data: { user: User | null }, error: null | Error }>;
    signIn: (params: any) => Promise<{ data: any, error: null | Error }>;
    signInWithPassword: (params: any) => Promise<{ data: any, error: null | Error }>;
    signInWithOAuth: (params: any) => Promise<{ data: any, error: null | Error }>;
    signUp: (params: any) => Promise<{ data: any, error: null | Error }>;
    signOut: () => Promise<{ error: null | Error }>;
    onAuthStateChange: (callback: (event: string, session: { session: Session | null }) => void) => any;
  };
  from: (table: string) => any;
  storage: {
    from: (bucket: string) => any;
  };
  rpc: (func: string, params?: any) => Promise<{ data: any, error: null | Error }>;
  channel: (channel: string) => any;
  removeChannel: (channel: any) => void;
}
