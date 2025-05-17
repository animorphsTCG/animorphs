
/**
 * D1Worker module
 * Simple wrapper for Cloudflare D1 database calls via Worker API
 */
import { EnhancedD1QueryBuilder, EnhancedD1QueryResult } from './d1Types';

export interface D1Response<T = any> {
  results: T[];
  success: boolean;
  error?: string;
}

export interface D1QueryOptions {
  params?: any[];
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

class D1WorkerClient {
  private baseUrl: string = '/api/db';
  
  /**
   * Execute a SQL query
   */
  async query<T = any>(sql: string, options: D1QueryOptions = {}, authToken?: string): Promise<T[]> {
    try {
      const url = new URL(`${this.baseUrl}/query`, window.location.origin);
      
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          sql,
          params: options.params || [],
          limit: options.limit,
          offset: options.offset,
          orderBy: options.orderBy,
          orderDirection: options.orderDirection
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Database query failed');
      }
      
      const data: D1Response<T> = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Database operation failed');
      }
      
      return data.results;
    } catch (error) {
      console.error('D1 query error:', error);
      throw error;
    }
  }
  
  /**
   * Get a single record
   */
  async getOne<T = any>(sql: string, options: D1QueryOptions = {}, authToken?: string): Promise<T | null> {
    const results = await this.query<T>(sql, { ...options, limit: 1 }, authToken);
    return results.length > 0 ? results[0] : null;
  }
  
  /**
   * Execute a SQL mutation (INSERT, UPDATE, DELETE)
   */
  async execute(sql: string, options: D1QueryOptions = {}, authToken?: string): Promise<number> {
    try {
      const url = new URL(`${this.baseUrl}/execute`, window.location.origin);
      
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          sql,
          params: options.params || []
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Database execution failed');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Database operation failed');
      }
      
      return data.changed || 0;
    } catch (error) {
      console.error('D1 execute error:', error);
      throw error;
    }
  }
  
  /**
   * Insert a record
   */
  async insert<T = any>(table: string, data: Record<string, any>, authToken?: string): Promise<T | null> {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(data);
    
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    
    const results = await this.query<T>(sql, { params: values }, authToken);
    return results.length > 0 ? results[0] : null;
  }
  
  /**
   * Update records
   */
  async update<T = any>(
    table: string, 
    data: Record<string, any>, 
    whereClause: string, 
    whereParams: any[] = [],
    returningColumns: string = '*',
    authToken?: string
  ): Promise<T[]> {
    const updates: string[] = [];
    const values: any[] = [];
    
    Object.entries(data).forEach(([key, value]) => {
      updates.push(`${key} = ?`);
      values.push(value);
    });
    
    if (updates.length === 0) {
      throw new Error('No update data provided');
    }
    
    // Add the where params to values
    values.push(...whereParams);
    
    const sql = `
      UPDATE ${table}
      SET ${updates.join(', ')}
      WHERE ${whereClause}
      ${returningColumns ? `RETURNING ${returningColumns}` : ''}
    `;
    
    return await this.query<T>(sql, { params: values }, authToken);
  }
  
  /**
   * Delete records
   */
  async delete(
    table: string, 
    whereClause: string, 
    whereParams: any[] = [],
    authToken?: string
  ): Promise<number> {
    const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
    
    const response = await this.execute(sql, { params: whereParams }, authToken);
    return response;
  }

  /**
   * Create a query builder for a table
   */
  from<T = any>(table: string, authToken?: string): EnhancedD1QueryBuilder<T> {
    return new EnhancedD1QueryBuilderImpl<T>(`SELECT * FROM ${table}`, {}, authToken, this);
  }
  
  /**
   * Extract data from query results
   */
  extractData<T = any>(result: { data: T | null, error: Error | null }): T | null {
    if ('error' in result && result.error) {
      console.error('D1 query error:', result.error);
      return null;
    }
    return result.data;
  }
}

// Export a singleton instance
export const d1Worker = new D1WorkerClient();

// Export the enhanced query builder class
export class EnhancedD1QueryBuilderImpl<T = any> implements EnhancedD1QueryBuilder<T> {
  private sql: string;
  private options: D1QueryOptions;
  private authToken?: string;
  private client: D1WorkerClient;
  
  // Required properties to satisfy the interface
  data: T[] | null = null;
  error: Error | null = null;
  
  constructor(sql: string, options: D1QueryOptions = {}, authToken?: string, client: D1WorkerClient = d1Worker) {
    this.sql = sql;
    this.options = { ...options };
    this.authToken = authToken;
    this.client = client;
  }
  
  select(columns: string | string[]): EnhancedD1QueryBuilder<T> {
    const columnsStr = Array.isArray(columns) ? columns.join(', ') : columns;
    // Replace the SELECT part of the SQL with our new columns
    this.sql = this.sql.replace(/SELECT\s+.+?\s+FROM/i, `SELECT ${columnsStr} FROM`);
    return this;
  }
  
  from(table: string): EnhancedD1QueryBuilder<T> {
    // For chain method support
    this.sql = this.sql.replace(/FROM\s+.+?(\s+WHERE|\s+ORDER|\s+LIMIT|\s*$)/i, `FROM ${table}$1`);
    return this;
  }
  
  where(condition: string, ...params: any[]): EnhancedD1QueryBuilder<T> {
    // Add WHERE clause to SQL
    if (this.sql.toLowerCase().includes('where')) {
      this.sql += ` AND ${condition}`;
    } else {
      this.sql += ` WHERE ${condition}`;
    }
    
    // Add params
    this.options.params = this.options.params || [];
    this.options.params.push(...params);
    
    return this;
  }
  
  async eq(column: string, value: any): Promise<EnhancedD1QueryResult<T>> {
    // Modify SQL to add WHERE clause
    if (this.sql.toLowerCase().includes('where')) {
      this.sql += ` AND ${column} = ?`;
    } else {
      this.sql += ` WHERE ${column} = ?`;
    }
    
    // Add param
    this.options.params = this.options.params || [];
    this.options.params.push(value);
    
    try {
      const result = await this.execute();
      return {
        data: result.data,
        error: result.error
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
  
  not(column: string, value: any): EnhancedD1QueryBuilder<T> {
    // Modify SQL to add WHERE clause
    if (this.sql.toLowerCase().includes('where')) {
      this.sql += ` AND ${column} <> ?`;
    } else {
      this.sql += ` WHERE ${column} <> ?`;
    }
    
    // Add param
    this.options.params = this.options.params || [];
    this.options.params.push(value);
    
    return this;
  }
  
  gt(column: string, value: any): EnhancedD1QueryBuilder<T> {
    // Modify SQL to add WHERE clause
    if (this.sql.toLowerCase().includes('where')) {
      this.sql += ` AND ${column} > ?`;
    } else {
      this.sql += ` WHERE ${column} > ?`;
    }
    
    // Add param
    this.options.params = this.options.params || [];
    this.options.params.push(value);
    
    return this;
  }
  
  lt(column: string, value: any): EnhancedD1QueryBuilder<T> {
    // Modify SQL to add WHERE clause
    if (this.sql.toLowerCase().includes('where')) {
      this.sql += ` AND ${column} < ?`;
    } else {
      this.sql += ` WHERE ${column} < ?`;
    }
    
    // Add param
    this.options.params = this.options.params || [];
    this.options.params.push(value);
    
    return this;
  }
  
  gte(column: string, value: any): EnhancedD1QueryBuilder<T> {
    // Modify SQL to add WHERE clause
    if (this.sql.toLowerCase().includes('where')) {
      this.sql += ` AND ${column} >= ?`;
    } else {
      this.sql += ` WHERE ${column} >= ?`;
    }
    
    // Add param
    this.options.params = this.options.params || [];
    this.options.params.push(value);
    
    return this;
  }
  
  lte(column: string, value: any): EnhancedD1QueryBuilder<T> {
    // Modify SQL to add WHERE clause
    if (this.sql.toLowerCase().includes('where')) {
      this.sql += ` AND ${column} <= ?`;
    } else {
      this.sql += ` WHERE ${column} <= ?`;
    }
    
    // Add param
    this.options.params = this.options.params || [];
    this.options.params.push(value);
    
    return this;
  }
  
  like(column: string, pattern: string): EnhancedD1QueryBuilder<T> {
    // Modify SQL to add WHERE clause
    if (this.sql.toLowerCase().includes('where')) {
      this.sql += ` AND ${column} LIKE ?`;
    } else {
      this.sql += ` WHERE ${column} LIKE ?`;
    }
    
    // Add param
    this.options.params = this.options.params || [];
    this.options.params.push(pattern);
    
    return this;
  }
  
  in(column: string, values: any[]): EnhancedD1QueryBuilder<T> {
    if (!values.length) {
      // Special case: if values is empty, add a condition that always evaluates to false
      if (this.sql.toLowerCase().includes('where')) {
        this.sql += ` AND 1=0`;
      } else {
        this.sql += ` WHERE 1=0`;
      }
      return this;
    }
    
    const placeholders = values.map(() => '?').join(',');
    
    // Modify SQL to add WHERE clause
    if (this.sql.toLowerCase().includes('where')) {
      this.sql += ` AND ${column} IN (${placeholders})`;
    } else {
      this.sql += ` WHERE ${column} IN (${placeholders})`;
    }
    
    // Add params
    this.options.params = this.options.params || [];
    this.options.params.push(...values);
    
    return this;
  }
  
  order(column: string, direction: 'asc' | 'desc' = 'asc'): EnhancedD1QueryBuilder<T> {
    if (!this.sql.toLowerCase().includes('order by')) {
      this.sql += ` ORDER BY ${column} ${direction.toUpperCase()}`;
    } else {
      this.sql += `, ${column} ${direction.toUpperCase()}`;
    }
    
    return this;
  }
  
  orderBy(column: string, direction: 'asc' | 'desc' = 'asc'): EnhancedD1QueryBuilder<T> {
    return this.order(column, direction);
  }
  
  limit(count: number): EnhancedD1QueryBuilder<T> {
    this.options.limit = count;
    return this;
  }
  
  offset(count: number): EnhancedD1QueryBuilder<T> {
    this.options.offset = count;
    return this;
  }
  
  async get(): Promise<EnhancedD1QueryResult<T>> {
    return this.execute();
  }
  
  async execute(): Promise<EnhancedD1QueryResult<T>> {
    try {
      // Add limit and offset to SQL if specified
      let finalSql = this.sql;
      
      if (this.options.limit !== undefined) {
        finalSql += ` LIMIT ${this.options.limit}`;
      }
      
      if (this.options.offset !== undefined) {
        finalSql += ` OFFSET ${this.options.offset}`;
      }
      
      const results = await this.client.query<T>(finalSql, { params: this.options.params }, this.authToken);
      this.data = results;
      this.error = null;
      return { data: results, error: null };
    } catch (error) {
      this.data = null;
      this.error = error instanceof Error ? error : new Error('Unknown error');
      return { data: null, error: this.error };
    }
  }
  
  async single(): Promise<{ data: T | null, error: Error | null }> {
    try {
      const result = await this.limit(1).execute();
      
      if (result.error) {
        return { data: null, error: result.error };
      }
      
      if (!result.data || result.data.length === 0) {
        return { data: null, error: null };
      }
      
      return { data: result.data[0], error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }
  
  async maybeSingle(): Promise<{ data: T | null, error: Error | null }> {
    return this.single();
  }
  
  async insert(values: Partial<T>): Promise<EnhancedD1QueryResult<T>> {
    try {
      const tableName = this.extractTableName();
      if (!tableName) {
        throw new Error('Cannot determine table name from SQL');
      }
      
      const result = await this.client.insert<T>(
        tableName,
        values as Record<string, any>,
        this.authToken
      );
      
      if (result) {
        this.data = [result];
        this.error = null;
        return { data: [result], error: null };
      } else {
        this.data = null;
        this.error = new Error('Insert operation returned no data');
        return { data: null, error: this.error };
      }
    } catch (error) {
      this.data = null;
      this.error = error instanceof Error ? error : new Error('Unknown error');
      return { data: null, error: this.error };
    }
  }
  
  async update(values: Partial<T>): Promise<{ count: number, error: null } | { count: 0, error: Error }> {
    try {
      // Extract the table name from the SQL
      const tableName = this.extractTableName();
      if (!tableName) {
        throw new Error('Cannot determine table name from SQL');
      }
      
      // Extract where clause from the SQL
      let whereClause = '';
      let whereParams: any[] = [];
      
      if (this.sql.toLowerCase().includes('where')) {
        const whereMatch = this.sql.match(/WHERE\s+(.+?)(\s+ORDER\s+BY|\s+LIMIT|\s*$)/i);
        if (whereMatch) {
          whereClause = whereMatch[1];
          whereParams = this.options.params || [];
        }
      }
      
      if (!whereClause) {
        throw new Error('Cannot update without WHERE clause');
      }
      
      const count = await this.client.execute(
        `UPDATE ${tableName} SET ${
          Object.keys(values).map(key => `${key} = ?`).join(', ')
        } WHERE ${whereClause}`,
        { 
          params: [...Object.values(values as Record<string, any>), ...whereParams]
        },
        this.authToken
      );
      
      return { count, error: null };
    } catch (error) {
      return { count: 0, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }
  
  async delete(): Promise<{ count: number, error: null } | { count: 0, error: Error }> {
    try {
      // Extract the table name from the SQL
      const tableName = this.extractTableName();
      if (!tableName) {
        throw new Error('Cannot determine table name from SQL');
      }
      
      // Extract where clause from the SQL
      let whereClause = '';
      let whereParams: any[] = [];
      
      if (this.sql.toLowerCase().includes('where')) {
        const whereMatch = this.sql.match(/WHERE\s+(.+?)(\s+ORDER\s+BY|\s+LIMIT|\s*$)/i);
        if (whereMatch) {
          whereClause = whereMatch[1];
          whereParams = this.options.params || [];
        }
      }
      
      if (!whereClause) {
        throw new Error('Cannot delete without WHERE clause');
      }
      
      const count = await this.client.execute(
        `DELETE FROM ${tableName} WHERE ${whereClause}`,
        { params: whereParams },
        this.authToken
      );
      
      return { count, error: null };
    } catch (error) {
      return { count: 0, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }
  
  private extractTableName(): string | null {
    const tableMatch = this.sql.match(/FROM\s+([^\s]+)/i);
    return tableMatch ? tableMatch[1] : null;
  }
}
