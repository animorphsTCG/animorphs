
import { d1Database } from './d1Database';
import { createChannel, createChannelWithCallback } from './channel';

/**
 * @deprecated This is a compatibility layer for the migration from Supabase to D1.
 * New code should use d1Database directly instead.
 */
export const supabase = {
  ...d1Database,
  from: (table: string) => {
    return d1Database.from(table);
  },
  channel: (name: string) => {
    return {
      on: (event: string) => {
        return {
          subscribe: (callback: (payload: any) => void) => {
            console.log(`Subscribing to channel ${name}, event: ${event}`);
            const { subscription } = createChannelWithCallback(name, event, callback);
            return subscription;
          }
        };
      }
    };
  },
  removeChannel: (channel: any) => {
    if (channel && typeof channel.unsubscribe === 'function') {
      channel.unsubscribe();
    }
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
