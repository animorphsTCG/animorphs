
/**
 * d1Worker.ts
 * Client for interacting with Cloudflare D1 Worker
 */

export interface QueryOptions {
  params?: any[];
  timeout?: number;
  metaOnly?: boolean;
}

export interface D1Response<T> {
  success: boolean;
  results?: T[];
  error?: any;
}

const API_URL = import.meta.env.VITE_CLOUDFLARE_WORKER_URL || 'https://animorphs.workers.dev';

/**
 * D1 Worker client
 */
export const d1Worker = {
  /**
   * Execute a query against D1 database
   */
  async query<T = any>(sql: string, options: QueryOptions = {}, token?: string): Promise<T[]> {
    try {
      const response = await fetch(`${API_URL}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          sql,
          params: options.params || [],
          timeout: options.timeout,
          metaOnly: options.metaOnly || false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Query failed');
      }
      
      return data.results || [];
    } catch (error) {
      console.error('D1 query error:', error);
      throw error;
    }
  },

  /**
   * Get a single record
   */
  async getOne<T = any>(sql: string, options: QueryOptions = {}, token?: string): Promise<T | null> {
    try {
      const results = await this.query<T>(sql, options, token);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('GetOne error:', error);
      return null;
    }
  },

  /**
   * Insert data into a table
   */
  async insert<T = any>(
    table: string, 
    data: Record<string, any>,
    returning?: string | null,
    token?: string
  ): Promise<T | null> {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(key => data[key]);
    const returningClause = returning ? `RETURNING ${returning}` : 'RETURNING id';
    
    const sql = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders})
      ${returningClause}
    `;
    
    try {
      const result = await this.query<T>(sql, { params: values }, token);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Insert error:', error);
      return null;
    }
  },

  /**
   * Update data in a table
   */
  async update<T = any>(
    table: string,
    data: Record<string, any>,
    whereClause: string,
    whereParams: any[] = [],
    returning?: string | null,
    token?: string
  ): Promise<T | null> {
    const columns = Object.keys(data);
    const setClauses = columns.map(col => `${col} = ?`).join(', ');
    const values = [...columns.map(col => data[col]), ...whereParams];
    const returningClause = returning ? `RETURNING ${returning}` : 'RETURNING id';
    
    const sql = `
      UPDATE ${table}
      SET ${setClauses}
      WHERE ${whereClause}
      ${returningClause}
    `;
    
    try {
      const result = await this.query<T>(sql, { params: values }, token);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Update error:', error);
      return null;
    }
  },

  /**
   * Delete data from a table
   */
  async delete<T = any>(
    table: string,
    whereClause: string,
    whereParams: any[] = [],
    returning?: string,
    token?: string
  ): Promise<T[]> {
    const returningClause = returning ? `RETURNING ${returning}` : 'RETURNING id';
    
    const sql = `
      DELETE FROM ${table}
      WHERE ${whereClause}
      ${returningClause}
    `;
    
    try {
      return await this.query<T>(sql, { params: whereParams }, token);
    } catch (error) {
      console.error('Delete error:', error);
      return [];
    }
  },

  /**
   * Execute a SQL statement directly
   */
  async execute(
    sql: string,
    params: any[] = [],
    token?: string
  ): Promise<boolean> {
    try {
      await this.query(sql, { params }, token);
      return true;
    } catch (error) {
      console.error('Execute error:', error);
      return false;
    }
  },

  /**
   * Execute a batch of SQL statements in a transaction
   */
  async transaction(
    statements: { sql: string; params?: any[] }[],
    token?: string
  ): Promise<boolean> {
    try {
      await fetch(`${API_URL}/transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ statements })
      });
      return true;
    } catch (error) {
      console.error('Transaction error:', error);
      return false;
    }
  }
};
