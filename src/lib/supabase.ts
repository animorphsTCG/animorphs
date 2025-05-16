
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

// Helper function to create result objects consistent with Supabase return types
const createResultObject = <T = any>(data: T | null = null, error: Error | null = null) => {
  return {
    data,
    error
  };
};

/**
 * Create a dummy data object that can be used in Supabase query results
 */
const createDummyData = (tableName: string, asArray = false) => {
  // Create a base object with common properties for all tables
  const baseObject = {
    id: 'dummy-id',
    created_at: new Date().toISOString()
  };

  // Add table-specific properties
  let result;
  switch (tableName) {
    case 'profiles':
      result = {
        ...baseObject,
        username: 'dummy-user',
        name: 'Dummy User',
        surname: 'Surname',
        country: 'Country',
        is_admin: false
      };
      break;
    case 'payment_status':
      result = {
        ...baseObject,
        has_paid: false,
        payment_method: null,
        payment_date: null,
        transaction_id: null,
        updated_at: new Date().toISOString()
      };
      break;
    case 'music_subscriptions':
      result = {
        ...baseObject,
        subscription_type: 'monthly',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        user_id: 'dummy-user-id'
      };
      break;
    case 'user_music_settings':
      result = {
        ...baseObject,
        volume_level: 0.5,
        music_enabled: true,
        user_id: 'dummy-user-id'
      };
      break;
    case 'battle_lobbies':
      result = {
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
      break;
    case 'battle_invites':
      result = {
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
      break;
    case 'songs':
      result = {
        ...baseObject,
        title: 'Dummy Song',
        youtube_url: 'https://youtube.com/watch?v=dummyId',
        preview_start_seconds: 0,
        preview_duration_seconds: 30
      };
      break;
    case 'user_song_selections':
      result = {
        ...baseObject,
        user_id: 'dummy-user-id',
        song_id: 'dummy-song-id'
      };
      break;
    default:
      result = baseObject;
  }

  return asArray ? [result] : result;
};

// Create a final query result function to standardize promises
const finalQueryResult = <T = any>(data: T, error = null) => {
  return Promise.resolve({ data, error });
};

// Helper to create a standard query result with full chaining
const createQueryBuilder = (tableName: string, isMultiple = false) => {
  // Create appropriate dummy data
  const dummyData = createDummyData(tableName, isMultiple);
  
  // This stores the terminal operation function
  let terminalOperation = () => finalQueryResult(dummyData);
  
  // Chain methods that return the same chain for further method calls
  const builder = {
    // Filter methods
    eq: (column: string, value: any) => builder,
    neq: (column: string, value: any) => builder,
    gt: (column: string, value: any) => builder,
    gte: (column: string, value: any) => builder,
    lt: (column: string, value: any) => builder,
    lte: (column: string, value: any) => builder,
    like: (column: string, value: any) => builder,
    ilike: (column: string, pattern: string) => builder,
    is: (column: string, value: any) => builder,
    in: (column: string, values: any[]) => builder,
    contains: (column: any, value: any) => builder,
    containedBy: (column: any, value: any) => builder,
    not: (column: string, value: any) => builder,
    or: (filter: string, values: any[]) => builder,
    filter: (column: string, operator: string, value: any) => builder,
    
    // Query modification methods
    order: (column: string, { ascending = true } = {}) => builder,
    limit: (count: number) => builder,
    range: (from: number, to: number) => builder,
    match: (query: any) => builder,
    
    // Terminal methods that return a promise with the correct structure
    select: (columns: string = '*') => terminalOperation(),
    single: () => finalQueryResult(isMultiple ? dummyData[0] : dummyData),
    maybeSingle: () => finalQueryResult(isMultiple ? dummyData[0] : dummyData), 
    execute: () => terminalOperation(),
    
    // Support direct promise chaining - crucial for await compatibility
    then: (onfulfilled: any) => terminalOperation().then(onfulfilled),
    catch: (onrejected: any) => terminalOperation().catch(onrejected),
    finally: (onfinally: any) => terminalOperation().finally(onfinally),
    
    // Expose data and error directly for synchronous access
    data: dummyData,
    error: null
  };
  
  return builder;
};

// Create a complete fake Supabase client with all necessary methods
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
    const queryBuilder = createQueryBuilder(tableName, true);
    
    return {
      select: (columns: string = '*') => queryBuilder,
      insert: (data: any) => {
        const result = {
          data: createDummyData(tableName),
          error: null,
          select: () => queryBuilder
        };
        return result;
      },
      update: (data: any) => {
        return {
          eq: (column: string, value: any) => finalQueryResult(createDummyData(tableName)),
          match: (criteria: any) => finalQueryResult(createDummyData(tableName)),
          in: (column: string, values: any[]) => finalQueryResult(createDummyData(tableName)),
          filter: (column: string, operator: string, value: any) => finalQueryResult(createDummyData(tableName))
        };
      },
      upsert: (data: any) => {
        return {
          data: createDummyData(tableName), 
          error: null,
          select: () => queryBuilder
        };
      },
      delete: () => {
        return {
          eq: (column: string, value: any) => finalQueryResult(null),
          match: (criteria: any) => finalQueryResult(null),
          in: (column: string, values: any[]) => finalQueryResult(null),
          filter: (column: string, operator: string, value: any) => finalQueryResult(null)
        };
      }
    };
  },
  
  storage: {
    from: (bucket: string) => ({
      upload: (path: string, file: any) => finalQueryResult({ path }),
      download: (path: string) => finalQueryResult(new Blob()),
      getPublicUrl: (path: string) => ({ data: { publicUrl: `https://stub-storage/${bucket}/${path}` } }),
      remove: (paths: string[]) => finalQueryResult({ paths })
    })
  },
  
  rpc: (func: string, params?: any) => finalQueryResult(null, new Error(`Supabase RPC call to ${func} has been deprecated`)),
  
  channel: (channelName: string) => {
    return {
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
  },
  
  removeChannel: (channel: any) => {},
  
  // Add functions property for compatibility with components that use it
  functions: {
    invoke: (functionName: string, options?: { body?: any }) => 
      finalQueryResult(null),
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
