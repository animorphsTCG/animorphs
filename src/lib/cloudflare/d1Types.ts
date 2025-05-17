
// This file adds missing type definitions for the Cloudflare D1 database

export interface EnhancedD1QueryResult<T> {
  data: T[] | null;
  error: Error | null;
  count?: number;
}

export interface EnhancedD1QueryBuilder<T> {
  select: (...args: any[]) => EnhancedD1QueryBuilder<T>;
  from: (table: string) => EnhancedD1QueryBuilder<T>;
  where: (condition: string, ...params: any[]) => EnhancedD1QueryBuilder<T>;
  eq: (column: string, value: any) => Promise<EnhancedD1QueryResult<T>>;
  not: (column: string, value: any) => EnhancedD1QueryBuilder<T>;
  insert: (values: Partial<T>) => Promise<EnhancedD1QueryResult<T>>;
  update: (values: Partial<T>) => EnhancedD1QueryBuilder<T>;
  delete: () => EnhancedD1QueryBuilder<T>;
  data: T[] | null;
  error: Error | null;
  get: () => Promise<T | null>;
}

export interface D1WorkerClient {
  query: <T>(sql: string, params?: any, token?: string) => Promise<T[]>;
  execute: <T>(sql: string, params?: any, token?: string) => Promise<T>;
  from: <T>(table: string) => EnhancedD1QueryBuilder<T>;
  extractData: <T>(result: any) => T[];
}
