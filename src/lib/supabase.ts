
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

// Add Error extension to support code property for error checking
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

// Helper to create a standard query result with full chaining
const createQueryResult = (tableName: string) => {
  const errorMsg = `Supabase query to ${tableName} has been deprecated`;
  
  // Create common result with data and error
  const result = {
    data: null as any[],
    error: new Error(errorMsg)
  };
  
  // Basic query chainable methods
  const chainMethods = {
    eq: (column: string, value: any) => chainMethods,
    neq: (column: string, value: any) => chainMethods,
    gt: (column: string, value: any) => chainMethods,
    gte: (column: string, value: any) => chainMethods,
    lt: (column: string, value: any) => chainMethods,
    lte: (column: string, value: any) => chainMethods,
    like: (column: string, value: any) => chainMethods,
    ilike: (column: string, value: any) => chainMethods,
    is: (column: string, value: any) => chainMethods,
    in: (column: string, values: any[]) => chainMethods,
    contains: (column: any, value: any) => chainMethods,
    containedBy: (column: any, value: any) => chainMethods,
    not: (column: string, value: any) => chainMethods,
    or: (filter: string, values: any[]) => chainMethods,
    filter: (column: string, operator: string, value: any) => chainMethods,
    match: (query: any) => chainMethods,
    order: (column: string, { ascending }: { ascending: boolean }) => chainMethods,
    limit: (count: number) => chainMethods,
    range: (from: number, to: number) => chainMethods,
    single: () => Promise.resolve(result),
    maybeSingle: () => Promise.resolve(result),
    select: (columns: string = '*') => chainMethods,
    execute: () => Promise.resolve(result),
    then: (onfulfilled: any) => Promise.resolve(result).then(onfulfilled)
  };
  
  // Add data and error directly to chainMethods for components that expect them
  return {
    ...chainMethods,
    data: null as any,
    error: new Error(errorMsg)
  };
};

// Create a basic stub that implements common Supabase methods
export const supabase = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signIn: (params?: any) => Promise.resolve({ data: null, error: new Error('Supabase auth has been deprecated') }),
    signInWithPassword: (params?: any) => Promise.resolve({ data: null, error: new Error('Supabase auth has been deprecated') }),
    signInWithOAuth: (params?: any) => Promise.resolve({ data: null, error: new Error('Supabase auth has been deprecated') }),
    signUp: (params?: any) => Promise.resolve({ data: null, error: new Error('Supabase auth has been deprecated') }),
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
    setSession: (params?: any) => Promise.resolve({ data: { session: null }, error: null }),
    refreshSession: (params?: any) => Promise.resolve({ data: { session: null }, error: null }),
  },
  
  from: (tableName: string) => {
    // Create a query chain with appropriate chainable methods
    const queryChain = createQueryResult(tableName);
    
    return {
      select: (columns: string = '*') => queryChain,
      insert: (data: any) => {
        const result = { 
          data: null, 
          error: new Error(`Supabase insert to ${tableName} has been deprecated`),
          select: () => queryChain
        };
        return result;
      },
      update: (data: any) => {
        return {
          eq: (column: string, value: any) => Promise.resolve({ data: null, error: new Error(`Supabase update to ${tableName} has been deprecated`) }),
          match: (criteria: any) => Promise.resolve({ data: null, error: new Error(`Supabase update to ${tableName} has been deprecated`) }),
          in: (column: string, values: any[]) => Promise.resolve({ data: null, error: new Error(`Supabase update to ${tableName} has been deprecated`) }),
          filter: (column: string, operator: string, value: any) => Promise.resolve({ data: null, error: new Error(`Supabase update to ${tableName} has been deprecated`) })
        };
      },
      upsert: (data: any) => {
        const result = {
          data: null, 
          error: new Error(`Supabase upsert to ${tableName} has been deprecated`),
          select: () => queryChain
        };
        return result;
      },
      delete: () => {
        return {
          eq: (column: string, value: any) => Promise.resolve({ data: null, error: new Error(`Supabase delete from ${tableName} has been deprecated`) }),
          match: (criteria: any) => Promise.resolve({ data: null, error: new Error(`Supabase delete from ${tableName} has been deprecated`) }),
          in: (column: string, values: any[]) => Promise.resolve({ data: null, error: new Error(`Supabase delete from ${tableName} has been deprecated`) }),
          filter: (column: string, operator: string, value: any) => Promise.resolve({ data: null, error: new Error(`Supabase delete from ${tableName} has been deprecated`) })
        };
      }
    };
  },
  
  storage: {
    from: (bucket: string) => ({
      upload: (path: string, file: any) => Promise.resolve({ data: null, error: new Error('Supabase storage has been deprecated') }),
      download: (path: string) => Promise.resolve({ data: null, error: new Error('Supabase storage has been deprecated') }),
      getPublicUrl: (path: string) => ({ data: { publicUrl: '' } }),
      remove: (paths: string[]) => Promise.resolve({ data: null, error: new Error('Supabase storage has been deprecated') })
    })
  },
  
  rpc: (func: string, params?: any) => Promise.resolve({ data: null, error: new Error(`Supabase RPC call to ${func} has been deprecated`) }),
  
  channel: (channelName: string) => {
    const channelObj = {
      on: (event: string, filter?: any, callback?: any) => {
        // Handle both forms of the on() method
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
    };
    return channelObj;
  },
  
  removeChannel: (channel: any) => {},
  
  // Add functions property for compatibility with some components
  functions: {
    invoke: (func: string, params?: any) => Promise.resolve({ data: null, error: new Error(`Supabase function ${func} has been deprecated`) })
  }
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
 * - src/lib/cloudflare/d1Worker.ts
 * - src/hooks/useD1Database.ts
 * 
 * For authentication, use:
 * - src/modules/auth/context/EOSAuthContext.tsx
 * - src/lib/eos/eosAuth.ts
 */
