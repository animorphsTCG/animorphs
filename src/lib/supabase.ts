
import { d1, createChannel } from './d1Database';

/**
 * @deprecated This is a compatibility layer for the migration from Supabase to D1.
 * New code should use d1Worker or d1 directly instead.
 */
export const supabase = d1;

/**
 * @deprecated This is a compatibility function for creating Supabase-like channels.
 * New code should use EOS presence system instead.
 */
export const createSupabaseChannel = createChannel;
