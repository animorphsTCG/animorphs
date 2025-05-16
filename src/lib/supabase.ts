
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
    signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase auth has been deprecated') }),
    signInWithOAuth: () => Promise.resolve({ data: null, error: new Error('Supabase auth has been deprecated') }),
    signUp: () => Promise.resolve({ data: null, error: new Error('Supabase auth has been deprecated') }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: (callback) => {
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
  from: (tableName) => ({
    select: (columns = '*') => {
      const queryBuilder = {
        eq: (column, value) => ({
          single: () => Promise.resolve({ data: null, error: new Error(`Supabase query to ${tableName} has been deprecated`) }),
          maybeSingle: () => Promise.resolve({ data: null, error: new Error(`Supabase query to ${tableName} has been deprecated`) }),
          limit: (limit) => ({
            order: (column, { ascending }) => 
              Promise.resolve({ data: [], error: new Error(`Supabase query to ${tableName} has been deprecated`) })
          }),
          order: (column, { ascending }) => 
            Promise.resolve({ data: [], error: new Error(`Supabase query to ${tableName} has been deprecated`) }),
          execute: () => Promise.resolve({ data: [], error: new Error(`Supabase query to ${tableName} has been deprecated`) })
        }),
        neq: (column, value) => ({
          execute: () => Promise.resolve({ data: [], error: new Error(`Supabase query to ${tableName} has been deprecated`) })
        }),
        execute: () => Promise.resolve({ data: [], error: new Error(`Supabase query to ${tableName} has been deprecated`) }),
        order: (column, { ascending }) => ({
          execute: () => Promise.resolve({ data: [], error: new Error(`Supabase query to ${tableName} has been deprecated`) })
        }),
        limit: (limit) => ({
          execute: () => Promise.resolve({ data: [], error: new Error(`Supabase query to ${tableName} has been deprecated`) })
        }),
        single: () => Promise.resolve({ data: null, error: new Error(`Supabase query to ${tableName} has been deprecated`) }),
        maybeSingle: () => Promise.resolve({ data: null, error: new Error(`Supabase query to ${tableName} has been deprecated`) })
      };
      
      // Return the query builder object directly for proper chaining
      return queryBuilder;
    },
    insert: (data) => Promise.resolve({ data: null, error: new Error(`Supabase insert to ${tableName} has been deprecated`) }),
    update: (data) => ({
      eq: (column, value) => Promise.resolve({ data: null, error: new Error(`Supabase update to ${tableName} has been deprecated`) }),
      match: (criteria) => Promise.resolve({ data: null, error: new Error(`Supabase update to ${tableName} has been deprecated`) })
    }),
    upsert: (data) => Promise.resolve({ data: null, error: new Error(`Supabase upsert to ${tableName} has been deprecated`) }),
    delete: () => ({
      eq: (column, value) => Promise.resolve({ data: null, error: new Error(`Supabase delete from ${tableName} has been deprecated`) }),
      match: (criteria) => Promise.resolve({ data: null, error: new Error(`Supabase delete from ${tableName} has been deprecated`) })
    })
  }),
  storage: {
    from: (bucket) => ({
      upload: (path, file) => Promise.resolve({ data: null, error: new Error('Supabase storage has been deprecated') }),
      download: (path) => Promise.resolve({ data: null, error: new Error('Supabase storage has been deprecated') }),
      getPublicUrl: (path) => ({ data: { publicUrl: '' } }),
      remove: (paths) => Promise.resolve({ data: null, error: new Error('Supabase storage has been deprecated') })
    })
  },
  rpc: (func, params) => Promise.resolve({ data: null, error: new Error(`Supabase RPC call to ${func} has been deprecated`) }),
  channel: (channel) => ({
    on: (event, filter, callback) => ({
      subscribe: (callback) => {
        if (callback) callback('SUBSCRIBED');
        return { unsubscribe: () => {} };
      }
    }),
    subscribe: (callback) => {
      if (callback) callback('SUBSCRIBED');
      return { unsubscribe: () => {} };
    },
    track: (presence) => Promise.resolve({}),
    presenceState: () => ({}),
    unsubscribe: () => {}
  }),
  removeChannel: (channel) => {}
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
