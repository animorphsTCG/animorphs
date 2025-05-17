
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
    // Create a chainable API that mimics Supabase's query builder
    // but ultimately resolves to a simple object
    const createQueryBuilder = () => {
      const operations: Record<string, any> = {};
      const filters: Record<string, any> = {};
      
      const builder = {
        // Selection methods
        select: (columns?: string) => {
          operations.select = columns || '*';
          return builder;
        },
        
        // Insertion/update/delete methods
        insert: (data: any, options?: any) => {
          return Promise.resolve({ data: null, error: null });
        },
        update: (data: any, options?: any) => {
          return Promise.resolve({ data: null, error: null });
        },
        delete: (options?: any) => {
          return Promise.resolve({ data: null, error: null });
        },
        
        // Filter methods
        eq: (column: string, value: any) => {
          filters[column] = value;
          return builder;
        },
        neq: (column: string, value: any) => {
          filters[`${column}_neq`] = value;
          return builder;
        },
        gt: (column: string, value: any) => {
          filters[`${column}_gt`] = value;
          return builder;
        },
        gte: (column: string, value: any) => {
          filters[`${column}_gte`] = value;
          return builder;
        },
        lt: (column: string, value: any) => {
          filters[`${column}_lt`] = value;
          return builder;
        },
        lte: (column: string, value: any) => {
          filters[`${column}_lte`] = value;
          return builder;
        },
        in: (column: string, values: any[]) => {
          filters[`${column}_in`] = values;
          return builder;
        },
        contains: (column: string, value: any) => {
          filters[`${column}_contains`] = value;
          return builder;
        },
        containedBy: (column: string, value: any) => {
          filters[`${column}_containedBy`] = value;
          return builder;
        },
        ilike: (column: string, value: any) => {
          filters[`${column}_ilike`] = value;
          return builder;
        },
        like: (column: string, value: any) => {
          filters[`${column}_like`] = value;
          return builder;
        },
        range: (column: string, from: any, to: any) => {
          filters[`${column}_range`] = [from, to];
          return builder;
        },
        textSearch: (column: string, value: any, options?: any) => {
          filters[`${column}_textSearch`] = value;
          return builder;
        },
        filter: (column: string, operator: string, value: any) => {
          filters[`${column}_${operator}`] = value;
          return builder;
        },
        not: (column: string, operator: string, value: any) => {
          filters[`${column}_not_${operator}`] = value;
          return builder;
        },
        or: (filterStr: string, options?: any) => {
          filters.or = filterStr;
          return builder;
        },
        
        // Ordering & pagination
        order: (column: string, options?: any) => {
          operations.order = { column, options };
          return builder;
        },
        limit: (count: number) => {
          operations.limit = count;
          return builder;
        },
        
        // Execution methods
        single: () => {
          return Promise.resolve({ data: null, error: null });
        },
        maybeSingle: () => {
          return Promise.resolve({ data: null, error: null });
        },
        
        // Promise interface
        then: (onfulfilled: any) => {
          return Promise.resolve(onfulfilled({ data: null, error: null }));
        }
      };
      
      return builder;
    };
    
    return createQueryBuilder();
  }

  storage = {
    from: (bucket: string) => ({
      upload: (path: string, data: any, options?: any) => Promise.resolve({ data: null, error: null }),
      download: (path: string, options?: any) => Promise.resolve({ data: null, error: null }),
      getPublicUrl: (path: string, options?: any) => ({ data: { publicUrl: '' }, error: null })
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
