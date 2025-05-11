
/**
 * Cloudflare D1 Database Client
 * Handles database operations with Cloudflare D1
 */

// Base URL for Cloudflare Worker with D1 binding
const CF_API_URL = 'https://db.animorphs.workers.dev';

export interface D1QueryOptions {
  params?: any[];
  timeout?: number;
}

export class D1Client {
  private token: string | null = null;
  
  constructor(token?: string) {
    if (token) {
      this.setToken(token);
    }
  }
  
  setToken(token: string): void {
    this.token = token;
  }
  
  clearToken(): void {
    this.token = null;
  }
  
  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    if (!this.token) {
      throw new Error('Authentication required for this operation');
    }
    
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
    
    return fetch(url, {
      ...options,
      headers
    });
  }
  
  /**
   * Execute a database query
   */
  async query<T = any>(sql: string, options: D1QueryOptions = {}): Promise<T[]> {
    try {
      const response = await this.fetchWithAuth(`${CF_API_URL}/query`, {
        method: 'POST',
        body: JSON.stringify({
          sql,
          params: options.params || [],
          timeout: options.timeout
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Database query failed');
      }
      
      const result = await response.json();
      return result.results as T[];
    } catch (error) {
      console.error('[D1] Query error:', error);
      throw error;
    }
  }
  
  /**
   * Execute a database batch transaction
   */
  async batch(statements: Array<{ sql: string, params?: any[] }>): Promise<void> {
    try {
      const response = await this.fetchWithAuth(`${CF_API_URL}/batch`, {
        method: 'POST',
        body: JSON.stringify({ statements })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Database batch operation failed');
      }
    } catch (error) {
      console.error('[D1] Batch error:', error);
      throw error;
    }
  }
  
  /**
   * Get a single row from the database
   */
  async getOne<T = any>(sql: string, options: D1QueryOptions = {}): Promise<T | null> {
    const results = await this.query<T>(sql, options);
    return results.length > 0 ? results[0] : null;
  }
  
  /**
   * Insert data into the database
   */
  async insert(table: string, data: Record<string, any>): Promise<void> {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(col => data[col]);
    
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
    
    await this.query(sql, { params: values });
  }
  
  /**
   * Update data in the database
   */
  async update(table: string, data: Record<string, any>, whereClause: string, whereParams: any[]): Promise<void> {
    const columns = Object.keys(data);
    const setClauses = columns.map(col => `${col} = ?`).join(', ');
    const values = columns.map(col => data[col]);
    
    const sql = `UPDATE ${table} SET ${setClauses} WHERE ${whereClause}`;
    
    await this.query(sql, { params: [...values, ...whereParams] });
  }
  
  /**
   * Delete data from the database
   */
  async delete(table: string, whereClause: string, whereParams: any[]): Promise<void> {
    const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
    await this.query(sql, { params: whereParams });
  }
}

// Create a singleton instance
export const d1Client = new D1Client();

// Helper function to initialize the client with a token
export const initializeD1Client = (token: string): void => {
  d1Client.setToken(token);
};
