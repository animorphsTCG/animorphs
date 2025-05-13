
/**
 * Cloudflare D1 Database Worker
 * This worker handles database operations with Cloudflare D1
 */

// Configuration
// Get the appropriate worker URL based on environment
const getWorkerUrl = () => {
  // Check for custom domain from environment variable or use default
  const customDomain = import.meta.env.VITE_DB_WORKER_URL;
  if (customDomain) {
    return customDomain;
  }
  
  // Default worker URL - this should match the deployed worker name
  return 'https://db-worker.mythicmasters.workers.dev';
};

const CF_WORKER_URL = getWorkerUrl();

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
  async query(sql: string, options: QueryOptions = {}, token?: string) {
    try {
      console.log('D1Worker - Executing query:', sql.slice(0, 100) + '...');
      console.log('D1Worker - Worker URL:', CF_WORKER_URL);
      
      const response = await fetch(`${CF_WORKER_URL}/query`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify({
          sql,
          params: options.params || [],
          timeout: options.timeout,
          metaOnly: options.metaOnly || false
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        let errorMessage = `Database query failed with status ${response.status}`;
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          // If response can't be parsed as JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        
        console.error('D1Worker - Query error response:', errorMessage);
        throw new D1Error(errorMessage, response.status);
      }
      
      const result = await response.json();
      return result.results;
    } catch (error) {
      console.error('D1Worker - Query error:', error);
      if (error instanceof D1Error) {
        throw error;
      }
      throw new D1Error(`Database error: ${error.message}`);
    }
  },
  
  // Get a single row
  async getOne<T = any>(sql: string, options: QueryOptions = {}, token?: string): Promise<T | null> {
    const results = await this.query(sql, options, token) as T[];
    return results && results.length > 0 ? results[0] : null;
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
    
    const result = await this.query(sql, { params: values }, token);
    return result && result.length > 0 ? result[0] as T : null;
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
      const result = await this.query(sql, { params: values }, token);
      return result && result.length > 0 ? result[0] as T : null;
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
    return results ? results.length : 0;
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
        body: JSON.stringify({ statements }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        let errorMessage = `Transaction failed with status ${response.status}`;
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          // If response can't be parsed as JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        
        throw new D1Error(errorMessage, response.status);
      }
    } catch (error) {
      if (error instanceof D1Error) {
        throw error;
      }
      throw new D1Error(`Transaction error: ${error.message}`);
    }
  }
};

// Helper function to test connection to the worker
export const testD1Connection = async (): Promise<boolean> => {
  try {
    console.log('Testing connection to D1 worker at:', CF_WORKER_URL);
    const response = await fetch(`${CF_WORKER_URL}/health`, {
      credentials: 'include'
    });
    if (response.ok) {
      const data = await response.json();
      console.log('D1 worker connection test result:', data);
      return data.status === 'ok';
    }
    console.error('D1 worker connection test failed with status:', response.status);
    return false;
  } catch (error) {
    console.error('Failed to connect to D1 worker:', error);
    return false;
  }
};
