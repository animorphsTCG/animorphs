
/**
 * D1Database service
 * A service to interact with Cloudflare D1 database with Supabase-like query API
 */

import { d1Worker } from './cloudflare/d1Worker';

// Type definitions for Supabase compatibility
export interface D1Result<T> {
  results?: T[];
  success: boolean;
  meta?: any;
  error?: Error;
}

// Query options
export interface QueryOptions {
  params?: any[];
  timeout?: number;
  metaOnly?: boolean;
}

// D1 prepared statement compatibility
export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = any>(): Promise<T | null>;
  all<T = any>(): Promise<T[]>;
  raw<T = any>(): Promise<T[]>;
  run(): Promise<D1Result<any>>;
  meta(): Promise<any>;
  timeout(ms: number): D1PreparedStatement;
}

// Response interface for enhanced D1 responses
export interface D1Response<T> {
  data: T[];
  count?: number;
  error: Error | null;
}

// Supabase-compatible filter types
export type MatchFilter = { [key: string]: any };
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'is';

/**
 * Enhanced D1 Query Builder - provides Supabase-like query API
 */
export class EnhancedD1QueryBuilder<T = any> {
  private table: string;
  private conditions: string[] = [];
  private params: any[] = [];
  private orderByClause: string = '';
  private limitClause: number | null = null;
  private offsetClause: number | null = null;
  private selectColumns: string[] = ['*'];
  private token?: string;

  constructor(table: string, token?: string) {
    this.table = table;
    this.token = token;
  }

  /**
   * Select specific columns
   */
  select(...columns: string[]): EnhancedD1QueryBuilder<T> {
    if (columns.length > 0) {
      this.selectColumns = columns;
    }
    return this;
  }

  /**
   * Filter by equality
   */
  eq(column: string, value: any): EnhancedD1QueryBuilder<T> {
    this.conditions.push(`${column} = ?`);
    this.params.push(value);
    return this;
  }

  /**
   * Filter by inequality
   */
  neq(column: string, value: any): EnhancedD1QueryBuilder<T> {
    this.conditions.push(`${column} != ?`);
    this.params.push(value);
    return this;
  }

  /**
   * Filter by greater than
   */
  gt(column: string, value: any): EnhancedD1QueryBuilder<T> {
    this.conditions.push(`${column} > ?`);
    this.params.push(value);
    return this;
  }

  /**
   * Filter by greater than or equal
   */
  gte(column: string, value: any): EnhancedD1QueryBuilder<T> {
    this.conditions.push(`${column} >= ?`);
    this.params.push(value);
    return this;
  }

  /**
   * Filter by less than
   */
  lt(column: string, value: any): EnhancedD1QueryBuilder<T> {
    this.conditions.push(`${column} < ?`);
    this.params.push(value);
    return this;
  }

  /**
   * Filter by less than or equal
   */
  lte(column: string, value: any): EnhancedD1QueryBuilder<T> {
    this.conditions.push(`${column} <= ?`);
    this.params.push(value);
    return this;
  }

  /**
   * Filter by IN condition
   */
  in(column: string, values: any[]): EnhancedD1QueryBuilder<T> {
    if (values.length === 0) {
      // Empty IN clause would fail, so add an impossible condition
      this.conditions.push('1 = 0');
      return this;
    }
    
    const placeholders = values.map(() => '?').join(',');
    this.conditions.push(`${column} IN (${placeholders})`);
    this.params.push(...values);
    return this;
  }

  /**
   * Filter by IS condition (null/not null)
   */
  is(column: string, value: any): EnhancedD1QueryBuilder<T> {
    if (value === null) {
      this.conditions.push(`${column} IS NULL`);
    } else {
      this.conditions.push(`${column} IS NOT NULL`);
    }
    return this;
  }

  /**
   * Order results by column
   */
  order(column: string, direction: 'asc' | 'desc' = 'asc'): EnhancedD1QueryBuilder<T> {
    this.orderByClause = `ORDER BY ${column} ${direction.toUpperCase()}`;
    return this;
  }

  /**
   * Alias for order to match Supabase API
   */
  orderBy(column: string, direction: 'asc' | 'desc' = 'asc'): EnhancedD1QueryBuilder<T> {
    return this.order(column, direction);
  }

  /**
   * Limit number of results
   */
  limit(count: number): EnhancedD1QueryBuilder<T> {
    this.limitClause = count;
    return this;
  }

  /**
   * Offset results
   */
  offset(count: number): EnhancedD1QueryBuilder<T> {
    this.offsetClause = count;
    return this;
  }

  /**
   * Build SQL query with conditions
   */
  private buildQuery(): string {
    const columns = this.selectColumns.join(', ');
    let query = `SELECT ${columns} FROM ${this.table}`;
    
    if (this.conditions.length > 0) {
      query += ` WHERE ${this.conditions.join(' AND ')}`;
    }
    
    if (this.orderByClause) {
      query += ` ${this.orderByClause}`;
    }
    
    if (this.limitClause !== null) {
      query += ` LIMIT ${this.limitClause}`;
    }
    
    if (this.offsetClause !== null) {
      query += ` OFFSET ${this.offsetClause}`;
    }
    
    return query;
  }

  /**
   * Execute query and get all results
   */
  async get(): Promise<D1Response<T>> {
    try {
      const sql = this.buildQuery();
      const options: QueryOptions = { params: this.params };
      
      const results = await d1Worker.query<T>(sql, options, this.token);
      return {
        data: results || [],
        error: null
      };
    } catch (error) {
      console.error('Error executing query:', error);
      return {
        data: [],
        error: error as Error
      };
    }
  }

  /**
   * Get a single record
   */
  async single(): Promise<D1Response<T>> {
    try {
      const prevLimit = this.limitClause;
      this.limitClause = 1;
      
      const result = await this.get();
      this.limitClause = prevLimit;
      
      if (result.error) {
        throw result.error;
      }
      
      if (result.data.length === 0) {
        throw new Error('No rows returned from the query');
      }
      
      return {
        data: [result.data[0]],
        error: null
      };
    } catch (error) {
      return {
        data: [],
        error: error as Error
      };
    }
  }

  /**
   * Get a single record (or null if not found)
   */
  async maybeSingle(): Promise<D1Response<T>> {
    try {
      const prevLimit = this.limitClause;
      this.limitClause = 1;
      
      const result = await this.get();
      this.limitClause = prevLimit;
      
      if (result.error) {
        throw result.error;
      }
      
      return {
        data: result.data.length > 0 ? [result.data[0]] : [],
        error: null
      };
    } catch (error) {
      return {
        data: [],
        error: error as Error
      };
    }
  }

  /**
   * Insert new records
   */
  async insert(data: Partial<T> | Partial<T>[], options?: { returning?: string }): Promise<D1Response<T>> {
    try {
      const returningClause = options?.returning || 'id';
      const items = Array.isArray(data) ? data : [data];
      
      if (items.length === 0) {
        return { data: [], error: new Error('No data provided for insert') };
      }
      
      // We'll use the first item to determine column names
      const firstItem = items[0];
      const columns = Object.keys(firstItem);
      
      if (columns.length === 0) {
        return { data: [], error: new Error('No columns provided for insert') };
      }
      
      // Prepare SQL for multi-row insert
      const placeholders = items.map(() => 
        `(${columns.map(() => '?').join(',')})`
      ).join(',');
      
      const sql = `
        INSERT INTO ${this.table} (${columns.join(',')})
        VALUES ${placeholders}
        RETURNING ${returningClause}
      `;
      
      // Flatten all values in order
      const values = items.flatMap(item => 
        columns.map(col => (item as any)[col])
      );
      
      const result = await d1Worker.query<T>(sql, { params: values }, this.token);
      
      return {
        data: result || [],
        error: null
      };
    } catch (error) {
      console.error('Error in insert operation:', error);
      return {
        data: [],
        error: error as Error
      };
    }
  }

  /**
   * Update records
   */
  async update(data: Partial<T>, options?: { returning?: string }): Promise<D1Response<T>> {
    try {
      const returningClause = options?.returning || 'id';
      const columns = Object.keys(data);
      
      if (columns.length === 0) {
        return { data: [], error: new Error('No data provided for update') };
      }
      
      if (this.conditions.length === 0) {
        return { data: [], error: new Error('Update requires conditions') };
      }
      
      const setClause = columns.map(col => `${col} = ?`).join(', ');
      const updateValues = columns.map(col => (data as any)[col]);
      
      const sql = `
        UPDATE ${this.table} 
        SET ${setClause} 
        WHERE ${this.conditions.join(' AND ')}
        RETURNING ${returningClause}
      `;
      
      const values = [...updateValues, ...this.params];
      const result = await d1Worker.query<T>(sql, { params: values }, this.token);
      
      return {
        data: result || [],
        error: null
      };
    } catch (error) {
      console.error('Error in update operation:', error);
      return {
        data: [],
        error: error as Error
      };
    }
  }

  /**
   * Delete records
   */
  async delete(options?: { returning?: string }): Promise<D1Response<T>> {
    try {
      const returningClause = options?.returning || 'id';
      
      if (this.conditions.length === 0) {
        return { data: [], error: new Error('Delete requires conditions') };
      }
      
      const sql = `
        DELETE FROM ${this.table}
        WHERE ${this.conditions.join(' AND ')}
        RETURNING ${returningClause}
      `;
      
      const result = await d1Worker.query<T>(sql, { params: this.params }, this.token);
      
      return {
        data: result || [],
        error: null
      };
    } catch (error) {
      console.error('Error in delete operation:', error);
      return {
        data: [],
        error: error as Error
      };
    }
  }
}

/**
 * Main D1Database class
 */
export class D1Database {
  private token: string | null = null;
  
  constructor(token?: string) {
    if (token) {
      this.setToken(token);
    }
  }
  
  setToken(token: string): void {
    this.token = token;
  }
  
  /**
   * Create a query builder for a table
   */
  from<T = any>(table: string): EnhancedD1QueryBuilder<T> {
    return new EnhancedD1QueryBuilder<T>(table, this.token || undefined);
  }
  
  /**
   * Direct SQL query execution
   */
  async query<T = any>(sql: string, options?: QueryOptions): Promise<T[]> {
    try {
      const result = await d1Worker.query<T>(
        sql, 
        options,
        this.token || undefined
      );
      
      return result || [];
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }
  
  /**
   * Get a single row by SQL
   */
  async getOne<T = any>(sql: string, options?: QueryOptions): Promise<T | null> {
    try {
      const results = await this.query<T>(sql, options);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('GetOne error:', error);
      return null;
    }
  }
  
  /**
   * Execute a SQL statement (for INSERT, UPDATE, DELETE)
   */
  async execute(sql: string, params?: any[]): Promise<void> {
    try {
      await d1Worker.query(
        sql, 
        { params },
        this.token || undefined
      );
    } catch (error) {
      console.error('Execute error:', error);
      throw error;
    }
  }
  
  /**
   * Insert data to a table
   */
  async insert<T = any>(
    table: string, 
    data: Record<string, any>, 
    returning?: string,
    token?: string
  ): Promise<T | null> {
    try {
      const columns = Object.keys(data);
      const placeholders = columns.map(() => '?').join(',');
      const values = columns.map(c => data[c]);
      
      const returningClause = returning ? `RETURNING ${returning}` : 'RETURNING id';
      
      const sql = `
        INSERT INTO ${table} (${columns.join(',')})
        VALUES (${placeholders})
        ${returningClause}
      `;
      
      const effectiveToken = token || this.token || undefined;
      const result = await d1Worker.query<T>(sql, { params: values }, effectiveToken);
      
      return result && result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Insert error:', error);
      return null;
    }
  }
  
  /**
   * Update data in a table
   */
  async update<T = any>(
    table: string, 
    data: Record<string, any>, 
    whereClause: string,
    whereParams: any[],
    token?: string
  ): Promise<T | null> {
    try {
      const columns = Object.keys(data);
      const setClause = columns.map(col => `${col} = ?`).join(', ');
      const values = [...columns.map(c => data[c]), ...whereParams];
      
      const sql = `
        UPDATE ${table} 
        SET ${setClause} 
        WHERE ${whereClause}
        RETURNING id
      `;
      
      const effectiveToken = token || this.token || undefined;
      const result = await d1Worker.query<T>(sql, { params: values }, effectiveToken);
      
      return result && result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Update error:', error);
      return null;
    }
  }
  
  /**
   * Create or update a channel for real-time functionality
   * This is a compatibility layer for Supabase channels
   */
  channel(name: string) {
    return {
      on: (event: string) => {
        console.log(`Channel ${name} subscribed to ${event}`);
        return {
          subscribe: (callback: Function) => {
            console.log(`Subscribing to channel ${name} event ${event}`);
            // In a real implementation, this would connect to Durable Objects
            return {
              unsubscribe: () => {
                console.log(`Unsubscribing from channel ${name} event ${event}`);
              }
            };
          }
        };
      }
    };
  }
  
  /**
   * Remove a channel subscription
   */
  removeChannel(channel: any): void {
    console.log('Removing channel', channel);
    // In a real implementation, this would disconnect from Durable Objects
  }
  
  /**
   * Execute RPC (Remote Procedure Call)
   */
  async rpc(functionName: string, params?: any): Promise<{ data: any, error: Error | null }> {
    console.log(`RPC call to ${functionName}`, params);
    return { data: [], error: null };
  }
  
  // Profiles
  async getProfile(userId: string): Promise<any | null> {
    return this.getOne('SELECT * FROM profiles WHERE id = ?', { params: [userId] });
  }
  
  // Add other helpful methods based on your application needs
}

// Create a singleton instance
export const d1Database = new D1Database();
