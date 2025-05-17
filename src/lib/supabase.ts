
import { d1, createChannel } from './d1Database';

/**
 * @deprecated This is a compatibility layer for the migration from Supabase to D1.
 * New code should use d1Worker or d1 directly instead.
 */
export const supabase = {
  ...d1,
  from: (table: string) => {
    return d1.from(table);
  },
  channel: (name: string) => {
    return {
      on: () => {
        return {
          subscribe: () => {
            console.log(`Subscribing to channel ${name}`);
            return {};
          }
        };
      }
    };
  },
  removeChannel: (channel: any) => {
    console.log('Removing channel', channel);
  },
  rpc: (functionName: string, params?: any) => {
    console.log(`RPC call to ${functionName}`, params);
    return Promise.resolve({ data: [], error: null });
  }
};

/**
 * @deprecated This is a compatibility function for creating Supabase-like channels.
 * New code should use EOS presence system instead.
 */
export const createSupabaseChannel = createChannel;
