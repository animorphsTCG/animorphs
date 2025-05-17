
/**
 * D1Worker module
 * Simple wrapper for Cloudflare D1 database calls via Worker API
 */

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
}

// Export a singleton instance
export const d1Worker = new D1WorkerClient();

// Add the from method and extractData method to d1Worker
d1Worker.from = function<T = any>(table: string, authToken?: string): EnhancedD1QueryBuilder<T> {
  return new EnhancedD1QueryBuilder<T>(`SELECT * FROM ${table}`, {}, authToken);
};

d1Worker.extractData = function<T = any>(result: { data: T | null, error: Error | null }): T | null {
  if ('error' in result && result.error) {
    console.error('D1 query error:', result.error);
    return null;
  }
  return result.data;
};

// Export the enhanced query builder class
export class EnhancedD1QueryBuilder<T = any> {
  private sql: string;
  private options: D1QueryOptions;
  private authToken?: string;
  
  constructor(sql: string, options: D1QueryOptions = {}, authToken?: string) {
    this.sql = sql;
    this.options = { ...options };
    this.authToken = authToken;
  }
  
  eq(column: string, value: any): EnhancedD1QueryBuilder<T> {
    // Modify SQL to add WHERE clause
    if (this.sql.toLowerCase().includes('where')) {
      this.sql += ` AND ${column} = ?`;
    } else {
      this.sql += ` WHERE ${column} = ?`;
    }
    
    // Add param
    this.options.params = this.options.params || [];
    this.options.params.push(value);
    
    return this;
  }
  
  neq(column: string, value: any): EnhancedD1QueryBuilder<T> {
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
  
  async get(): Promise<{ data: T[], error: null } | { data: null, error: Error }> {
    return this.execute();
  }
  
  async execute(): Promise<{ data: T[], error: null } | { data: null, error: Error }> {
    try {
      // Add limit and offset to SQL if specified
      let finalSql = this.sql;
      
      if (this.options.limit !== undefined) {
        finalSql += ` LIMIT ${this.options.limit}`;
      }
      
      if (this.options.offset !== undefined) {
        finalSql += ` OFFSET ${this.options.offset}`;
      }
      
      const results = await d1Worker.query<T>(finalSql, { params: this.options.params }, this.authToken);
      return { data: results, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }
  
  async single(): Promise<{ data: T | null, error: null } | { data: null, error: Error }> {
    try {
      const { data, error } = await this.limit(1).execute();
      
      if (error) {
        return { data: null, error };
      }
      
      if (!data || data.length === 0) {
        return { data: null, error: null };
      }
      
      return { data: data[0], error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }
  
  async maybeSingle(): Promise<{ data: T | null, error: null } | { data: null, error: Error }> {
    return this.single();
  }
}
