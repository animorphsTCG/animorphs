
/**
 * SUPABASE MIGRATION STUB
 * 
 * This file provides stub implementations of the Supabase client
 * to prevent build errors while the application is being migrated
 * from Supabase to Cloudflare D1 and Epic Online Services.
 * 
 * Once all components have been migrated, this file should be removed.
 */

console.warn('Using Supabase stub implementation. This component needs to be migrated to Cloudflare D1/EOS.');

// Import the Session type from a local type definition to avoid supabase dependency
export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: {
    id: string;
    email?: string;
  }
}

export interface User {
  id: string;
  email?: string;
}

// Add Error extension to support code property
declare global {
  interface Error {
    code?: string;
  }
}

// Function to reset the Supabase connection
export const resetSupabaseConnection = () => {
  console.warn('resetSupabaseConnection called - this is a stub implementation');
  return Promise.resolve();
};

// Create a basic stub that implements common Supabase methods
export const supabase = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signIn: () => Promise.resolve({ data: null, error: new Error('Supabase auth has been deprecated') }),
    signInWithPassword: (creds: any) => Promise.resolve({ data: null, error: new Error('Supabase auth has been deprecated') }),
    signInWithOAuth: (params: any) => Promise.resolve({ data: null, error: new Error('Supabase auth has been deprecated') }),
    signUp: () => Promise.resolve({ data: null, error: new Error('Supabase auth has been deprecated') }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: (callback: any) => {
      // Immediately call with SIGNED_OUT event
      setTimeout(() => {
        callback('SIGNED_OUT', { session: null });
      }, 0);
      
      return { 
        data: { 
          subscription: { 
            unsubscribe: () => {} 
          } 
        } 
      };
    },
    setSession: () => Promise.resolve({ data: { session: null }, error: null }),
    refreshSession: () => Promise.resolve({ data: { session: null }, error: null }),
  },
  from: (tableName: string) => ({
    select: (columns = '*') => {
      const selectResult = {
        data: null,
        error: new Error(`Supabase query to ${tableName} has been deprecated`),
        
        eq: (column: string, value: any) => ({
          single: () => Promise.resolve({ data: null, error: new Error(`Supabase query to ${tableName} has been deprecated`) }),
          maybeSingle: () => Promise.resolve({ data: null, error: new Error(`Supabase query to ${tableName} has been deprecated`) }),
          limit: (limit: number) => ({
            order: (column: string, { ascending }: { ascending: boolean }) => 
              Promise.resolve({ data: [], error: new Error(`Supabase query to ${tableName} has been deprecated`) })
          }),
          order: (column: string, { ascending }: { ascending: boolean }) => 
            Promise.resolve({ data: [], error: new Error(`Supabase query to ${tableName} has been deprecated`) }),
          execute: () => Promise.resolve({ data: [], error: new Error(`Supabase query to ${tableName} has been deprecated`) }),
          select: (columns: string) => selectResult
        }),
        neq: (column: string, value: any) => ({
          execute: () => Promise.resolve({ data: [], error: new Error(`Supabase query to ${tableName} has been deprecated`) })
        }),
        execute: () => Promise.resolve({ data: [], error: new Error(`Supabase query to ${tableName} has been deprecated`) }),
        order: (column: string, { ascending }: { ascending: boolean }) => ({
          execute: () => Promise.resolve({ data: [], error: new Error(`Supabase query to ${tableName} has been deprecated`) })
        }),
        limit: (limit: number) => ({
          execute: () => Promise.resolve({ data: [], error: new Error(`Supabase query to ${tableName} has been deprecated`) })
        }),
        single: () => Promise.resolve({ data: null, error: new Error(`Supabase query to ${tableName} has been deprecated`) }),
        maybeSingle: () => Promise.resolve({ data: null, error: new Error(`Supabase query to ${tableName} has been deprecated`) }),
      };
      
      // Return the query builder object with custom properties
      return selectResult;
    },
    insert: (data: any) => Promise.resolve({ data: null, error: new Error(`Supabase insert to ${tableName} has been deprecated`) }),
    update: (data: any) => ({
      eq: (column: string, value: any) => Promise.resolve({ data: null, error: new Error(`Supabase update to ${tableName} has been deprecated`) }),
      match: (criteria: any) => Promise.resolve({ data: null, error: new Error(`Supabase update to ${tableName} has been deprecated`) })
    }),
    upsert: (data: any) => Promise.resolve({ data: null, error: new Error(`Supabase upsert to ${tableName} has been deprecated`) }),
    delete: () => ({
      eq: (column: string, value: any) => Promise.resolve({ data: null, error: new Error(`Supabase delete from ${tableName} has been deprecated`) }),
      match: (criteria: any) => Promise.resolve({ data: null, error: new Error(`Supabase delete from ${tableName} has been deprecated`) })
    })
  }),
  storage: {
    from: (bucket: string) => ({
      upload: (path: string, file: any) => Promise.resolve({ data: null, error: new Error('Supabase storage has been deprecated') }),
      download: (path: string) => Promise.resolve({ data: null, error: new Error('Supabase storage has been deprecated') }),
      getPublicUrl: (path: string) => ({ data: { publicUrl: '' } }),
      remove: (paths: string[]) => Promise.resolve({ data: null, error: new Error('Supabase storage has been deprecated') })
    })
  },
  rpc: (func: string, params?: any) => Promise.resolve({ data: null, error: new Error(`Supabase RPC call to ${func} has been deprecated`) }),
  channel: (channel: string) => ({
    on: (event: string, filter?: any, callback?: any) => {
      if (typeof filter === 'function' && callback === undefined) {
        callback = filter;
        filter = undefined;
      }
      return {
        subscribe: (cb?: any) => {
          if (cb) cb('SUBSCRIBED');
          return { unsubscribe: () => {} };
        }
      };
    },
    subscribe: (callback?: any) => {
      if (callback) callback('SUBSCRIBED');
      return { unsubscribe: () => {} };
    },
    track: (presence?: any) => Promise.resolve({}),
    presenceState: () => ({}),
    unsubscribe: () => {}
  }),
  removeChannel: (channel: any) => {}
};

// Export a mock function for development purposes
export const createClient = () => supabase;

/**
 * MIGRATION NOTE:
 * 
 * This file should be removed once all components have been migrated
 * to use Cloudflare D1 and Epic Online Services instead of Supabase.
 * 
 * The proper way to access database functionality is through:
 * - src/lib/cloudflare/D1Database.ts
 * - src/hooks/useD1Database.ts
 * 
 * For authentication, use:
 * - src/modules/auth/context/EOSAuthContext.tsx
 * - src/lib/eos/eosAuth.ts
 */
