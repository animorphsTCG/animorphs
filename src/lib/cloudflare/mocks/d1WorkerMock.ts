
/**
 * D1Worker Mock for testing
 * This provides mock implementations of d1Worker methods
 */

import { D1QueryOptions } from '../d1Client';

// Mock database
const mockDatabase = {
  profiles: [],
  payment_status: [],
  battle_invites: [],
  battle_lobbies: [],
  lobby_participants: [],
  songs: []
};

export const d1WorkerMock = {
  query: async <T = any>(sql: string, options: D1QueryOptions = {}, token?: string): Promise<T[]> => {
    console.log('MOCK: d1Worker.query', { sql, options });
    return [];
  },
  
  getOne: async <T = any>(sql: string, options: D1QueryOptions = {}, token?: string): Promise<T | null> => {
    console.log('MOCK: d1Worker.getOne', { sql, options });
    return null;
  },
  
  insert: async <T = any>(
    table: string, 
    data: Record<string, any>,
    returning: string = 'id',
    token?: string
  ): Promise<T | null> => {
    console.log('MOCK: d1Worker.insert', { table, data });
    return { id: 'mock-id-' + Date.now() } as unknown as T;
  },
  
  update: async <T = any>(
    table: string, 
    data: Record<string, any>, 
    whereClause: string, 
    whereParams: any[],
    returning: string = '',
    token?: string
  ): Promise<T | null> => {
    console.log('MOCK: d1Worker.update', { table, data, whereClause, whereParams });
    return null;
  },
  
  delete: async (
    table: string, 
    whereClause: string, 
    whereParams: any[],
    token?: string
  ): Promise<number> => {
    console.log('MOCK: d1Worker.delete', { table, whereClause, whereParams });
    return 1;
  },
  
  transaction: async (
    statements: Array<{ sql: string, params?: any[] }>,
    token?: string
  ): Promise<void> => {
    console.log('MOCK: d1Worker.transaction', { statements });
    return;
  }
};
