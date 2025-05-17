
// This file adds missing type definitions for the Cloudflare D1 database

export interface EnhancedD1QueryResult<T> {
  data: T[] | null;
  error: Error | null;
  count?: number;
}

export interface EnhancedD1QueryBuilder<T> {
  // Query building methods
  select: (...args: any[]) => EnhancedD1QueryBuilder<T>;
  from: (table: string) => EnhancedD1QueryBuilder<T>;
  where: (condition: string, ...params: any[]) => EnhancedD1QueryBuilder<T>;
  eq: (column: string, value: any) => Promise<EnhancedD1QueryResult<T>>;
  not: (column: string, value: any) => EnhancedD1QueryBuilder<T>;
  gt: (column: string, value: any) => EnhancedD1QueryBuilder<T>;
  lt: (column: string, value: any) => EnhancedD1QueryBuilder<T>;
  gte: (column: string, value: any) => EnhancedD1QueryBuilder<T>;
  lte: (column: string, value: any) => EnhancedD1QueryBuilder<T>;
  like: (column: string, pattern: string) => EnhancedD1QueryBuilder<T>;
  in: (column: string, values: any[]) => EnhancedD1QueryBuilder<T>;
  order: (column: string, direction?: 'asc' | 'desc') => EnhancedD1QueryBuilder<T>;
  orderBy: (column: string, direction?: 'asc' | 'desc') => EnhancedD1QueryBuilder<T>;
  limit: (count: number) => EnhancedD1QueryBuilder<T>;
  offset: (count: number) => EnhancedD1QueryBuilder<T>;
  
  // Data manipulation methods
  insert: (values: Partial<T>) => Promise<EnhancedD1QueryResult<T>>;
  update: (values: Partial<T>) => EnhancedD1QueryBuilder<T>;
  delete: () => EnhancedD1QueryBuilder<T>;
  
  // Execution methods
  get: () => Promise<EnhancedD1QueryResult<T>>;
  execute: () => Promise<EnhancedD1QueryResult<T>>;
  single: () => Promise<{ data: T | null, error: Error | null }>;
  maybeSingle: () => Promise<{ data: T | null, error: Error | null }>;
  
  // Properties that exist in the implementation but were missing from the interface
  data: T[] | null;
  error: Error | null;
}

export interface D1WorkerClient {
  query: <T>(sql: string, params?: any, token?: string) => Promise<T[]>;
  execute: <T>(sql: string, params?: any, token?: string) => Promise<T>;
  from: <T>(table: string) => EnhancedD1QueryBuilder<T>;
  extractData: <T>(result: any) => T[];
  getOne: <T>(sql: string, options?: any, authToken?: string) => Promise<T | null>;
  insert: <T>(table: string, data: Record<string, any>, authToken?: string) => Promise<T | null>;
  update: <T>(table: string, data: Record<string, any>, whereClause: string, whereParams: any[], returningColumns?: string, authToken?: string) => Promise<T[]>;
  delete: (table: string, whereClause: string, whereParams: any[], authToken?: string) => Promise<number>;
}

// This type is for consistency with the Supabase JS client's response structure
export interface D1QueryResponseCompatible<T> {
  data: T[] | T | null;
  error: Error | null;
  count?: number;
}

// Ensure the response from the .get() method matches what's expected in the codebase
export interface D1ExecuteResponse {
  count: number;
  error: Error | null;
}
