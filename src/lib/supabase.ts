
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

/**
 * Create a dummy data object that can be used in Supabase query results
 * This helps type checking by ensuring data is an object, not an array
 */
const createDummyData = (tableName: string) => {
  // Create a base object with common properties for all tables
  const baseObject = {
    id: 'dummy-id',
    created_at: new Date().toISOString()
  };

  // Add table-specific properties
  switch (tableName) {
    case 'profiles':
      return {
        ...baseObject,
        username: 'dummy-user',
        name: 'Dummy User',
        surname: 'Surname',
        country: 'Country',
        is_admin: false
      };
    case 'payment_status':
      return {
        ...baseObject,
        has_paid: false,
        payment_method: null,
        payment_date: null,
        transaction_id: null,
        updated_at: new Date().toISOString()
      };
    case 'music_subscriptions':
      return {
        ...baseObject,
        subscription_type: 'monthly',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        user_id: 'dummy-user-id'
      };
    case 'user_music_settings':
      return {
        ...baseObject,
        volume_level: 0.5,
        music_enabled: true,
        user_id: 'dummy-user-id'
      };
    case 'battle_lobbies':
      return {
        ...baseObject,
        name: 'Dummy Lobby',
        host_id: 'dummy-host-id',
        battle_type: '1v1',
        max_players: 2,
        status: 'waiting',
        use_music: true,
        use_timer: true,
        updated_at: new Date().toISOString()
      };
    case 'battle_invites':
      return {
        ...baseObject,
        user_id: 'dummy-user-id',
        lobby_id: 'dummy-lobby-id',
        invited_by: 'dummy-inviter-id',
        battle_type: '1v1',
        lobby_name: 'Dummy Lobby',
        is_accepted: false,
        is_rejected: false,
        responded_at: null
      };
    case 'songs':
      return {
        ...baseObject,
        title: 'Dummy Song',
        youtube_url: 'https://youtube.com/watch?v=dummyId',
        preview_start_seconds: 0,
        preview_duration_seconds: 30
      };
    case 'user_song_selections':
      return {
        ...baseObject,
        user_id: 'dummy-user-id',
        song_id: 'dummy-song-id'
      };
    default:
      return baseObject;
  }
};

// Helper to create a standard query result with full chaining
const createQueryResult = (tableName: string, isMultiple = false) => {
  const errorMsg = `Supabase query to ${tableName} has been deprecated`;
  
  // Create appropriate dummy data based on whether we expect multiple results
  const dummyData = isMultiple ? [createDummyData(tableName)] : createDummyData(tableName);
  
  // Create common result with data and error
  const result = {
    data: dummyData,
    error: null
  };
  
  // Chain methods that return the same chain for further method calls
  const chainMethods = {
    // Filter methods
    eq: (column: string, value: any) => chainMethods,
    neq: (column: string, value: any) => chainMethods,
    gt: (column: string, value: any) => chainMethods,
    gte: (column: string, value: any) => chainMethods,
    lt: (column: string, value: any) => chainMethods,
    lte: (column: string, value: any) => chainMethods,
    like: (column: string, value: any) => chainMethods,
    ilike: (column: string, pattern: string) => chainMethods,
    is: (column: string, value: any) => chainMethods,
    in: (column: string, values: any[]) => chainMethods,
    contains: (column: any, value: any) => chainMethods,
    containedBy: (column: any, value: any) => chainMethods,
    not: (column: string, value: any) => chainMethods,
    or: (filter: string, values: any[]) => chainMethods,
    filter: (column: string, operator: string, value: any) => chainMethods,
    
    // Query modification methods
    order: (column: string, { ascending = true } = {}) => chainMethods,
    limit: (count: number) => chainMethods,
    range: (from: number, to: number) => chainMethods,
    match: (query: any) => chainMethods,
    
    // Terminal methods that return a promise
    select: (columns: string = '*') => Promise.resolve(result),
    single: () => Promise.resolve(result),
    maybeSingle: () => Promise.resolve(result),
    execute: () => Promise.resolve(result),
    
    // Support direct promise chaining
    then: (onfulfilled: any) => Promise.resolve(result).then(onfulfilled),
    
    // Include data and error for immediate access
    data: dummyData,
    error: null
  };
  
  return chainMethods;
};

// Create a complete fake Supabase client with all stub methods
export const supabase = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signIn: () => Promise.resolve({ data: null, error: new Error('Supabase auth has been deprecated') }),
    signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase auth has been deprecated') }),
    signInWithOAuth: () => Promise.resolve({ data: null, error: new Error('Supabase auth has been deprecated') }),
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
  
  from: (tableName: string) => {
    // Create a query chain with appropriate chainable methods
    const queryChain = createQueryResult(tableName, true);
    
    // Return a full query builder with all methods
    return {
      select: (columns: string = '*') => queryChain,
      insert: (data: any) => {
        const result = { 
          data: createDummyData(tableName), 
          error: null,
          select: () => queryChain
        };
        return result;
      },
      update: (data: any) => {
        return {
          eq: (column: string, value: any) => Promise.resolve({ data: createDummyData(tableName), error: null }),
          match: (criteria: any) => Promise.resolve({ data: createDummyData(tableName), error: null }),
          in: (column: string, values: any[]) => Promise.resolve({ data: createDummyData(tableName), error: null }),
          filter: (column: string, operator: string, value: any) => Promise.resolve({ data: createDummyData(tableName), error: null })
        };
      },
      upsert: (data: any) => {
        const result = {
          data: createDummyData(tableName), 
          error: null,
          select: () => queryChain
        };
        return result;
      },
      delete: () => {
        return {
          eq: (column: string, value: any) => Promise.resolve({ data: null, error: null }),
          match: (criteria: any) => Promise.resolve({ data: null, error: null }),
          in: (column: string, values: any[]) => Promise.resolve({ data: null, error: null }),
          filter: (column: string, operator: string, value: any) => Promise.resolve({ data: null, error: null })
        };
      }
    };
  },
  
  storage: {
    from: (bucket: string) => ({
      upload: (path: string, file: any) => Promise.resolve({ data: { path }, error: null }),
      download: (path: string) => Promise.resolve({ data: new Blob(), error: null }),
      getPublicUrl: (path: string) => ({ data: { publicUrl: `https://stub-storage/${bucket}/${path}` } }),
      remove: (paths: string[]) => Promise.resolve({ data: { paths }, error: null })
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
    invoke: (functionName: string, options?: { body?: any }) => 
      Promise.resolve({ data: null, error: null }),
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
