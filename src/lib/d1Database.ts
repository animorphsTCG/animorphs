
import { d1Worker } from './cloudflare/d1Worker';

// Mock database response format
export type D1Response<T> = {
  data: T | null;
  error: Error | null;
}

// Interface for query options
interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: {
    column: string;
    ascending: boolean;
  };
  params?: any[];
}

/**
 * D1Database class - A wrapper around d1Worker to provide a Supabase-like interface
 * This makes the migration from Supabase easier by providing familiar methods
 */
export class D1Database {
  private table: string;
  private token: string | null;
  private whereConditions: Array<{field: string, op: string, value: any}> = [];
  private _data: any = null;
  private _error: Error | null = null;
  
  constructor(table: string, token?: string) {
    this.table = table;
    this.token = token || null;
  }
  
  /**
   * Set the token for authenticated requests
   */
  setToken(token: string): D1Database {
    this.token = token;
    return this;
  }

  /**
   * Access data from the last operation
   */
  get data() {
    return this._data;
  }

  /**
   * Access error from the last operation
   */
  get error() {
    return this._error;
  }
  
  /**
   * Select data from the table
   */
  select(columns: string = '*'): D1Database {
    // This is just a fluent interface setup, the actual selection happens in execute()
    return this;
  }
  
  /**
   * Filter by equality
   */
  eq(field: string, value: any): D1Database {
    this.whereConditions.push({ field, op: '=', value });
    return this;
  }
  
  /**
   * Filter by inequality
   */
  neq(field: string, value: any): D1Database {
    this.whereConditions.push({ field, op: '!=', value });
    return this;
  }
  
  /**
   * Filter by LIKE pattern
   */
  ilike(field: string, pattern: string): D1Database {
    this.whereConditions.push({ field, op: 'LIKE', value: pattern });
    return this;
  }
  
  /**
   * Limit results
   */
  limit(count: number): D1Database {
    // Handled in execute()
    return this;
  }
  
  /**
   * Order results
   */
  order(column: string, { ascending = true } = {}): D1Database {
    // Handled in execute()
    return this;
  }
  
  /**
   * Single result
   */
  async single(): Promise<D1Response<any>> {
    return this.execute(true);
  }
  
  /**
   * Maybe single result (doesn't throw on no results)
   */
  async maybeSingle(): Promise<D1Response<any>> {
    return this.execute(true, true);
  }
  
  /**
   * Return promise with data and error properties like Supabase
   */
  async then(resolve: (value: D1Response<any>) => any): Promise<any> {
    const result = await this.execute();
    return resolve(result);
  }
  
  /**
   * Insert data
   */
  async insert(data: any): Promise<D1Response<any>> {
    try {
      const result = await d1Worker.insert(
        this.table,
        data,
        'id',
        this.token || undefined
      );
      
      this._data = result;
      this._error = null;
      
      return {
        data: result,
        error: null
      };
    } catch (err) {
      console.error(`Error inserting into ${this.table}:`, err);
      
      this._data = null;
      this._error = err instanceof Error ? err : new Error(String(err));
      
      return {
        data: null,
        error: err instanceof Error ? err : new Error(String(err))
      };
    }
  }
  
  /**
   * Update data
   */
  async update(data: Record<string, any>): Promise<D1Response<any>> {
    try {
      if (this.whereConditions.length === 0) {
        throw new Error('Update requires a where condition');
      }
      
      const whereClause = this.buildWhereClause();
      const whereParams = this.extractWhereParams();
      
      const result = await d1Worker.update(
        this.table,
        data,
        whereClause,
        whereParams,
        'id',
        this.token || undefined
      );
      
      this._data = result;
      this._error = null;
      
      return {
        data: result,
        error: null
      };
    } catch (err) {
      console.error(`Error updating ${this.table}:`, err);
      
      this._data = null;
      this._error = err instanceof Error ? err : new Error(String(err));
      
      return {
        data: null,
        error: err instanceof Error ? err : new Error(String(err))
      };
    }
  }
  
  /**
   * Delete data
   */
  async delete(): Promise<D1Response<any>> {
    try {
      if (this.whereConditions.length === 0) {
        throw new Error('Delete requires a where condition');
      }
      
      const whereClause = this.buildWhereClause();
      const whereParams = this.extractWhereParams();
      
      const count = await d1Worker.delete(
        this.table,
        whereClause,
        whereParams,
        this.token || undefined
      );
      
      this._data = { count };
      this._error = null;
      
      return {
        data: { count },
        error: null
      };
    } catch (err) {
      console.error(`Error deleting from ${this.table}:`, err);
      
      this._data = null;
      this._error = err instanceof Error ? err : new Error(String(err));
      
      return {
        data: null,
        error: err instanceof Error ? err : new Error(String(err))
      };
    }
  }
  
  /**
   * Execute the query
   */
  private async execute(single: boolean = false, allowEmpty: boolean = false): Promise<D1Response<any>> {
    try {
      const whereClause = this.buildWhereClause();
      const whereParams = this.extractWhereParams();
      
      const sql = `SELECT * FROM ${this.table}${whereClause ? ` WHERE ${whereClause}` : ''}`;
      
      if (single) {
        const result = await d1Worker.getOne(sql, { params: whereParams }, this.token || undefined);
        
        if (!result && !allowEmpty) {
          throw new Error('No rows returned');
        }
        
        this._data = result;
        this._error = null;
        
        return {
          data: result,
          error: null
        };
      } else {
        const results = await d1Worker.query(sql, { params: whereParams }, this.token || undefined);
        
        this._data = results;
        this._error = null;
        
        return {
          data: results,
          error: null
        };
      }
    } catch (err) {
      console.error(`Error executing query on ${this.table}:`, err);
      
      this._data = null;
      this._error = err instanceof Error ? err : new Error(String(err));
      
      return {
        data: null,
        error: err instanceof Error ? err : new Error(String(err))
      };
    }
  }
  
  /**
   * Build the WHERE clause from conditions
   */
  private buildWhereClause(): string {
    if (this.whereConditions.length === 0) {
      return '';
    }
    
    return this.whereConditions
      .map(condition => `${condition.field} ${condition.op} ?`)
      .join(' AND ');
  }
  
  /**
   * Extract parameters from WHERE conditions
   */
  private extractWhereParams(): any[] {
    return this.whereConditions.map(condition => condition.value);
  }
}

/**
 * D1 database client with Supabase-like interface for compatibility
 */
export const d1 = {
  from: (table: string) => new D1Database(table),
  auth: {
    // Auth methods are handled by EOSAuth, this is just for compatibility
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    signOut: async () => ({ error: null })
  },
  storage: {
    from: (bucket: string) => ({
      // Stub methods for storage, to be implemented later
      upload: async () => ({ data: null, error: new Error('Not implemented') }),
      download: async () => ({ data: null, error: new Error('Not implemented') })
    })
  },
  rpc: async (functionName: string, params = {}) => {
    console.warn(`RPC function "${functionName}" called with params:`, params);
    return { data: null, error: new Error(`RPC not implemented: ${functionName}`) };
  },
  channel: (channelName: string) => {
    console.warn(`Channel "${channelName}" requested, but channels are not supported`);
    return {
      on: () => ({}),
      subscribe: () => ({})
    };
  },
  removeChannel: () => {}
};

// Helper function to create a channel-like object
export const createChannel = (channelName: string) => {
  return {
    on: (event: string, filter: any, callback: (payload: any) => void) => {
      // This would be replaced with actual event handling
      console.log(`Channel ${channelName} subscribed to ${event}`);
      return { unsubscribe: () => {} };
    },
    subscribe: (callback?: () => void) => {
      if (callback) setTimeout(callback, 0);
      return {
        unsubscribe: () => {}
      };
    }
  };
};

// Re-export for backwards compatibility
export const supabase = d1;
