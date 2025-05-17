
import { D1Database, D1Result } from '@cloudflare/workers-types';

// Define a type that combines D1 response capabilities with chainable query methods
export type EnhancedD1Database = {
  from: (table: string) => EnhancedD1QueryBuilder;
  raw: (query: string, params?: any[]) => Promise<D1Result>;
  exec: (query: string, params?: any[]) => Promise<D1Result>;
  batch: (statements: string[]) => Promise<D1Result[]>;
  prepare: (query: string) => D1PreparedStatement;
  rpc: (procedure: string, params?: any) => Promise<any>;
  channel?: (name: string, userId: string) => any;
};

export type D1PreparedStatement = {
  bind: (...params: any[]) => D1PreparedStatement;
  first: <T = any>(colName?: string) => Promise<T | null>;
  run: () => Promise<D1Result>;
  all: <T = any>() => Promise<T[]>;
};

export interface D1Response<T> {
  success: boolean;
  error?: Error;
  results?: T[];
  meta?: {
    duration: number;
    last_row_id?: number;
    changes?: number;
    served_by?: string;
    rows_read?: number;
    rows_written?: number;
  };
  data?: T[];
}

export type EnhancedD1QueryBuilder = {
  select: (...columns: string[]) => EnhancedD1QueryBuilder;
  insert: (data: Record<string, any> | Record<string, any>[]) => EnhancedD1QueryBuilder;
  update: (data: Record<string, any>) => EnhancedD1QueryBuilder;
  delete: () => EnhancedD1QueryBuilder;
  where: (column: string, operator: string, value: any) => EnhancedD1QueryBuilder;
  whereIn: (column: string, values: any[]) => EnhancedD1QueryBuilder;
  andWhere: (column: string, operator: string, value: any) => EnhancedD1QueryBuilder;
  orWhere: (column: string, operator: string, value: any) => EnhancedD1QueryBuilder;
  eq: (column: string, value: any) => Promise<D1Response<any>>;
  is: (column: string, value: any) => EnhancedD1QueryBuilder;
  not: (column: string, value: any) => EnhancedD1QueryBuilder;
  in: (column: string, values: any[]) => EnhancedD1QueryBuilder;
  ilike: (column: string, value: string) => EnhancedD1QueryBuilder;
  limit: (limit: number) => EnhancedD1QueryBuilder;
  offset: (offset: number) => EnhancedD1QueryBuilder;
  orderBy: (column: string, direction?: 'asc' | 'desc') => EnhancedD1QueryBuilder;
  order: (column: string, direction?: 'asc' | 'desc') => EnhancedD1QueryBuilder; // Alias for orderBy
  join: (table: string, column1: string, operator: string, column2: string) => EnhancedD1QueryBuilder;
  leftJoin: (table: string, column1: string, operator: string, column2: string) => EnhancedD1QueryBuilder;
  rightJoin: (table: string, column1: string, operator: string, column2: string) => EnhancedD1QueryBuilder;
  fullJoin: (table: string, column1: string, operator: string, column2: string) => EnhancedD1QueryBuilder;
  groupBy: (...columns: string[]) => EnhancedD1QueryBuilder;
  having: (column: string, operator: string, value: any) => EnhancedD1QueryBuilder;
  count: (column?: string) => Promise<number>;
  sum: (column: string) => Promise<number>;
  avg: (column: string) => Promise<number>;
  min: (column: string) => Promise<number>;
  max: (column: string) => Promise<number>;
  upsert: (data: Record<string, any>, conflictColumns: string[]) => EnhancedD1QueryBuilder;
  range: (column: string, lower: any, upper: any) => EnhancedD1QueryBuilder;
  first: <T = any>() => Promise<T | null>;
  maybeSingle: <T = any>() => Promise<T | null>;
  single: <T = any>() => Promise<T>;
  get: <T = any>() => Promise<T[]>;
  execute: () => Promise<D1Response<any>>;
  error?: Error;
  data?: any[];
};

// Create a mock implementation of the D1 database wrapper
export function createD1DatabaseWrapper(db: D1Database): EnhancedD1Database {
  const createQueryBuilder = (tableName: string): EnhancedD1QueryBuilder => {
    let query = {
      type: 'select',
      table: tableName,
      columns: ['*'],
      where: [] as { column: string; operator: string; value: any; logic?: 'AND' | 'OR' }[],
      joins: [] as { type: string; table: string; column1: string; operator: string; column2: string }[],
      orderByColumns: [] as { column: string; direction: 'asc' | 'desc' }[],
      groupByColumns: [] as string[],
      havingConditions: [] as { column: string; operator: string; value: any }[],
      limitValue: null as number | null,
      offsetValue: null as number | null,
      data: null as Record<string, any> | Record<string, any>[] | null,
      upsertConflictColumns: [] as string[],
    };

    // Build SQL query string based on the current state
    const buildQuery = (): { sql: string; params: any[] } => {
      let sql = '';
      const params: any[] = [];

      if (query.type === 'select') {
        sql = `SELECT ${query.columns.join(', ')} FROM ${query.table}`;
      } else if (query.type === 'insert') {
        if (!query.data) throw new Error('No data provided for insert');

        const data = Array.isArray(query.data) ? query.data : [query.data];
        if (data.length === 0) throw new Error('Empty data array');

        const columns = Object.keys(data[0]);
        sql = `INSERT INTO ${query.table} (${columns.join(', ')})`;

        if (query.upsertConflictColumns.length > 0) {
          // Handle upsert
          const valuesSql = data.map(() => `(${columns.map(() => '?').join(', ')})`).join(', ');
          sql += ` VALUES ${valuesSql}`;
          data.forEach(row => {
            columns.forEach(col => {
              params.push(row[col]);
            });
          });
          sql += ` ON CONFLICT(${query.upsertConflictColumns.join(', ')}) DO UPDATE SET `;
          sql += columns
            .filter(col => !query.upsertConflictColumns.includes(col))
            .map(col => `${col} = excluded.${col}`)
            .join(', ');
        } else {
          // Regular insert
          const valuesSql = data.map(() => `(${columns.map(() => '?').join(', ')})`).join(', ');
          sql += ` VALUES ${valuesSql}`;
          data.forEach(row => {
            columns.forEach(col => {
              params.push(row[col]);
            });
          });
        }
      } else if (query.type === 'update') {
        if (!query.data) throw new Error('No data provided for update');

        sql = `UPDATE ${query.table} SET `;
        const updates = Object.entries(query.data).map(([col, _]) => `${col} = ?`);
        sql += updates.join(', ');
        params.push(...Object.values(query.data));
      } else if (query.type === 'delete') {
        sql = `DELETE FROM ${query.table}`;
      }

      // Add joins
      query.joins.forEach(join => {
        sql += ` ${join.type} JOIN ${join.table} ON ${join.column1} ${join.operator} ${join.column2}`;
      });

      // Add where conditions
      if (query.where.length > 0) {
        sql += ' WHERE ';
        const whereClauses = query.where.map((condition, index) => {
          const logicOperator = index === 0 ? '' : `${condition.logic} `;
          if (condition.value === null) {
            if (condition.operator.toLowerCase() === '=' || condition.operator.toLowerCase() === 'is') {
              return `${logicOperator}${condition.column} IS NULL`;
            } else if (condition.operator.toLowerCase() === '!=' || condition.operator.toLowerCase() === 'is not') {
              return `${logicOperator}${condition.column} IS NOT NULL`;
            }
          } else if (Array.isArray(condition.value) && condition.operator.toLowerCase() === 'in') {
            const placeholders = condition.value.map(() => '?').join(', ');
            params.push(...condition.value);
            return `${logicOperator}${condition.column} IN (${placeholders})`;
          } else if (condition.operator.toLowerCase() === 'between') {
            params.push(condition.value[0], condition.value[1]);
            return `${logicOperator}${condition.column} BETWEEN ? AND ?`;
          } else if (condition.operator.toLowerCase() === 'ilike') {
            params.push(condition.value);
            return `${logicOperator}${condition.column} LIKE ? COLLATE NOCASE`;
          }
          params.push(condition.value);
          return `${logicOperator}${condition.column} ${condition.operator} ?`;
        });
        sql += whereClauses.join(' ');
      }

      // Add GROUP BY
      if (query.groupByColumns.length > 0) {
        sql += ` GROUP BY ${query.groupByColumns.join(', ')}`;
      }

      // Add HAVING
      if (query.havingConditions.length > 0) {
        sql += ' HAVING ';
        const havingClauses = query.havingConditions.map((condition, index) => {
          const connector = index === 0 ? '' : 'AND ';
          params.push(condition.value);
          return `${connector}${condition.column} ${condition.operator} ?`;
        });
        sql += havingClauses.join(' ');
      }

      // Add ORDER BY
      if (query.orderByColumns.length > 0) {
        sql += ` ORDER BY ${query.orderByColumns.map(o => `${o.column} ${o.direction}`).join(', ')}`;
      }

      // Add LIMIT and OFFSET
      if (query.limitValue !== null) {
        sql += ` LIMIT ${query.limitValue}`;
      }
      if (query.offsetValue !== null) {
        sql += ` OFFSET ${query.offsetValue}`;
      }

      return { sql, params };
    };

    const execute = async (): Promise<D1Response<any>> => {
      try {
        const { sql, params } = buildQuery();
        const stmt = db.prepare(sql);
        const boundStmt = stmt.bind(...params);

        let result;
        if (query.type === 'select') {
          result = await boundStmt.all();
        } else if (['insert', 'update', 'delete'].includes(query.type)) {
          result = await boundStmt.run();
        } else {
          throw new Error(`Unsupported query type: ${query.type}`);
        }

        const response: D1Response<any> = {
          success: true,
          results: result.results || [],
          data: result.results || [],
          meta: {
            duration: result.meta?.duration || 0,
            last_row_id: result.meta?.last_row_id,
            changes: result.meta?.changes,
            served_by: result.meta?.served_by,
            rows_read: result.meta?.rows_read,
            rows_written: result.meta?.rows_written,
          }
        };

        // Add data and error properties directly to the queryBuilder
        const qb = queryBuilder as any;
        qb.data = response.data;
        qb.error = null;
        
        return response;
      } catch (error) {
        const err = error as Error;
        // Add error directly to the queryBuilder
        const qb = queryBuilder as any;
        qb.data = null;
        qb.error = err;
        
        return {
          success: false,
          error: err
        };
      }
    };

    // Create the query builder object with chainable methods
    const queryBuilder: EnhancedD1QueryBuilder = {
      select: (...columns) => {
        query.type = 'select';
        query.columns = columns.length > 0 ? columns : ['*'];
        return queryBuilder;
      },
      insert: (data) => {
        query.type = 'insert';
        query.data = data;
        return queryBuilder;
      },
      update: (data) => {
        query.type = 'update';
        query.data = data;
        return queryBuilder;
      },
      delete: () => {
        query.type = 'delete';
        return queryBuilder;
      },
      where: (column, operator, value) => {
        query.where.push({ column, operator, value, logic: 'AND' });
        return queryBuilder;
      },
      whereIn: (column, values) => {
        query.where.push({ column, operator: 'IN', value: values, logic: 'AND' });
        return queryBuilder;
      },
      andWhere: (column, operator, value) => {
        query.where.push({ column, operator, value, logic: 'AND' });
        return queryBuilder;
      },
      orWhere: (column, operator, value) => {
        query.where.push({ column, operator, value, logic: 'OR' });
        return queryBuilder;
      },
      eq: async (column, value) => {
        query.where.push({ column, operator: '=', value, logic: 'AND' });
        return execute();
      },
      is: (column, value) => {
        query.where.push({ column, operator: 'IS', value, logic: 'AND' });
        return queryBuilder;
      },
      not: (column, value) => {
        query.where.push({ column, operator: 'IS NOT', value, logic: 'AND' });
        return queryBuilder;
      },
      in: (column, values) => {
        query.where.push({ column, operator: 'IN', value: values, logic: 'AND' });
        return queryBuilder;
      },
      ilike: (column, value) => {
        query.where.push({ column, operator: 'ILIKE', value, logic: 'AND' });
        return queryBuilder;
      },
      range: (column, lower, upper) => {
        query.where.push({ column, operator: 'BETWEEN', value: [lower, upper], logic: 'AND' });
        return queryBuilder;
      },
      limit: (limit) => {
        query.limitValue = limit;
        return queryBuilder;
      },
      offset: (offset) => {
        query.offsetValue = offset;
        return queryBuilder;
      },
      orderBy: (column, direction = 'asc') => {
        query.orderByColumns.push({ column, direction });
        return queryBuilder;
      },
      order: (column, direction = 'asc') => {
        // Alias for orderBy
        return queryBuilder.orderBy(column, direction);
      },
      join: (table, column1, operator, column2) => {
        query.joins.push({ type: 'INNER', table, column1, operator, column2 });
        return queryBuilder;
      },
      leftJoin: (table, column1, operator, column2) => {
        query.joins.push({ type: 'LEFT', table, column1, operator, column2 });
        return queryBuilder;
      },
      rightJoin: (table, column1, operator, column2) => {
        query.joins.push({ type: 'RIGHT', table, column1, operator, column2 });
        return queryBuilder;
      },
      fullJoin: (table, column1, operator, column2) => {
        query.joins.push({ type: 'FULL', table, column1, operator, column2 });
        return queryBuilder;
      },
      groupBy: (...columns) => {
        query.groupByColumns.push(...columns);
        return queryBuilder;
      },
      having: (column, operator, value) => {
        query.havingConditions.push({ column, operator, value });
        return queryBuilder;
      },
      count: async (column = '*') => {
        query.columns = [`COUNT(${column}) as count`];
        const result = await execute();
        return result.success && result.results && result.results.length > 0
          ? Number((result.results[0] as any).count)
          : 0;
      },
      sum: async (column) => {
        query.columns = [`SUM(${column}) as sum`];
        const result = await execute();
        return result.success && result.results && result.results.length > 0
          ? Number((result.results[0] as any).sum)
          : 0;
      },
      avg: async (column) => {
        query.columns = [`AVG(${column}) as avg`];
        const result = await execute();
        return result.success && result.results && result.results.length > 0
          ? Number((result.results[0] as any).avg)
          : 0;
      },
      min: async (column) => {
        query.columns = [`MIN(${column}) as min`];
        const result = await execute();
        return result.success && result.results && result.results.length > 0
          ? Number((result.results[0] as any).min)
          : 0;
      },
      max: async (column) => {
        query.columns = [`MAX(${column}) as max`];
        const result = await execute();
        return result.success && result.results && result.results.length > 0
          ? Number((result.results[0] as any).max)
          : 0;
      },
      upsert: (data, conflictColumns) => {
        query.type = 'insert';
        query.data = data;
        query.upsertConflictColumns = conflictColumns;
        return queryBuilder;
      },
      first: async <T>() => {
        query.limitValue = 1;
        const result = await execute();
        return result.success && result.results && result.results.length > 0
          ? (result.results[0] as T)
          : null;
      },
      single: async <T>() => {
        query.limitValue = 1;
        const result = await execute();
        if (!result.success || !result.results || result.results.length === 0) {
          throw new Error("No record found");
        }
        return result.results[0] as T;
      },
      maybeSingle: async <T>() => {
        query.limitValue = 1;
        const result = await execute();
        return result.success && result.results && result.results.length > 0
          ? (result.results[0] as T)
          : null;
      },
      get: async <T>() => {
        const result = await execute();
        return result.success && result.results ? (result.results as T[]) : [];
      },
      execute
    };

    return queryBuilder;
  };

  return {
    from: (table) => createQueryBuilder(table),
    raw: async (query, params) => {
      const stmt = db.prepare(query);
      if (params) {
        return stmt.bind(...params).all();
      }
      return stmt.all();
    },
    exec: async (query, params) => {
      const stmt = db.prepare(query);
      if (params) {
        return stmt.bind(...params).run();
      }
      return stmt.run();
    },
    batch: async (statements) => {
      const batch = db.batch(statements.map(s => db.prepare(s)));
      return batch.run();
    },
    prepare: (query) => db.prepare(query),
    rpc: async (procedure, params = {}) => {
      const stmt = db.prepare(`CALL ${procedure}(?)`);
      return stmt.bind(JSON.stringify(params)).run();
    },
    channel: (name, userId) => createChannel(name, userId)
  };
}

// Export a mock D1 database wrapper for use in the application
// This will be replaced in production with a real D1 database
export const d1 = createD1DatabaseWrapper({} as D1Database);

// Helper function to create a channel for real-time communication
export function createChannel(name: string, userId: string) {
  return {
    name,
    userId,
    subscribed: false,
    subscribe: async () => true,
    unsubscribe: async () => true,
    publish: async (event: string, payload: any) => true
  };
}
