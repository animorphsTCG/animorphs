
/**
 * Epic Online Services (EOS) Presence Client
 * Handles user presence tracking via EOS and Cloudflare Durable Objects
 */

import { getEOSConfig } from './eosAuth';

// Presence data for a user
export interface UserPresence {
  user_id: string;
  username: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  last_seen: string;
  profile_image_url?: string | null;
  has_paid: boolean;
}

// Options for the presence hook
export interface PresenceOptions {
  autoReconnect?: boolean;
  heartbeatInterval?: number;
  logActivity?: boolean;
}

// Base URL for Cloudflare Worker endpoint
const CF_WORKER_URL = 'https://presence.animorphs.workers.dev';

/**
 * Track the user's presence status with both EOS and Cloudflare
 */
export const trackPresence = async (
  userId: string,
  status: 'online' | 'away' | 'busy' | 'offline',
  token: string
): Promise<void> => {
  const config = getEOSConfig();
  const now = new Date().toISOString();
  
  try {
    // Report presence to our Cloudflare Worker
    const cfResponse = await fetch(`${CF_WORKER_URL}/presence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        user_id: userId,
        status,
        last_seen: now,
        metadata: {
          last_ping: Date.now(),
          environment: config.isProduction ? 'production' : 'sandbox'
        }
      })
    });
    
    if (!cfResponse.ok) {
      throw new Error(`Presence update failed: ${cfResponse.statusText}`);
    }
    
    // If we have a valid EOS token, also update EOS presence (for friends list features)
    if (token && config.environmentId) {
      // EOS presence update would go here if we add friend list features
      // For now, we're using our Cloudflare Workers for presence tracking
    }
  } catch (error) {
    console.error('[EOS Presence] Error updating presence:', error);
    throw error;
  }
};

/**
 * Get online users
 */
export const getOnlineUsers = async (token: string): Promise<UserPresence[]> => {
  try {
    const response = await fetch(`${CF_WORKER_URL}/online-users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch online users: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.users || [];
  } catch (error) {
    console.error('[EOS Presence] Error fetching online users:', error);
    throw error;
  }
};
