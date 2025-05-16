
import { SupabaseClient } from '@/types/supabase';
import { d1Worker } from './cloudflare/d1Worker';

// This is a stub implementation to bridge Supabase references to D1Worker
// during migration
class SupabaseStub implements SupabaseClient {
  auth = {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signIn: () => Promise.resolve({ data: null, error: null }),
    signInWithPassword: () => Promise.resolve({ data: null, error: null }),
    signInWithOAuth: () => Promise.resolve({ data: null, error: null }),
    signUp: () => Promise.resolve({ data: null, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: null }, error: null })
  };

  from(table: string) {
    const resource = {
      select: () => resource,
      insert: (data: any) => Promise.resolve({ data: null, error: null }),
      update: (data: any) => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
      eq: (column: string, value: any) => resource,
      neq: (column: string, value: any) => resource,
      gt: (column: string, value: any) => resource,
      gte: (column: string, value: any) => resource,
      lt: (column: string, value: any) => resource,
      lte: (column: string, value: any) => resource,
      in: (column: string, values: any[]) => resource,
      contains: (column: string, value: any) => resource,
      containedBy: (column: string, value: any) => resource,
      range: (column: string, from: any, to: any) => resource,
      textSearch: (column: string, value: any) => resource,
      filter: (column: string, op: string, value: any) => resource,
      not: (column: string, op: string, value: any) => resource,
      or: (filters: string, op: string, value: any) => resource,
      order: (column: string, options?: any) => resource,
      limit: (count: number) => resource,
      single: () => Promise.resolve({ data: null, error: null }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      then: (onfulfilled: any) => Promise.resolve(onfulfilled({ data: null, error: null }))
    };
    return resource;
  }

  storage = {
    from: (bucket: string) => ({
      upload: () => Promise.resolve({ data: null, error: null }),
      download: () => Promise.resolve({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' }, error: null })
    })
  };

  rpc(func: string, params?: any) {
    return Promise.resolve({ data: null, error: null });
  }
  
  channel(channel: string) {
    return {
      subscribe: (cb?: any) => ({
        unsubscribe: () => {}
      }),
      on: (event: string, callback: any) => ({
        subscribe: (cb?: any) => ({
          unsubscribe: () => {}
        })
      })
    };
  }
  
  removeChannel(channel: any) {
    return;
  }
}

export const supabase = new SupabaseStub();
