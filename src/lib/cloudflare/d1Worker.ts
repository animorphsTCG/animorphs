
/**
 * Cloudflare D1 Database Worker
 * This worker handles database operations with Cloudflare D1
 */

// Configuration
const CF_WORKER_URL = 'https://db.animorphs.workers.dev';

// Standard HTTP headers for CORS and authentication
const getHeaders = (token?: string) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Error handler
class D1Error extends Error {
  status: number;
  
  constructor(message: string, status: number = 500) {
    super(message);
    this.name = 'D1Error';
    this.status = status;
  }
}

// Query interface
export interface QueryOptions {
  params?: any[];
  timeout?: number;
  metaOnly?: boolean;
}

// Database operations for D1
export const d1Worker = {
  // Execute a query and return results
  async query<T = any>(sql: string, options: QueryOptions = {}, token?: string): Promise<T[]> {
    try {
      const response = await fetch(`${CF_WORKER_URL}/query`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify({
          sql,
          params: options.params || [],
          timeout: options.timeout,
          metaOnly: options.metaOnly || false
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new D1Error(
          error.message || `Database query failed with status ${response.status}`,
          response.status
        );
      }
      
      const result = await response.json();
      return result.results as T[];
    } catch (error) {
      if (error instanceof D1Error) {
        throw error;
      }
      throw new D1Error(`Database error: ${error.message}`);
    }
  },
  
  // Get a single row
  async getOne<T = any>(sql: string, options: QueryOptions = {}, token?: string): Promise<T | null> {
    const results = await this.query<T>(sql, options, token);
    return results.length > 0 ? results[0] : null;
  },
  
  // Insert a row and return the ID
  async insert<T = any>(
    table: string, 
    data: Record<string, any>,
    returning: string = 'id',
    token?: string
  ): Promise<T | null> {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(col => data[col]);
    
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) 
                VALUES (${placeholders})
                ${returning ? `RETURNING ${returning}` : ''}`;
    
    return this.getOne<T>(sql, { params: values }, token);
  },
  
  // Update row(s)
  async update<T = any>(
    table: string, 
    data: Record<string, any>, 
    whereClause: string, 
    whereParams: any[],
    returning: string = '',
    token?: string
  ): Promise<T | null> {
    const columns = Object.keys(data);
    const setClauses = columns.map(col => `${col} = ?`).join(', ');
    const values = [...columns.map(col => data[col]), ...whereParams];
    
    const sql = `UPDATE ${table} 
                SET ${setClauses} 
                WHERE ${whereClause}
                ${returning ? `RETURNING ${returning}` : ''}`;
    
    if (returning) {
      return this.getOne<T>(sql, { params: values }, token);
    } else {
      await this.query(sql, { params: values }, token);
      return null;
    }
  },
  
  // Delete row(s)
  async delete(
    table: string, 
    whereClause: string, 
    whereParams: any[],
    token?: string
  ): Promise<number> {
    const sql = `DELETE FROM ${table} WHERE ${whereClause} RETURNING id`;
    const results = await this.query(sql, { params: whereParams }, token);
    return results.length;
  },
  
  // Execute multiple statements as a transaction
  async transaction(
    statements: Array<{ sql: string, params?: any[] }>,
    token?: string
  ): Promise<void> {
    try {
      const response = await fetch(`${CF_WORKER_URL}/transaction`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify({ statements })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new D1Error(
          error.message || `Transaction failed with status ${response.status}`,
          response.status
        );
      }
    } catch (error) {
      if (error instanceof D1Error) {
        throw error;
      }
      throw new D1Error(`Transaction error: ${error.message}`);
    }
  }
};
